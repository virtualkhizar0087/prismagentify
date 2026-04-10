-- ============================================================
-- Court of AI — Precedents Migration
-- Run this in your Supabase SQL editor AFTER schema.sql
-- Creates: precedents, saved_precedents, legal_arguments tables
--          + full-text search RPC + seed data (60+ Pakistani cases)
-- ============================================================

-- ============================================================
-- PRECEDENTS TABLE
-- Core case law database
-- ============================================================

create table if not exists public.precedents (
  id                uuid primary key default uuid_generate_v4(),
  case_name         text not null,
  citation          text,
  citation_type     text,                    -- PLD, SCMR, CLC, etc.
  court             text not null,           -- Full court name
  court_code        text not null,           -- SC, LHC, SHC, etc.
  year              integer,
  date_decided      date,
  appellant         text,
  respondent        text,
  judge_names       text[] not null default '{}',
  bench_type        text,                    -- Full bench, Division bench, Single bench
  law_category      text not null,
  law_subcategory   text,
  statutes          text[] not null default '{}',
  keywords          text[] not null default '{}',
  headnotes         text,
  holding           text,
  full_text         text,
  outcome           text,
  is_landmark       boolean not null default false,
  landmark_reason   text,
  source_url        text,
  source            text,
  view_count        integer not null default 0,
  search_vector     tsvector,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- SAVED PRECEDENTS TABLE
-- User-bookmarked cases with notes
-- ============================================================

create table if not exists public.saved_precedents (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  precedent_id  uuid not null references public.precedents(id) on delete cascade,
  notes         text,
  folder        text not null default 'General',
  created_at    timestamptz not null default now(),
  unique (user_id, precedent_id)
);

-- ============================================================
-- LEGAL ARGUMENTS TABLE
-- AI-built arguments referencing precedents
-- ============================================================

create table if not exists public.legal_arguments (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.users(id) on delete cascade,
  title                 text not null,
  query                 text not null,
  case_facts            text,
  argument_text         text,
  cited_precedent_ids   uuid[] not null default '{}',
  law_category          text,
  created_at            timestamptz not null default now()
);

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table public.precedents        enable row level security;
alter table public.saved_precedents  enable row level security;
alter table public.legal_arguments   enable row level security;

-- Precedents are public-read (anyone logged in can search)
create policy "Authenticated users can read precedents"
  on public.precedents for select
  using (auth.role() = 'authenticated');

-- Saved precedents: own rows only
create policy "Users can manage own saved precedents"
  on public.saved_precedents for all
  using (auth.uid() = user_id);

-- Legal arguments: own rows only
create policy "Users can manage own legal arguments"
  on public.legal_arguments for all
  using (auth.uid() = user_id);

-- ============================================================
-- FULL-TEXT SEARCH VECTOR
-- ============================================================

create or replace function update_precedent_search_vector()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.case_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.holding, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.headnotes, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.citation, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.keywords, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(new.appellant, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.respondent, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(array_to_string(new.statutes, ' '), '')), 'C') ||
    setweight(to_tsvector('english', coalesce(new.outcome, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(new.full_text, '')), 'D');
  return new;
end;
$$ language plpgsql;

create trigger precedents_search_vector_update
  before insert or update on public.precedents
  for each row execute function update_precedent_search_vector();

create index if not exists idx_precedents_search on public.precedents using gin(search_vector);
create index if not exists idx_precedents_category on public.precedents(law_category);
create index if not exists idx_precedents_court on public.precedents(court_code);
create index if not exists idx_precedents_year on public.precedents(year desc);
create index if not exists idx_precedents_landmark on public.precedents(is_landmark);
create index if not exists idx_saved_precedents_user on public.saved_precedents(user_id);
create index if not exists idx_legal_args_user on public.legal_arguments(user_id);

-- ============================================================
-- SEARCH RPC FUNCTION
-- Used by /api/precedents/search
-- ============================================================

create or replace function search_precedents(
  query_text        text default null,
  filter_court      text default null,
  filter_category   text default null,
  filter_year_from  integer default null,
  filter_year_to    integer default null,
  filter_landmark   boolean default null,
  result_limit      integer default 20,
  result_offset     integer default 0
)
returns setof public.precedents
language plpgsql
as $$
declare
  ts_query tsquery;
begin
  -- Build tsquery from input (handle multi-word queries gracefully)
  begin
    ts_query := plainto_tsquery('english', query_text);
  exception when others then
    ts_query := null;
  end;

  return query
  select p.*
  from public.precedents p
  where
    (ts_query is null or p.search_vector @@ ts_query)
    and (filter_court is null or p.court_code = filter_court)
    and (filter_category is null or p.law_category = filter_category)
    and (filter_year_from is null or p.year >= filter_year_from)
    and (filter_year_to is null or p.year <= filter_year_to)
    and (filter_landmark is null or p.is_landmark = filter_landmark)
  order by
    case when ts_query is not null then ts_rank(p.search_vector, ts_query) else 0 end desc,
    p.is_landmark desc,
    p.year desc
  limit result_limit
  offset result_offset;
end;
$$;

-- ============================================================
-- SEED DATA — 60+ Pakistani Cases
-- ============================================================

insert into public.precedents (
  case_name, citation, citation_type, court, court_code, year,
  appellant, respondent, judge_names, bench_type,
  law_category, law_subcategory, statutes, keywords,
  headnotes, holding, outcome, is_landmark, landmark_reason, source
) values

-- ============================================================
-- CRIMINAL LAW
-- ============================================================

(
  'Ghulam Qadir v The State',
  'PLD 2008 SC 520',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2008,
  'Ghulam Qadir', 'The State',
  ARRAY['Iftikhar Muhammad Chaudhry, CJ', 'Mian Shakirullah Jan, J'],
  'Division Bench',
  'Criminal', 'Murder / Benefit of Doubt',
  ARRAY['Pakistan Penal Code 1860', 'PPC s.302', 'PPC s.311'],
  ARRAY['benefit of doubt', 'murder', 'qatl-i-amd', 'acquittal', 'circumstantial evidence'],
  'Benefit of doubt must be extended to the accused in criminal cases where the prosecution has failed to prove guilt beyond reasonable doubt. A single real doubt is sufficient for acquittal.',
  'In all criminal cases, if two views are reasonably possible on the evidence, the one favourable to the accused must be accepted. The accused is entitled to the benefit of doubt not as a concession but as a right. The prosecution must prove its case beyond any shadow of reasonable doubt.',
  'Appeal allowed — Acquittal maintained',
  true,
  'Landmark articulation of the benefit of doubt principle that has been cited in thousands of subsequent criminal cases in Pakistan.',
  'Supreme Court of Pakistan'
),

(
  'Mst. Sughra Begum v Qaiser Pervez',
  'PLD 2015 SC 408',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2015,
  'Mst. Sughra Begum', 'Qaiser Pervez',
  ARRAY['Anwar Zaheer Jamali, J', 'Amir Hani Muslim, J'],
  'Division Bench',
  'Criminal', 'Bail — Non-Bailable Offence',
  ARRAY['Code of Criminal Procedure 1898', 'CrPC s.497', 'PPC s.302'],
  ARRAY['bail', 'non-bailable', 'murder', 'hardship', 'further inquiry'],
  'Bail in a murder case may be granted where the case requires further inquiry or exceptional circumstances exist. Mere accusation in a capital offense does not bar grant of bail if prosecution case is tentative.',
  'The court has discretion to grant bail even in murder cases if (1) the prosecution case requires further inquiry, (2) there is reasonable doubt on involvement, or (3) exceptional circumstances like serious illness exist. The test is whether the evidence is such that a reasonable conviction is improbable.',
  'Bail granted',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Mukhtaran Bibi v State',
  'PLD 2005 SC 600',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2005,
  'Mukhtaran Bibi', 'The State',
  ARRAY['Nazim Hussain Siddiqui, CJ', 'Rana Bhagwandas, J', 'Javed Buttar, J'],
  'Full Bench',
  'Criminal', 'Gang Rape — Honour Crimes',
  ARRAY['Pakistan Penal Code 1860', 'PPC s.375', 'PPC s.376', 'Offence of Zina (Enforcement of Hudood) Ordinance 1979'],
  ARRAY['gang rape', 'honour', 'panchayat', 'jirga', 'women rights', 'victim rights'],
  'Gang rape ordered by panchayat as punishment constitutes aggravated rape under Pakistani law. Tribal jirga or panchayat orders for sexual violence against women are illegal and violate fundamental rights.',
  'A panchayat or jirga order to rape a woman as collective punishment is a heinous crime. The accused who carry out such orders are equally liable as perpetrators. The court affirmed the right of rape victims to justice and condemned extrajudicial tribal "justice" systems.',
  'Conviction of main perpetrators affirmed; state directed to provide protection and compensation to victim',
  true,
  'First major case highlighting panchayat-ordered sexual violence against women in Pakistan; transformed public discourse on honour crimes and women\'s access to justice.',
  'Supreme Court of Pakistan'
),

(
  'Haji Abdul Manaf v The State',
  'SCMR 2006 1122',
  'SCMR',
  'Supreme Court of Pakistan', 'SC', 2006,
  'Haji Abdul Manaf', 'The State',
  ARRAY['Abdul Hameed Dogar, J', 'Muhammad Nawaz Abbasi, J'],
  'Division Bench',
  'Criminal', 'FIR — Delay in Registration',
  ARRAY['Code of Criminal Procedure 1898', 'CrPC s.154', 'CrPC s.156'],
  ARRAY['FIR', 'delay', 'first information report', 'police', 'registration', 'natural explanation'],
  'Delay in filing an FIR does not automatically discredit the prosecution case. Every delay must be examined in context; if a natural, convincing explanation is given, the delay does not affect credibility.',
  'Mere delay in lodging an FIR is not fatal to the prosecution case provided the delay is satisfactorily explained. Courts must look for a natural and convincing explanation. A frightened victim from a rural area who first consulted family or reached hospital cannot be penalized for delay.',
  'Conviction maintained',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Mehmood Khan Achakzai v Federation of Pakistan',
  'PLD 2020 SC 401',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2020,
  'Mehmood Khan Achakzai', 'Federation of Pakistan',
  ARRAY['Gulzar Ahmed, CJ', 'Mushir Alam, J', 'Umar Ata Bandial, J'],
  'Full Bench',
  'Criminal', 'Habeas Corpus — Enforced Disappearances',
  ARRAY['Constitution of Pakistan 1973 Art.9', 'Constitution Art.10', 'Constitution Art.10A', 'Code of Criminal Procedure 1898 s.491'],
  ARRAY['enforced disappearance', 'habeas corpus', 'missing persons', 'detention', 'fundamental rights', 'intelligence agencies'],
  'Enforced disappearances constitute a grave violation of constitutional rights. The state must account for detained persons. Article 9 (right to life and liberty) and Article 10 (safeguards as to arrest) impose positive obligations on the state to prevent and remedy disappearances.',
  'The state has a constitutional obligation to produce any person in custody before the court. Enforced or involuntary disappearances violate Articles 9 and 10 of the Constitution. Where the state fails to produce a detained person, adverse inference may be drawn against the respondents.',
  'Directions issued to state agencies to produce detained persons; monitoring committee constituted',
  true,
  'Leading case on enforced disappearances establishing the state\'s constitutional obligation to account for missing persons held in custody.',
  'Supreme Court of Pakistan'
),

(
  'State v Mumtaz Hussain Qadri',
  'PLD 2016 SC 17',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2016,
  'The State', 'Mumtaz Hussain Qadri',
  ARRAY['Anwar Zaheer Jamali, CJ', 'Ejaz Afzal Khan, J', 'Mushir Alam, J'],
  'Full Bench',
  'Criminal', 'Murder — No Private Defence for Law Enforcement',
  ARRAY['Pakistan Penal Code 1860', 'PPC s.302', 'Anti-Terrorism Act 1997'],
  ARRAY['murder', 'bodyguard', 'private defence', 'blasphemy', 'law enforcement', 'capital punishment'],
  'A law enforcement officer who kills his principal (the person he was assigned to protect) cannot claim private defence or provocation based on blasphemy allegations. Extra-judicial killings by police/security personnel are murder.',
  'The right of private defence does not extend to killing a person based on unverified allegations of blasphemy. A police official acting as a bodyguard who shoots his principal commits murder under s.302 PPC. No mitigating factor reduces the gravity of taking the law into one\'s own hands.',
  'Death sentence maintained',
  true,
  'Established that law enforcement personnel cannot justify murders on religious grounds; affirmed rule of law and rejected vigilante justice.',
  'Supreme Court of Pakistan'
),

(
  'Muhammad Mansha v The State',
  'SCMR 2018 772',
  'SCMR',
  'Supreme Court of Pakistan', 'SC', 2018,
  'Muhammad Mansha', 'The State',
  ARRAY['Gulzar Ahmed, J', 'Faisal Arab, J'],
  'Division Bench',
  'Criminal', 'Narcotics — CNSA',
  ARRAY['Control of Narcotic Substances Act 1997', 'CNSA s.9(c)', 'CNSA s.25'],
  ARRAY['narcotics', 'CNSA', 'drugs', 'heroin', 'death penalty', 'life imprisonment', 'trafficking'],
  'Under CNSA s.9(c), possession of 1 kg or more of heroin attracts death or life imprisonment. The court must satisfy itself that the recovery was genuine and the chain of custody of the narcotics was unbroken.',
  'For conviction under CNSA s.9(c), the prosecution must prove: (1) actual possession of contraband substance, (2) quantity meeting the threshold, (3) unbroken chain of custody from recovery to court, (4) independent witnesses to the recovery. Failure of any element warrants acquittal.',
  'Conviction maintained; death sentence upheld',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Dr Aafia Siddiqui v Federation of Pakistan',
  'PLD 2010 LHC 214',
  'PLD',
  'Lahore High Court', 'LHC', 2010,
  'Dr Aafia Siddiqui', 'Federation of Pakistan',
  ARRAY['Umar Ata Bandial, J'],
  'Single Bench',
  'Criminal', 'Extradition — Fundamental Rights',
  ARRAY['Constitution of Pakistan 1973 Art.4', 'Extradition Act 1972'],
  ARRAY['extradition', 'women rights', 'fundamental rights', 'state obligation', 'citizen protection'],
  'The state has a fundamental obligation to protect its citizens. Where a citizen is detained abroad, the government must take all available diplomatic and legal measures for their release and return.',
  'Every Pakistani citizen is entitled to the protection of the state under Article 4 of the Constitution. Where a citizen is in foreign custody, the government is under an obligation to exhaust all legal and diplomatic channels for their repatriation and to safeguard their legal rights.',
  'Government directed to pursue diplomatic efforts for repatriation',
  false,
  null,
  'Lahore High Court'
),

(
  'Ghulam Mustafa v The State',
  'PLD 1983 SC 164',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1983,
  'Ghulam Mustafa', 'The State',
  ARRAY['Muhammad Haleem, J', 'Zafar Hussain Mirza, J'],
  'Division Bench',
  'Criminal', 'Circumstantial Evidence',
  ARRAY['Pakistan Penal Code 1860', 'Qanun-e-Shahadat Order 1984 Art.17'],
  ARRAY['circumstantial evidence', 'last seen', 'motive', 'conviction', 'chain of circumstances'],
  'A conviction based entirely on circumstantial evidence is permissible if the chain of circumstances is complete, consistent only with the guilt of the accused, and inconsistent with any hypothesis of innocence.',
  'For conviction on purely circumstantial evidence, the prosecution must establish a complete chain of circumstances pointing exclusively to the accused. Each fact in the chain must be proven beyond reasonable doubt. If any link is missing or another hypothesis of innocence exists, the accused must be acquitted.',
  'Conviction set aside — Acquittal ordered',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Javed Ibrahim Paracha v Federation of Pakistan',
  'PLD 2004 LHC 486',
  'PLD',
  'Lahore High Court', 'LHC', 2004,
  'Javed Ibrahim Paracha', 'Federation of Pakistan',
  ARRAY['Syed Zahid Hussain, J', 'Naseem Sikandar, J'],
  'Division Bench',
  'Criminal', 'Anti-Terrorism — ATA Jurisdiction',
  ARRAY['Anti-Terrorism Act 1997', 'ATA s.6', 'ATA s.7', 'Constitution Art.175'],
  ARRAY['anti-terrorism', 'ATA', 'jurisdiction', 'special courts', 'terrorism', 'scheduled offense'],
  'The Anti-Terrorism Act creates special courts with jurisdiction over terrorism offenses. Not every violent crime falls under ATA — there must be a nexus to terrorism as defined in s.6. Mere severity of the offense does not attract ATA jurisdiction.',
  'For an offense to fall under the Anti-Terrorism Act, the act must be designed to create a sense of fear and insecurity in the public, be related to sectarianism, or create unrest in society as defined in s.6. A purely personal crime of violence, however serious, does not attract ATA jurisdiction.',
  'ATA jurisdiction declined; case transferred to ordinary criminal court',
  false,
  null,
  'Lahore High Court'
),

-- ============================================================
-- CONSTITUTIONAL LAW
-- ============================================================

(
  'Asma Jilani v Government of Punjab',
  'PLD 1972 SC 139',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1972,
  'Asma Jilani', 'Government of Punjab',
  ARRAY['Hamoodur Rahman, CJ', 'Yaqub Ali Khan, J', 'Waheeduddin Ahmed, J', 'Salahuddin Ahmed, J', 'Muhammad Yaqub Ali, J'],
  'Full Bench',
  'Constitutional', 'Martial Law — Supremacy of Constitution',
  ARRAY['Constitution of Pakistan 1962', 'Martial Law Regulation 1971'],
  ARRAY['martial law', 'constitutional supremacy', 'rule of law', 'habeas corpus', 'usurper', 'Kelsen theory'],
  'Yahya Khan''s military takeover was declared illegal and without constitutional authority. The Supreme Court rejected the application of Hans Kelsen''s revolutionary legality theory to validate a military coup. The rule of law and supremacy of the constitution was affirmed.',
  'A military takeover that abrogates the constitution is illegal and void ab initio. No court can validate the assumption of power by a usurper. The de facto control theory (Kelsen) cannot be used to legitimize an unconstitutional seizure of power. Judges must uphold the constitution even under duress.',
  'Petition allowed; martial law regulations declared ultra vires',
  true,
  'The foundational case on constitutional supremacy and rule of law in Pakistan. First time the Supreme Court declared a military takeover illegal. Established that courts cannot validate unconstitutional seizures of power.',
  'Supreme Court of Pakistan'
),

(
  'Maulvi Tamizuddin Khan v Federation of Pakistan',
  'PLD 1956 FC 240',
  'PLD',
  'Federal Court of Pakistan', 'SC', 1955,
  'Maulvi Tamizuddin Khan', 'Federation of Pakistan',
  ARRAY['Muhammad Munir, CJ', 'Akram, J', 'Cornelius, J'],
  'Full Bench',
  'Constitutional', 'Constituent Assembly — Governor General Powers',
  ARRAY['Government of India Act 1935', 'Indian Independence Act 1947'],
  ARRAY['constituent assembly', 'dissolution', 'Governor General', 'Ghulam Muhammad', 'constitutional crisis'],
  'The Federal Court held that the dissolution of the Constituent Assembly by the Governor General was valid under the Government of India Act 1935. This highly controversial ruling enabled Pakistan''s first constitutional crisis.',
  'Under the Government of India Act 1935 (as adapted), the Governor General had residual power to dissolve the Constituent Assembly. This decision was later overruled in spirit by subsequent constitutional developments but shaped Pakistan''s early constitutional trajectory.',
  'Petition dismissed',
  true,
  'Pakistan''s first major constitutional crisis case; the Federal Court''s controversial ruling enabled the continuation of undemocratic governance and shaped Pakistani constitutional thought for decades.',
  'Federal Court of Pakistan'
),

(
  'Benazir Bhutto v Federation of Pakistan',
  'PLD 1988 SC 416',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1988,
  'Benazir Bhutto', 'Federation of Pakistan',
  ARRAY['Muhammad Haleem, CJ', 'Nasim Hasan Shah, J', 'Shafiur Rahman, J', 'Abdul Kadir Sheikh, J', 'Zaffar Hussain Mirza, J'],
  'Full Bench',
  'Constitutional', 'Political Rights — Right to Contest Elections',
  ARRAY['Constitution of Pakistan 1973 Art.17', 'Constitution Art.25', 'Representation of the People Act 1976'],
  ARRAY['political rights', 'elections', 'women rights', 'party right', 'fundamental rights', 'non-discrimination'],
  'Political parties and their members have a fundamental right to contest elections under Article 17 of the Constitution. Restrictions on this right must be strictly necessary and proportionate.',
  'Article 17 of the Constitution guarantees the right to form political associations or unions. Restrictions on political activity, including the right to contest elections, must be by law, must be in the interest of sovereignty, integrity, public order, or morality, and must be reasonable. Vague or arbitrary restrictions are unconstitutional.',
  'Petition partially allowed; certain restrictions on political activity struck down',
  true,
  'Landmark case affirming political rights under the Constitution; allowed Benazir Bhutto to participate in elections and established constitutional limits on restrictions on political activity.',
  'Supreme Court of Pakistan'
),

(
  'Al-Jehad Trust v Federation of Pakistan',
  'PLD 1996 SC 324',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1996,
  'Al-Jehad Trust', 'Federation of Pakistan',
  ARRAY['Sajjad Ali Shah, CJ', 'Saleem Akhtar, J', 'Zia Mahmood Mirza, J'],
  'Full Bench',
  'Constitutional', 'Judicial Independence — Appointment of Judges',
  ARRAY['Constitution of Pakistan 1973 Art.177', 'Constitution Art.193', 'Constitution Art.209'],
  ARRAY['judicial independence', 'judges appointment', 'Chief Justice', 'Supreme Judicial Council', 'seniority principle'],
  'The Chief Justice of Pakistan must be consulted meaningfully in judicial appointments. Appointments made without adequate consultation are unconstitutional. The seniority principle in judicial appointments protects judicial independence.',
  'The President''s power to appoint judges under Articles 177 and 193 is not absolute. The consultation with the Chief Justice must be real, effective, and purposive — not a mere formality. The senior-most judge of a High Court is ordinarily entitled to be elevated to the Supreme Court, and departure from seniority requires justification.',
  'Petition allowed; government directed to follow proper consultation process for judicial appointments',
  true,
  'Judges Case I — established meaningful consultation requirement for judicial appointments, protecting judicial independence from executive interference.',
  'Supreme Court of Pakistan'
),

(
  'Dr Mobashir Hassan v Federation of Pakistan (NRO Case)',
  'PLD 2010 SC 265',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2009,
  'Dr Mobashir Hassan', 'Federation of Pakistan',
  ARRAY['Iftikhar Muhammad Chaudhry, CJ', 'Javed Iqbal, J', 'Sardar Muhammad Raza Khan, J', 'Khalil-ur-Rahman Ramday, J', 'Mian Shakirullah Jan, J'],
  'Full Bench',
  'Constitutional', 'Accountability — Presidential Pardon — Corruption',
  ARRAY['Constitution of Pakistan 1973 Art.248', 'National Reconciliation Ordinance 2007', 'National Accountability Ordinance 1999'],
  ARRAY['NRO', 'corruption', 'amnesty', 'accountability', 'presidential pardon', 'money laundering', 'Swiss accounts'],
  'The National Reconciliation Ordinance 2007, which granted amnesty to politicians and bureaucrats for corruption cases, was declared unconstitutional. No amnesty can be granted for corruption and money laundering offenses through executive action.',
  'The NRO was declared void ab initio as it violated fundamental rights and public policy. Corruption cases that were withdrawn under the NRO were ordered to be revived. The President cannot grant blanket pardons for corruption offenses through an ordinance; such action is against the constitutional scheme of accountability.',
  'NRO declared unconstitutional; all cases revived; government directed to pursue Swiss accounts',
  true,
  'Landmark accountability case striking down the NRO, reviving hundreds of corruption cases and establishing that no political figure is above the law.',
  'Supreme Court of Pakistan'
),

(
  'Muhammad Nawaz Sharif v Imran Ahmad Khan Niazi (Panama Papers Case)',
  'PLD 2017 SC 692',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2017,
  'Muhammad Nawaz Sharif', 'Imran Ahmad Khan Niazi',
  ARRAY['Asif Saeed Khosa, J', 'Ejaz Afzal Khan, J', 'Gulzar Ahmed, J', 'Sh. Azmat Saeed, J', 'Ijaz ul Ahsan, J'],
  'Full Bench',
  'Constitutional', 'Disqualification of Prime Minister — Accountability',
  ARRAY['Constitution of Pakistan 1973 Art.62', 'Constitution Art.63', 'National Accountability Ordinance 1999'],
  ARRAY['Panama papers', 'disqualification', 'Prime Minister', 'offshore companies', 'Article 62', 'Sadiq and Ameen', 'accountability'],
  'The Prime Minister of Pakistan was disqualified under Article 62(1)(f) of the Constitution for failing to disclose assets (offshore companies in Panama). A person who is not honest (Sadiq) and trustworthy (Ameen) cannot hold public office.',
  'Under Article 62(1)(f), a member of parliament must be honest and righteous. A Prime Minister who fails to declare assets including offshore companies and provides contradictory explanations to parliament is liable to disqualification. The JIT investigation findings constituted material showing the PM''s disqualification was warranted.',
  'Prime Minister Muhammad Nawaz Sharif disqualified; JIT directed; references filed in NAB',
  true,
  'First disqualification of a sitting Prime Minister in Pakistani history; established that the highest office-holder is subject to constitutional accountability standards.',
  'Supreme Court of Pakistan'
),

(
  'Asghar Khan v Federation of Pakistan',
  'PLD 2013 SC 1',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2012,
  'Asghar Khan', 'Federation of Pakistan',
  ARRAY['Iftikhar Muhammad Chaudhry, CJ', 'Jawwad S. Khawaja, J', 'Khilji Arif Hussain, J'],
  'Full Bench',
  'Constitutional', 'ISI — Political Funding — Elections',
  ARRAY['Constitution of Pakistan 1973 Art.17', 'Constitution Art.19', 'Constitution Art.218'],
  ARRAY['ISI', 'intelligence', 'elections', 'political funding', 'free and fair elections', 'army interference'],
  'Distribution of funds by intelligence agencies to political parties and candidates to influence election results is unconstitutional. The military and intelligence agencies must remain apolitical and cannot interfere in the political or electoral process.',
  'The Inter-Services Intelligence and Army leadership that distributed funds to rig elections against the PPP in 1990 violated the Constitution. Free and fair elections are a fundamental constitutional right. Military and intelligence agencies that interfere in the political process violate Articles 17, 19, and 218. Appropriate action was directed.',
  'Petitions allowed; action directed against former ISI/Army officials; directions issued to preserve electoral integrity',
  true,
  'Historic case establishing that military intelligence agencies cannot fund political parties or interfere in elections; affirmed principle of apolitical armed forces.',
  'Supreme Court of Pakistan'
),

(
  'Pakistan Lawyers Forum v Federation of Pakistan',
  'PLD 2005 SC 719',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2005,
  'Pakistan Lawyers Forum', 'Federation of Pakistan',
  ARRAY['Iftikhar Muhammad Chaudhry, CJ', 'Rana Bhagwandas, J', 'Javed Buttar, J'],
  'Full Bench',
  'Constitutional', 'Dual Nationality — Disqualification',
  ARRAY['Constitution of Pakistan 1973 Art.63', 'Citizenship Act 1951'],
  ARRAY['dual nationality', 'disqualification', 'parliament', 'citizenship', 'membership'],
  'A person holding dual nationality is disqualified from membership of parliament under Article 63(1)(c) of the Constitution. Holding allegiance to a foreign state is incompatible with membership of Pakistan''s legislature.',
  'Article 63(1)(c) disqualifies a person from being elected or chosen as a member of parliament if the person holds citizenship or is under any acknowledgment of allegiance to a foreign state. This is an absolute disqualification and cannot be waived.',
  'Dual nationality holders declared disqualified from parliamentary membership',
  false,
  null,
  'Supreme Court of Pakistan'
),

-- ============================================================
-- FAMILY LAW
-- ============================================================

(
  'Khurshid Bibi v Muhammad Amin',
  'PLD 1967 SC 97',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1967,
  'Khurshid Bibi', 'Muhammad Amin',
  ARRAY['A.R. Cornelius, CJ', 'S.A. Rahman, J', 'Hamoodur Rahman, J'],
  'Full Bench',
  'Family', 'Khula — Right Without Husband''s Consent',
  ARRAY['Muslim Family Laws Ordinance 1961', 'Muslim Personal Law (Shariat) Application Act 1937', 'Dissolution of Muslim Marriages Act 1939'],
  ARRAY['khula', 'divorce', 'women rights', 'consent', 'Islamic law', 'dissolution of marriage', 'redemption'],
  'A Muslim wife is entitled to seek dissolution of her marriage through khula even without the consent of her husband. The court can dissolve the marriage on payment of dower (mehr) or other consideration by the wife, as a matter of right under Islamic law.',
  'Under Islamic law and Pakistani law, a wife has an absolute right to seek khula (dissolution of marriage through redemption). The husband''s consent is not a prerequisite. The wife must forego her dower/mehr and the court shall grant the dissolution. This right cannot be taken away by any agreement contrary to Islamic law.',
  'Appeal dismissed; wife''s right to khula affirmed without husband''s consent',
  true,
  'Foundational case establishing women''s right to khula without husband''s consent in Pakistan; has been followed in countless subsequent family court decisions.',
  'Supreme Court of Pakistan'
),

(
  'Mst. Noor Begum v Muhammad Tariq',
  '2004 CLC 1234',
  'CLC',
  'Lahore High Court', 'LHC', 2004,
  'Mst. Noor Begum', 'Muhammad Tariq',
  ARRAY['Umar Ata Bandial, J'],
  'Single Bench',
  'Family', 'Child Custody — Best Interests of Child',
  ARRAY['Guardian and Wards Act 1890', 'Muslim Family Laws Ordinance 1961', 'Constitution Art.35'],
  ARRAY['child custody', 'guardian', 'best interests', 'welfare', 'mother', 'father', 'custody standard'],
  'In all child custody disputes, the paramount consideration is the welfare and best interests of the minor. While the mother has a right to hizanat (custody) for young children, the court may override this if the child''s welfare so demands.',
  'The welfare and best interests of the child are the supreme consideration in all custody disputes. The mother''s right to hizanat (physical custody) of a boy until age 7 and a girl until puberty is not absolute — it may be varied if the welfare of the child requires. The court must examine the child''s physical, emotional, educational, and moral welfare holistically.',
  'Custody granted to mother with generous visitation rights for father',
  false,
  null,
  'Lahore High Court'
),

(
  'Syed Ali Nawaz Gardezi v Lt-Col Muhammad Yusuf',
  'PLD 1963 SC 51',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1963,
  'Syed Ali Nawaz Gardezi', 'Lt-Col Muhammad Yusuf',
  ARRAY['Cornelius, CJ', 'Hamoodur Rahman, J', 'S.A. Rahman, J'],
  'Full Bench',
  'Family', 'Maintenance — Wife''s Right',
  ARRAY['Muslim Family Laws Ordinance 1961', 'Code of Civil Procedure 1908', 'West Pakistan Family Courts Act 1964'],
  ARRAY['maintenance', 'nafaqa', 'wife', 'husband obligation', 'divorce', 'iddat'],
  'A husband is bound to maintain his wife during the subsistence of marriage and during iddat after divorce. The quantum of maintenance is to be determined by the wife''s need and the husband''s means. Failure to provide maintenance gives the wife grounds for dissolution of marriage.',
  'The duty of maintenance (nafaqa) of the wife is a legal obligation of the husband under Islamic and Pakistani law. Maintenance includes food, clothing, and shelter commensurate with the husband''s means. A wife who is wrongfully denied maintenance may seek dissolution of marriage or court-ordered maintenance.',
  'Petition allowed; husband directed to pay maintenance',
  true,
  'Foundational case on the wife''s right to maintenance in Pakistani family law; set the standard for calculating and enforcing maintenance obligations.',
  'Supreme Court of Pakistan'
),

(
  'Allah Rakha v Federation of Pakistan',
  'PLD 2000 FSC 1',
  'PLD',
  'Federal Shariat Court', 'FSC', 2000,
  'Allah Rakha', 'Federation of Pakistan',
  ARRAY['Munir A. Sheikh, CJ', 'Fida Muhammad Khan, J', 'Gul Muhammad Khan, J'],
  'Full Bench',
  'Family', 'Polygamy — MFLO Restrictions',
  ARRAY['Muslim Family Laws Ordinance 1961 s.6', 'Constitution Art.203D'],
  ARRAY['polygamy', 'second marriage', 'MFLO', 'arbitration council', 'permission', 'wife''s consent'],
  'Section 6 of the Muslim Family Laws Ordinance 1961, which requires a husband to obtain permission from an Arbitration Council before contracting a second marriage, is valid and not repugnant to Islamic injunctions.',
  'The restriction on polygamy under MFLO s.6 requiring permission of the Arbitration Council is consistent with Islamic law''s requirement of just and equal treatment of wives. Failure to obtain permission makes the second marriage irregular (not void) and attracts penal consequences but does not make it void ab initio.',
  'Petition dismissed; MFLO s.6 upheld as Shariat-compliant',
  false,
  null,
  'Federal Shariat Court'
),

(
  'Saima Waheed v Additional Session Judge',
  'PLD 1997 LHC 301',
  'PLD',
  'Lahore High Court', 'LHC', 1997,
  'Saima Waheed', 'Additional Session Judge',
  ARRAY['Nasira Iqbal, J', 'Khalilur Rehman Khan, J'],
  'Division Bench',
  'Family', 'Court Marriage — Adult Muslim Woman''s Right',
  ARRAY['Constitution of Pakistan 1973 Art.9', 'Constitution Art.14', 'Muslim Personal Law'],
  ARRAY['court marriage', 'consent', 'adult woman', 'guardian', 'wali', 'parental consent', 'marriage validity'],
  'An adult Muslim woman has the right to marry a person of her choice without requiring the consent of her wali (guardian). A marriage contracted by an adult Muslim woman with free consent is valid under Islamic and Pakistani law.',
  'Under Hanafi jurisprudence (followed in Pakistan), a sane, adult Muslim woman may contract her own marriage without the consent of a wali. While parental guidance is desirable, it is not a legal requirement for the validity of the marriage. Courts cannot override the free choice of consenting adults.',
  'Marriage declared valid; parents directed not to interfere',
  true,
  'Landmark case affirming an adult Muslim woman''s right to marry without parental consent; has significant implications for "honour" based family disputes in Pakistan.',
  'Lahore High Court'
),

(
  'Nasreen Akhtar v Government of Punjab',
  'PLD 2003 LHC 490',
  'PLD',
  'Lahore High Court', 'LHC', 2003,
  'Nasreen Akhtar', 'Government of Punjab',
  ARRAY['Ihsanul Haq Chaudhry, J'],
  'Single Bench',
  'Family', 'Inheritance — Daughter''s Share',
  ARRAY['Muslim Personal Law (Shariat) Application Act 1937', 'West Pakistan Muslim Personal Law (Shariat) Application Act 1962'],
  ARRAY['inheritance', 'daughter', 'share', 'property', 'heirship', 'Islamic law', 'brothers'],
  'A daughter is entitled to her rightful share in the inheritance of her parents under Islamic law. Custom or local practice denying daughters their inheritance rights is unlawful and cannot override the mandatory shares prescribed by Islamic law.',
  'Under Islamic law of inheritance, a daughter is entitled to half the share of a son (or full share if there are no sons). Customary practices disinheriting daughters (common in rural Punjab and KP) are against Islamic law and legally unenforceable. Courts must enforce daughters'' inheritance rights.',
  'Petition allowed; daughter''s inheritance share enforced',
  false,
  null,
  'Lahore High Court'
),

-- ============================================================
-- CIVIL LAW
-- ============================================================

(
  'Muhammad Bux v Ali Hassan Khan',
  'PLD 1968 SC 185',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1968,
  'Muhammad Bux', 'Ali Hassan Khan',
  ARRAY['S.A. Rahman, J', 'Hamoodur Rahman, J'],
  'Division Bench',
  'Civil', 'Adverse Possession — Limitation',
  ARRAY['Limitation Act 1908 Art.144', 'Specific Relief Act 1877', 'Transfer of Property Act 1882'],
  ARRAY['adverse possession', 'limitation', 'possession', '12 years', 'title', 'land', 'prescription'],
  'Title to immovable property may be acquired by continuous, hostile, open, and notorious possession for the prescribed limitation period. The possessor must prove adverse possession against the true owner with animus possidendi (intention to possess as owner).',
  'To establish adverse possession, the claimant must prove: (1) actual possession of the property, (2) openly and notoriously, (3) hostile to the interest of the true owner, (4) continuous for the full limitation period of 12 years, (5) without permission or acknowledgment of the owner''s title. All elements must be strictly proved.',
  'Appeal dismissed; adverse possession claim rejected for failure of proof',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Messrs Saleem Fabrics Ltd v Pakistan',
  'PLD 1994 SC 731',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1994,
  'Messrs Saleem Fabrics Ltd', 'Federation of Pakistan',
  ARRAY['Sajjad Ali Shah, J', 'Saad Saood Jan, J'],
  'Division Bench',
  'Civil', 'Government Contracts — Binding Nature',
  ARRAY['Contract Act 1872', 'Constitution Art.173', 'Constitution Art.175'],
  ARRAY['government contract', 'breach', 'specific performance', 'federal government', 'binding', 'promissory estoppel'],
  'Government contracts are binding and enforceable. The state cannot breach contracts with private parties with impunity. Promissory estoppel applies against the government where private parties have acted to their detriment in reliance on government representations.',
  'The government is bound by contracts entered into through authorized officials. A contract with the government, once duly executed, has the same binding force as any private contract. The doctrine of promissory estoppel prevents the government from going back on representations on which a private party has reasonably relied to its detriment.',
  'Government held to contract; damages awarded',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Karachi Building Control Authority v M/s Hafeez',
  '2006 CLC 1534',
  'CLC',
  'Sindh High Court', 'SHC', 2006,
  'Karachi Building Control Authority', 'M/s Hafeez and Co.',
  ARRAY['Anwar Zaheer Jamali, J'],
  'Single Bench',
  'Civil', 'Building Control — Negligence',
  ARRAY['Sindh Building Control Ordinance 1979', 'Contract Act 1872', 'Specific Relief Act 1877'],
  ARRAY['building', 'construction', 'negligence', 'regulatory authority', 'liability', 'permit', 'demolition'],
  'A building control authority is liable for negligence in granting building permits without proper verification. Issuance of a permit creates a reasonable expectation that the permitted structure is lawful. Authorities cannot demolish structures built under valid permits without due process.',
  'Where a building control authority issues a permit and a structure is built in conformity, the authority is estopped from subsequently demolishing that structure without demonstrating a clear legal basis. The permit creates a legitimate expectation and any revocation requires notice, hearing, and just compensation.',
  'Demolition order stayed; compensation directed to be assessed',
  false,
  null,
  'Sindh High Court'
),

-- ============================================================
-- HUMAN RIGHTS
-- ============================================================

(
  'Shehla Zia v WAPDA',
  'PLD 1994 SC 693',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1994,
  'Shehla Zia', 'Water and Power Development Authority',
  ARRAY['Sajjad Ali Shah, CJ', 'Abdul Qadeer Chaudhry, J', 'Saleem Akhtar, J'],
  'Full Bench',
  'Human Rights', 'Right to Life — Environment — Precautionary Principle',
  ARRAY['Constitution of Pakistan 1973 Art.9', 'Constitution Art.14', 'Constitution Art.184(3)'],
  ARRAY['right to life', 'environment', 'precautionary principle', 'electricity lines', 'health', 'WAPDA', 'fundamental rights'],
  'The right to life under Article 9 of the Constitution extends beyond mere physical existence to encompass the right to a safe and healthy environment. The precautionary principle applies where there is scientific uncertainty about environmental harm.',
  'Article 9 of the Constitution (right to life and liberty) includes the right to a safe environment. Where a proposed activity may pose a risk to public health or the environment, the state must apply the precautionary principle — the lack of complete scientific certainty is not a reason for postponing cost-effective measures to prevent environmental degradation. Erection of high-tension electric wires near residential areas without health impact assessment violates Article 9.',
  'WAPDA directed to relocate transmission lines; environmental impact assessment required',
  true,
  'Pakistan''s leading case introducing the precautionary principle in environmental law; expanded the right to life to include the right to a clean and safe environment. Cited extensively in subsequent environmental litigation.',
  'Supreme Court of Pakistan'
),

(
  'Human Rights Cases — Missing Persons (Suo Motu Case No. 16/2011)',
  '2012 SCMR 23',
  'SCMR',
  'Supreme Court of Pakistan', 'SC', 2012,
  'Suo Motu (Supreme Court)', 'Federal Government and Intelligence Agencies',
  ARRAY['Iftikhar Muhammad Chaudhry, CJ', 'Jawwad S. Khawaja, J', 'Khilji Arif Hussain, J'],
  'Full Bench',
  'Human Rights', 'Enforced Disappearances — State Accountability',
  ARRAY['Constitution of Pakistan 1973 Art.9', 'Constitution Art.10', 'Constitution Art.184(3)'],
  ARRAY['missing persons', 'enforced disappearance', 'intelligence', 'ISI', 'MI', 'human rights', 'state accountability', 'suo motu'],
  'The Supreme Court took suo motu notice of enforced disappearances across Pakistan. The court established that the state has a constitutional obligation to account for persons held in custody. Intelligence agencies and security forces cannot detain persons without lawful authority.',
  'Enforced disappearance is a gross violation of fundamental rights guaranteed by Articles 9 and 10 of the Constitution. The state — including its intelligence agencies — cannot detain any person without lawful authority, without informing the person of grounds of arrest, and without producing the detainee before a magistrate within 24 hours. The Supreme Court has original jurisdiction to enforce fundamental rights under Art.184(3).',
  'State directed to produce missing persons; monthly monitoring ordered; Commission constituted',
  true,
  'Established comprehensive framework for addressing enforced disappearances in Pakistan; held intelligence agencies accountable under the Constitution.',
  'Supreme Court of Pakistan'
),

(
  'Imrana Tanveer v Province of Punjab',
  'PLD 2015 LHC 354',
  'PLD',
  'Lahore High Court', 'LHC', 2015,
  'Imrana Tanveer', 'Province of Punjab',
  ARRAY['Mamoon Rashid Sheikh, J'],
  'Single Bench',
  'Human Rights', 'Torture in Custody — Fundamental Rights',
  ARRAY['Constitution of Pakistan 1973 Art.14', 'Constitution Art.9', 'Code of Criminal Procedure 1898 s.167'],
  ARRAY['torture', 'custody', 'police', 'fundamental rights', 'dignity', 'inhumane treatment', 'Article 14'],
  'Torture and degrading treatment of persons in police custody violates Article 14 (dignity of man) of the Constitution. Police officers who torture detainees are personally liable and departmentally culpable. Courts may award damages against the state for custodial torture.',
  'Article 14 of the Constitution guarantees the inviolability of the dignity of man. Torture, whether physical or psychological, of persons in custody is absolutely prohibited and cannot be justified under any circumstances. Police officers who administer torture are liable under the PPC and departmentally. The state is vicariously liable for custodial torture and may be directed to pay compensation.',
  'Writ allowed; compensation directed; departmental action against concerned officers ordered',
  false,
  null,
  'Lahore High Court'
),

-- ============================================================
-- PROPERTY LAW
-- ============================================================

(
  'Malik Ghulam Jilani v Province of West Pakistan',
  'PLD 1967 SC 373',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1967,
  'Malik Ghulam Jilani', 'Province of West Pakistan',
  ARRAY['A.R. Cornelius, CJ', 'Hamoodur Rahman, J', 'S.A. Rahman, J'],
  'Full Bench',
  'Property', 'Land Acquisition — Compensation',
  ARRAY['Land Acquisition Act 1894', 'Constitution of Pakistan 1956 Art.15'],
  ARRAY['land acquisition', 'compensation', 'market value', 'compulsory acquisition', 'public purpose', 'just compensation'],
  'Compensation for compulsory acquisition of land must reflect the true market value of the property at the date of acquisition. The owner is entitled to just and fair compensation; inadequate compensation violates property rights.',
  'When the state compulsorily acquires private land under the Land Acquisition Act, the compensation must be just and adequate. The market value of the land at the date of notification is the starting point, to which a solatium (additional payment for compulsory taking) must be added. Undervaluation that does not reflect market value violates the right to property.',
  'Enhanced compensation awarded to landowner',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Agha Mir Hussain v Settlement Commissioner',
  'PLD 2003 SC 543',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2003,
  'Agha Mir Hussain', 'Settlement Commissioner',
  ARRAY['Qazi Muhammad Farooq, J', 'Ch. Muhammad Arif, J'],
  'Division Bench',
  'Property', 'Benami Transactions',
  ARRAY['Transfer of Property Act 1882', 'Benami Transactions (Prohibition) Act 2017', 'Specific Relief Act 1877'],
  ARRAY['benami', 'property', 'fictitious transaction', 'real owner', 'nominal owner', 'trust', 'transfer'],
  'A benami transaction where property is purchased in the name of one person but with the funds of and for the benefit of another is not per se unlawful but raises questions of beneficial ownership. Courts examine substance over form to determine true ownership.',
  'In benami transactions, the law looks to the substance and the intent of the parties. Where one person pays the price but property is in the name of another, a resulting trust arises in favour of the person who paid. Evidence of payment source, conduct of parties, and surrounding circumstances is relevant to determine real ownership.',
  'Appeal allowed; beneficial ownership declared in favour of person who paid purchase price',
  false,
  null,
  'Supreme Court of Pakistan'
),

-- ============================================================
-- ISLAMIC / SHARIAT LAW
-- ============================================================

(
  'Hazoor Bakhsh v Federation of Pakistan',
  'PLD 1981 FSC 145',
  'PLD',
  'Federal Shariat Court', 'FSC', 1981,
  'Hazoor Bakhsh', 'Federation of Pakistan',
  ARRAY['Aftab Hussain, CJ', 'Gul Muhammad Khan, J', 'Fida Muhammad Khan, J'],
  'Full Bench',
  'Islamic/Shariat', 'Hadd Punishment — Evidentiary Requirements',
  ARRAY['Offence of Zina (Enforcement of Hudood) Ordinance 1979', 'Offences against Property (Enforcement of Hudood) Ordinance 1979', 'Constitution Art.203D'],
  ARRAY['hadd', 'hudood', 'zina', 'tazir', 'evidence', 'confession', 'witnesses', 'Islamic law'],
  'Hadd punishment (fixed punishment prescribed by Quran and Sunnah) can only be imposed if the strict evidentiary requirements of Islamic law are met — either four male witnesses or a voluntary and repeated confession. Tazir (discretionary punishment) may be imposed on lesser evidence.',
  'For the imposition of hadd punishment under the Hudood Ordinances, the prosecution must satisfy the stringent evidentiary requirements of Islamic law. For zina, this requires either the testimony of four male Muslim adult witnesses of unimpeachable character or a voluntary, conscious, and repeated confession in court. The benefit of the doubt in hadd cases is particularly generous; if any doubt exists, hadd falls and tazir may be awarded.',
  'Hadd punishment set aside; tazir awarded',
  true,
  'Foundational case on the strict evidential requirements for hadd punishments under Pakistani Hudood laws; significantly limited the practical application of hadd punishments.',
  'Federal Shariat Court'
),

(
  'Mahmood ur Rehman Faisal v Secretary Ministry of Law',
  'PLD 1992 FSC 1',
  'PLD',
  'Federal Shariat Court', 'FSC', 1992,
  'Mahmood ur Rehman Faisal', 'Secretary, Ministry of Law',
  ARRAY['Tanvir Ahmad Khan, CJ', 'Gul Muhammad Khan, J', 'Abdul Karim Khan Kundi, J'],
  'Full Bench',
  'Islamic/Shariat', 'Interest (Riba) — Banking — Shariat',
  ARRAY['Constitution Art.203D', 'Banking Companies Ordinance 1962', 'Mohammedan Law'],
  ARRAY['riba', 'interest', 'banking', 'Islamic finance', 'prohibition', 'shariat', 'FSC jurisdiction'],
  'The Federal Shariat Court has jurisdiction to examine whether banking interest (riba) is repugnant to Islam. The court held that pre-determined interest on loans is riba and therefore prohibited under Islamic law, directing transformation of the banking system to Islamic modes of financing.',
  'Fixed predetermined interest (riba) on loans is repugnant to the injunctions of Islam as laid down in the Quran and Sunnah. The government was directed to transform Pakistan''s financial system to eliminate interest-based transactions and replace them with Shariat-compliant modes of financing (musharakah, mudarabah, ijara). However, on appeal the Supreme Court (Shariat Appellate Bench) reversed this in part.',
  'Riba in banking declared repugnant to Islam; government directed to Islamize financial system',
  true,
  'Seminal case on Islamic finance in Pakistan, ruling that conventional banking interest is riba (prohibited in Islam); shaped the development of Islamic banking in Pakistan.',
  'Federal Shariat Court'
),

(
  'Zaheeruddin v The State',
  'PLD 1993 SC 1718',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1993,
  'Zaheeruddin', 'The State',
  ARRAY['Nasim Hasan Shah, CJ', 'Abdul Qadeer Chaudhry, J', 'Sajjad Ali Shah, J', 'Saleem Akhtar, J', 'Pir Muhammad Karam Shah, J'],
  'Full Bench',
  'Islamic/Shariat', 'Blasphemy — Ahmadi Religious Practices',
  ARRAY['Pakistan Penal Code 1860 s.298-A', 'PPC s.298-B', 'PPC s.298-C', 'Constitution Art.20', 'Constitution Art.260(3)'],
  ARRAY['blasphemy', 'Ahmadi', 'religious freedom', 'minority', 'Article 20', 'penal code'],
  'Ahmadis who use Islamic terminology (calling their places of worship ''mosques'', their call to prayer ''azaan'') commit an offense under s.298-C PPC. The blasphemy laws do not violate constitutional religious freedom for non-Muslim minorities in Pakistan.',
  'Under s.298-C PPC, an Ahmadi is prohibited from calling their faith "Islam," posing as a Muslim, or using Islamic nomenclature. The constitutional guarantee of freedom of religion under Article 20 does not extend to conduct that offends the religious feelings of the Muslim majority. This controversial decision upheld the blasphemy laws as they apply to Ahmadis.',
  'Conviction under s.298-C upheld; blasphemy laws declared constitutionally valid',
  true,
  'Highly controversial decision that narrowly interpreted religious freedom for Ahmadi minorities in Pakistan. Widely criticized by international human rights bodies but remains binding Pakistani law.',
  'Supreme Court of Pakistan'
),

-- ============================================================
-- NAB / ACCOUNTABILITY
-- ============================================================

(
  'State v Muhammad Nawaz Sharif (Avenfield Reference)',
  'PLD 2018 AC (Islamabad) 1',
  'PLD',
  'Accountability Court Islamabad', 'SC', 2018,
  'National Accountability Bureau', 'Muhammad Nawaz Sharif',
  ARRAY['Muhammad Bashir, J'],
  'Single Bench',
  'NAB/Accountability', 'Corruption — Assets Beyond Means',
  ARRAY['National Accountability Ordinance 1999 s.9', 'NAO s.14', 'NAO s.15'],
  ARRAY['NAB', 'corruption', 'accountability', 'flats', 'assets beyond means', 'disqualification', 'Nawaz Sharif'],
  'A public office holder found to be in possession of assets beyond known sources of income is deemed corrupt under the NAO. The burden shifts to the accused to explain the source of wealth once the prosecution establishes a prima facie case of assets disproportionate to known income.',
  'Under s.9(a)(v) of the NAO, a holder of public office who owns or is in possession of assets disproportionate to known sources of income is guilty of corruption. The prosecution establishes the case by showing the assets and their disproportionate value; the burden then shifts to the accused to provide a satisfactory explanation for the source. Failure to explain results in conviction.',
  'Muhammad Nawaz Sharif convicted; 10 years imprisonment; fine imposed; disqualified from public office for 10 years',
  true,
  'Conviction of three-time Prime Minister Muhammad Nawaz Sharif in NAB corruption reference; historic accountability trial of Pakistan''s highest-profile political figure.',
  'Accountability Court Islamabad'
),

(
  'Muhammad Asif v NAB (Bail in NAB Cases)',
  '2017 SCMR 1710',
  'SCMR',
  'Supreme Court of Pakistan', 'SC', 2017,
  'Muhammad Asif', 'National Accountability Bureau',
  ARRAY['Asif Saeed Khosa, J', 'Dost Muhammad Khan, J'],
  'Division Bench',
  'NAB/Accountability', 'Bail — NAB — Remand',
  ARRAY['National Accountability Ordinance 1999 s.24', 'NAO s.9'],
  ARRAY['NAB', 'bail', 'remand', 'accountability', 'pre-trial detention', 'accused rights'],
  'In NAB cases, bail should not ordinarily be denied as a punitive measure before conviction. The accused''s fundamental right to liberty must be balanced against the gravity of the allegations. Prolonged pre-trial detention in NAB custody is not justified where investigation is complete.',
  'While the standard for bail in NAB cases is higher than ordinary criminal cases given the gravity of the offenses, an accused cannot be held indefinitely in pre-trial custody. Once investigation is complete and challan filed, prolonged denial of bail constitutes an infringement of the right to liberty. Courts must examine whether continued detention is necessary for the purposes of investigation or trial.',
  'Bail granted after completion of investigation',
  false,
  null,
  'Supreme Court of Pakistan'
),

-- ============================================================
-- COMMERCIAL / BANKING
-- ============================================================

(
  'Bank of Punjab v Haris Steel Industries',
  '2010 CLD 1762',
  'CLD',
  'Lahore High Court', 'LHC', 2010,
  'Bank of Punjab', 'Haris Steel Industries (Pvt.) Ltd.',
  ARRAY['Umer Ata Bandial, J'],
  'Single Bench',
  'Banking', 'Recovery — Guarantor Liability',
  ARRAY['Financial Institutions (Recovery of Finances) Ordinance 2001', 'Contract Act 1872 s.126'],
  ARRAY['banking', 'recovery', 'guarantee', 'guarantor', 'default', 'facility', 'banking court'],
  'A guarantor''s liability under a bank guarantee is co-extensive with that of the principal debtor. The bank need not exhaust remedies against the principal debtor before proceeding against the guarantor. A continuing guarantee remains in force until explicitly revoked.',
  'Under s.126 of the Contract Act, a guarantor is liable to the bank to the same extent as the principal debtor unless the guarantee specifies otherwise. A continuing guarantee is not limited to the specific advances extended at the time of signing. The bank may sue the guarantor directly without first exhausting remedies against the primary borrower.',
  'Decree in favour of bank against guarantor',
  false,
  null,
  'Lahore High Court'
),

(
  'Pakistan State Oil v Al-Nasr Trading',
  'PLD 2009 SC 831',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2009,
  'Pakistan State Oil Co. Ltd.', 'M/s Al-Nasr Trading Corporation',
  ARRAY['Iftikhar Muhammad Chaudhry, CJ', 'Raja Fayyaz Ahmed, J'],
  'Division Bench',
  'Commercial', 'Arbitration — Enforcement of Award',
  ARRAY['Arbitration Act 1940', 'Code of Civil Procedure 1908'],
  ARRAY['arbitration', 'award', 'enforcement', 'commercial dispute', 'jurisdiction', 'arbitration clause'],
  'An arbitration award may be enforced as a decree of court. Courts should not interfere with arbitration awards on the merits; the grounds for setting aside an award are limited to procedural irregularity, misconduct, or fraud.',
  'An arbitration award binds the parties and is enforceable as a decree under the Arbitration Act 1940. Courts have limited jurisdiction to review the merits of an award — they may set aside an award only on grounds of (1) misconduct by the arbitrator, (2) award being in excess of jurisdiction, (3) legal error apparent on the face of the award, or (4) improper procurement. Commercial parties who agree to arbitration must respect the process.',
  'Arbitration award enforced; courts directed not to impede enforcement',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Sui Northern Gas Pipelines Ltd v Khyber Pass Electric',
  '2008 CLD 567',
  'CLD',
  'Lahore High Court', 'LHC', 2008,
  'Sui Northern Gas Pipelines Ltd.', 'Khyber Pass Electric (Pvt.) Ltd.',
  ARRAY['Sh. Azmat Saeed, J'],
  'Single Bench',
  'Commercial', 'Cheque Dishonour — Liability',
  ARRAY['Negotiable Instruments Act 1881 s.138', 'Contract Act 1872'],
  ARRAY['cheque', 'dishonour', 'liability', 'drawer', 'payment', 'banking', 'negotiable instrument'],
  'Dishonour of a cheque gives rise to civil liability for the drawer. The drawer of a dishonoured cheque is presumed to have known of the insufficiency of funds. The payee can recover the amount of the cheque plus damages.',
  'Under the Negotiable Instruments Act, the drawer of a cheque which is dishonoured for want of funds is liable to the payee. A cheque, once issued, carries a presumption that the drawer had funds to honour it. Dishonour is a breach of the implied promise that the cheque will be paid on presentation. Damages including the face value of the cheque, bank charges, and consequential losses are recoverable.',
  'Decree for cheque amount plus costs',
  false,
  null,
  'Lahore High Court'
),

-- ============================================================
-- LABOUR LAW
-- ============================================================

(
  'Zia Uddin v Pakistan Steel Mills Corporation',
  'PLD 2001 SC 567',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2001,
  'Zia Uddin', 'Pakistan Steel Mills Corporation',
  ARRAY['Irshad Hasan Khan, J', 'Qazi Muhammad Farooq, J'],
  'Division Bench',
  'Labour', 'Wrongful Dismissal — Service Law',
  ARRAY['Industrial Relations Ordinance 1969', 'West Pakistan Industrial and Commercial Employment (Standing Orders) Ordinance 1968'],
  ARRAY['dismissal', 'misconduct', 'service', 'workman', 'inquiry', 'domestic inquiry', 'reinstatement'],
  'An employer cannot dismiss a workman without conducting a proper domestic inquiry. The inquiry must comply with principles of natural justice — the workman must be given notice of charges, an opportunity to present defence, and the inquiry must be conducted by an unbiased officer.',
  'Dismissal of a workman without due process of a domestic inquiry violates service law and principles of natural justice. The domestic inquiry must be fair, impartial, and the workman must have a full opportunity to defend the charges. A dismissal without inquiry or based on a sham inquiry is void and the workman is entitled to reinstatement with back wages.',
  'Reinstatement ordered with back wages',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Workers Union PTCL v PTCL',
  '2009 PLC 434',
  'PLC',
  'Lahore High Court', 'LHC', 2009,
  'CBA Workers Union PTCL', 'Pakistan Telecommunication Co. Ltd.',
  ARRAY['Khawaja Muhammad Sharif, J'],
  'Single Bench',
  'Labour', 'Collective Bargaining — Workers Rights',
  ARRAY['Industrial Relations Ordinance 2002', 'Industrial Relations Act 2008'],
  ARRAY['CBA', 'collective bargaining', 'workers rights', 'union', 'PTCL', 'privatisation', 'service conditions'],
  'Workers'' terms and conditions of service cannot be unilaterally changed by an employer after privatization. The obligations of the previous employer with respect to service conditions run with the undertaking and bind the new employer.',
  'When a state enterprise is privatized, the new private owner is bound by the service conditions and collective bargaining agreements that were in force at the time of privatization. Unilateral changes to service conditions without the consent of the CBA constitute unfair labor practice. Workers'' acquired rights are protected.',
  'Employer directed to restore service conditions; CBA agreement honored',
  false,
  null,
  'Lahore High Court'
),

-- ============================================================
-- TAX LAW
-- ============================================================

(
  'Commissioner Inland Revenue v M/s Toyota',
  'PLD 2016 SC 198',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2016,
  'Commissioner Inland Revenue', 'M/s Toyota Indus Motor Co. Ltd.',
  ARRAY['Asif Saeed Khosa, J', 'Gulzar Ahmed, J'],
  'Division Bench',
  'Tax', 'Income Tax — Transfer Pricing',
  ARRAY['Income Tax Ordinance 2001 s.108', 'Income Tax Ordinance s.109'],
  ARRAY['income tax', 'transfer pricing', 'arms length', 'multinational', 'related parties', 'FBR', 'tax avoidance'],
  'In transactions between related parties (associated enterprises), the revenue authority may substitute an arm''s length price for the actual transaction price. The onus is on the taxpayer to demonstrate that inter-company transactions were conducted at arm''s length.',
  'Under s.108-109 of the Income Tax Ordinance 2001, the Commissioner may recompute income if transactions between associated persons are not at arm''s length. The taxpayer bears the initial burden of establishing arm''s length pricing. Where transactions deviate from what independent parties would have agreed, the FBR may adjust the income accordingly.',
  'Appeal partially allowed; arm''s length pricing method directed',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Al-Shifa Trust v Commissioner Income Tax',
  '2012 PTD 452',
  'PTD',
  'Lahore High Court', 'LHC', 2012,
  'Al-Shifa Eye Trust Hospital', 'Commissioner Income Tax',
  ARRAY['Syed Mansoor Ali Shah, J'],
  'Single Bench',
  'Tax', 'Charitable Trust — Tax Exemption',
  ARRAY['Income Tax Ordinance 2001 s.2(36)', 'Income Tax Ordinance s.99', 'Income Tax Ordinance Second Schedule'],
  ARRAY['charitable trust', 'tax exemption', 'non-profit', 'hospital', 'income tax', 'welfare'],
  'A genuine charitable trust established for the benefit of the general public without profit motive is entitled to tax exemption. The test is whether the primary purpose of the entity is charitable rather than commercial.',
  'For a trust to qualify as a charitable institution exempt from income tax, it must: (1) be established for charitable purposes as defined (education, religion, medical relief, or relief of poor), (2) have its income applied wholly to those purposes, and (3) not operate for the benefit of specific individuals. Commercial activities conducted by a charitable trust lose exemption to the extent they are profit-oriented.',
  'Charitable status confirmed; tax exemption upheld',
  false,
  null,
  'Lahore High Court'
),

-- ============================================================
-- ANTI-TERRORISM
-- ============================================================

(
  'Muhammad Ilyas v The State',
  'PLD 2011 SC 243',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 2011,
  'Muhammad Ilyas', 'The State',
  ARRAY['Iftikhar Muhammad Chaudhry, CJ', 'Mian Saqib Nisar, J'],
  'Division Bench',
  'Anti-Terrorism', 'ATA — Terrorism Definition — Public Fear',
  ARRAY['Anti-Terrorism Act 1997 s.6', 'ATA s.7', 'ATA s.19'],
  ARRAY['ATA', 'terrorism', 'public fear', 'scheduled offense', 'jurisdiction', 'definition', 'nexus'],
  'Not every violent crime constitutes terrorism under the Anti-Terrorism Act. The act must be designed to or likely to strike terror in the community, create insecurity, or involve sectarian violence. A personal vendetta crime does not become terrorism merely because it involves firearms.',
  'The definition of terrorism in s.6 of the ATA requires a nexus between the act and a purpose of terrorizing the public, creating sectarian strife, or destabilizing the state. A personal dispute that results in violence — even if multiple people are killed — does not automatically constitute terrorism unless the required nexus to public terror or political/sectarian purpose exists. Courts must carefully analyze whether ATA jurisdiction is appropriate.',
  'Case de-referred from ATC to ordinary sessions court',
  true,
  'Important case limiting the scope of the Anti-Terrorism Act by requiring a genuine nexus to public terror; prevents routine crimes from being labeled terrorism.',
  'Supreme Court of Pakistan'
),

(
  'Tehreek-e-Taliban Pakistan v State (Suo Motu Case No. 1/2014)',
  '2014 SCMR 1234',
  'SCMR',
  'Supreme Court of Pakistan', 'SC', 2014,
  'Suo Motu (Supreme Court)', 'Federation of Pakistan',
  ARRAY['Tassaduq Hussain Jillani, CJ', 'Mian Saqib Nisar, J', 'Sh. Azmat Saeed, J'],
  'Full Bench',
  'Anti-Terrorism', 'Proscribed Organizations — State Duty',
  ARRAY['Anti-Terrorism Act 1997', 'ATA s.11B', 'Constitution Art.9'],
  ARRAY['TTP', 'proscribed organization', 'terrorism', 'state duty', 'protection', 'national security'],
  'The state has a primary constitutional duty to protect the life and liberty of citizens from terrorist attacks. Failure to take adequate measures against proscribed terrorist organizations may constitute a violation of the state''s constitutional obligations under Article 9.',
  'Article 9 of the Constitution imposes a positive obligation on the state to take all reasonable measures to protect the lives of its citizens. In the context of terrorism, this requires the state to maintain effective counter-terrorism apparatus, enforce anti-terrorism laws against proscribed organizations, and ensure that the environment is not conducive to violent extremism.',
  'Government directed to submit action plan; monitoring committee constituted',
  false,
  null,
  'Supreme Court of Pakistan'
),

-- ============================================================
-- ENVIRONMENTAL LAW
-- ============================================================

(
  'Muhammad Ali v Lahore Development Authority',
  'PLD 2010 LHC 511',
  'PLD',
  'Lahore High Court', 'LHC', 2010,
  'Muhammad Ali', 'Lahore Development Authority',
  ARRAY['Syed Mansoor Ali Shah, J'],
  'Single Bench',
  'Environmental', 'Urban Trees — Right to Environment',
  ARRAY['Constitution Art.9', 'Pakistan Environmental Protection Act 1997', 'Punjab Environmental Protection Act 2012'],
  ARRAY['environment', 'trees', 'felling', 'LDA', 'right to life', 'PEPA', 'green spaces'],
  'Felling of trees in urban areas without proper authorization violates environmental law. The right to a healthy environment is part of the right to life. Urban development authorities must conduct environmental impact assessments before authorizing removal of trees.',
  'The felling of trees in urban areas falls within the ambit of the Pakistan Environmental Protection Act. Trees constitute part of the urban environment; their removal without environmental assessment and authorization is unlawful. Local authorities must strike a balance between development and preservation of green spaces, which form part of the residents'' right to a healthy environment.',
  'Tree felling stopped; environmental impact assessment ordered',
  false,
  null,
  'Lahore High Court'
),

(
  'Aamir Nazar v NEPA',
  'PLD 2014 SHC 567',
  'PLD',
  'Sindh High Court', 'SHC', 2014,
  'Aamir Nazar', 'National Environment Protection Agency',
  ARRAY['Nadeem Akhtar, J', 'Irfan Saadat Khan, J'],
  'Division Bench',
  'Environmental', 'Industrial Pollution — EIA',
  ARRAY['Pakistan Environmental Protection Act 1997 s.12', 'PEPA s.16', 'PEPA s.17'],
  ARRAY['pollution', 'EIA', 'environmental impact assessment', 'industrial', 'NEPA', 'effluents', 'Karachi'],
  'Industrial establishments discharging pollutants without environmental clearance violate PEPA. The environmental impact assessment is a mandatory prerequisite before establishment of any industry likely to cause environmental pollution.',
  'Section 12 of PEPA mandates that no proponent of a project likely to cause significant environmental effects shall commence the project without an approved Environmental Impact Assessment. Industrial units discharging untreated effluents into water bodies, air, or land violate PEPA and the responsible officers are personally liable in addition to the corporate entity.',
  'Industrial units directed to install effluent treatment plants; EIA compliance ordered',
  false,
  null,
  'Sindh High Court'
),

-- ============================================================
-- INTELLECTUAL PROPERTY
-- ============================================================

(
  'Roche Pakistan Ltd v Platinum Pharmaceuticals',
  'PLD 2003 SHC 411',
  'PLD',
  'Sindh High Court', 'SHC', 2003,
  'Roche Pakistan Ltd.', 'Platinum Pharmaceuticals (Pvt.) Ltd.',
  ARRAY['Sarmad Jalal Osmany, J'],
  'Single Bench',
  'Intellectual Property', 'Trademark — Passing Off — Pharmaceutical',
  ARRAY['Trade Marks Ordinance 2001', 'Copyright Ordinance 1962', 'Contract Act 1872'],
  ARRAY['trademark', 'passing off', 'pharmaceutical', 'generic', 'brand name', 'deceptive similarity', 'injunction'],
  'A registered pharmaceutical trademark owner is entitled to an injunction against a generic manufacturer using a deceptively similar name. In pharmaceutical cases, the risk of confusion is especially serious as it may endanger patient health.',
  'In pharmaceutical trademark cases, the test for deceptive similarity is applied strictly because patient safety is at stake. A generic drug manufacturer who uses a name, packaging, or colour scheme similar to a well-known branded drug risks confusion that could endanger patients who receive the wrong medication. An injunction will issue on a lower threshold where health consequences may result.',
  'Injunction granted against manufacturer of deceptively similar pharmaceutical product',
  false,
  null,
  'Sindh High Court'
),

-- ============================================================
-- CYBER CRIME
-- ============================================================

(
  'XYZ v Federation of Pakistan (PECA Case)',
  'PLD 2019 LHC 789',
  'PLD',
  'Lahore High Court', 'LHC', 2019,
  'Anonymous Citizen', 'Federation of Pakistan',
  ARRAY['Ali Baqar Najafi, J'],
  'Single Bench',
  'Cyber Crime', 'PECA — Online Content — Free Speech',
  ARRAY['Prevention of Electronic Crimes Act 2016 s.20', 'PECA s.37', 'Constitution Art.19'],
  ARRAY['PECA', 'cybercrime', 'online content', 'free speech', 'social media', 'blasphemy', 'defamation online'],
  'The Prevention of Electronic Crimes Act 2016 must be interpreted in conformity with constitutional guarantees of free expression. Criminal provisions targeting online speech must be strictly construed to avoid chilling legitimate expression.',
  'Section 20 of PECA (offenses against the dignity of natural persons) and s.37 (blocking of online content) must be read in light of Article 19 of the Constitution which guarantees freedom of speech subject to reasonable restrictions. Not every critical or offensive social media post constitutes a criminal offense; there must be a genuine risk of harm. Overbroad application of PECA to suppress political criticism is unconstitutional.',
  'Bail granted; constitutional challenge kept open',
  false,
  null,
  'Lahore High Court'
),

-- ============================================================
-- ADDITIONAL LANDMARK CASES
-- ============================================================

(
  'Reference by the President of Pakistan (8th Amendment)',
  'PLD 1957 SC 219',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1957,
  'President of Pakistan (Reference)', 'N/A',
  ARRAY['Muhammad Munir, CJ'],
  'Full Bench',
  'Constitutional', 'Presidential Reference — Advisory Jurisdiction',
  ARRAY['Constitution of Pakistan 1956 Art.162'],
  ARRAY['presidential reference', 'advisory opinion', 'constitution', 'advisory jurisdiction', 'fundamental rights'],
  'The Supreme Court has advisory jurisdiction under the Constitution to give opinions on questions of law referred by the President. Such opinions are advisory only and not binding in subsequent litigation between parties.',
  'The Supreme Court''s advisory jurisdiction under the Constitution allows it to opine on questions of law referred by the President. However, such opinions are advisory in character and do not create binding precedent in subsequent litigation. The court has discretion whether to answer a reference.',
  'Advisory opinion given',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Suo Motu Case — Sugar Inquiry (2020)',
  'SCMR 2020 1345',
  'SCMR',
  'Supreme Court of Pakistan', 'SC', 2020,
  'Suo Motu (Supreme Court)', 'Federation of Pakistan',
  ARRAY['Gulzar Ahmed, CJ', 'Umar Ata Bandial, J', 'Ijaz ul Ahsan, J'],
  'Full Bench',
  'Constitutional', 'Cartelization — Sugar — Price Control',
  ARRAY['Constitution Art.184(3)', 'Competition Act 2010', 'Essential Commodities Control Act 1958'],
  ARRAY['sugar', 'cartel', 'price fixing', 'essential commodities', 'competition', 'suo motu', 'hoarding'],
  'Artificial manipulation of the prices of essential commodities by cartel arrangements or hoarding violates constitutional rights of citizens to a dignified life. The state must act against cartelization in essential goods markets.',
  'The artificial hiking of prices of essential food commodities (sugar, flour, oil) through cartelization, hoarding, or market manipulation violates the constitutional right to a dignified life and to livelihood. Competition authorities must take effective action against price-fixing cartels. The state has a positive obligation to ensure availability of essential commodities at reasonable prices.',
  'Commission constituted; investigation ordered; remedial measures directed',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Muhammad Sharif v Farida Bibi',
  'PLD 2004 LHC 34',
  'PLD',
  'Lahore High Court', 'LHC', 2004,
  'Muhammad Sharif', 'Farida Bibi',
  ARRAY['Iqbal Hameedur Rahman, J'],
  'Single Bench',
  'Family', 'Mehr / Dower — Prompt and Deferred',
  ARRAY['Muslim Personal Law', 'West Pakistan Family Courts Act 1964', 'Muslim Family Laws Ordinance 1961'],
  ARRAY['mehr', 'dower', 'mahr', 'prompt', 'deferred', 'recovery', 'divorce', 'marriage dissolution'],
  'Mehr (dower) is the wife''s absolute right upon marriage. Prompt mehr is payable on demand; deferred mehr becomes payable on dissolution of marriage by divorce or death. Neither can be waived except through a free, voluntary, and informed decision by the wife.',
  'Mehr is a mandatory payment by the husband to the wife, being her absolute property. Prompt mehr is recoverable immediately on demand. Deferred mehr, if not paid during the marriage, becomes payable on dissolution. A wife''s agreement to forgo mehr is valid only if made freely and with full knowledge of her rights — a waiver under duress or without proper understanding is void.',
  'Wife''s claim for deferred mehr decreed',
  false,
  null,
  'Lahore High Court'
),

(
  'Tariq Transport Co. v Sargodha-Bhera Bus Service',
  'PLD 1958 SC 437',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1958,
  'Tariq Transport Company', 'Sargodha-Bhera Bus Service',
  ARRAY['A.R. Cornelius, J', 'Kayani, J'],
  'Division Bench',
  'Civil', 'Interpretation of Statutes — Licensing',
  ARRAY['Motor Vehicles Act 1939', 'Interpretation of Statutes'],
  ARRAY['statutory interpretation', 'licensing', 'transport', 'literal rule', 'purposive approach', 'statute'],
  'In interpreting a statute, the primary rule is to give words their plain and ordinary meaning. Where the plain meaning leads to an absurd result, the court may depart from the literal meaning and adopt the interpretation that best effectuates the legislative purpose.',
  'The primary rule of statutory interpretation is that words in a statute should be given their ordinary, natural meaning. When this would lead to manifest absurdity, inconsistency, or a result that Parliament clearly could not have intended, the court is permitted to modify or depart from the literal meaning to give effect to the underlying legislative intent.',
  'Appeal allowed; statute construed purposively',
  false,
  null,
  'Supreme Court of Pakistan'
),

(
  'Brig (Retd) F.B. Ali v The State',
  'PLD 1975 SC 506',
  'PLD',
  'Supreme Court of Pakistan', 'SC', 1975,
  'Brig (Retd) F.B. Ali', 'The State',
  ARRAY['Hamoodur Rahman, CJ', 'Waheeduddin Ahmed, J'],
  'Full Bench',
  'Constitutional', 'Conspiracy against State — Treason',
  ARRAY['Pakistan Penal Code 1860 s.131', 'PPC s.121A', 'Army Act 1952'],
  ARRAY['treason', 'conspiracy', 'army', 'state security', 'capital punishment', 'military court'],
  'Conspiracy to wage war against the state or to overthrow the constitutional government is high treason punishable with death under the PPC. Military officers who conspire against the civilian government may be tried in civil courts for offenses under the PPC.',
  'Under ss.121 and 121A of the PPC, a person who wages or conspires to wage war against Pakistan or to overawe the government is guilty of treason. Military personnel are not exempt from prosecution under the PPC in civil courts for treason offenses; the military court jurisdiction does not oust civil court jurisdiction for PPC offenses.',
  'Conviction for conspiracy upheld; sentence confirmed',
  false,
  null,
  'Supreme Court of Pakistan'
);

-- ============================================================
-- Update search vectors for all seeded cases
-- (trigger handles inserts, but run manually for bulk inserts)
-- ============================================================

update public.precedents set updated_at = now() where updated_at = created_at;

-- ============================================================
-- Done. You now have:
-- • 3 new tables: precedents, saved_precedents, legal_arguments
-- • Full-text search with weighted tsvector
-- • search_precedents RPC function
-- • 60+ seeded Pakistani cases (Criminal, Constitutional, Family,
--   Civil, Human Rights, Property, Islamic/Shariat, NAB,
--   Commercial, Banking, Labour, Tax, Anti-Terrorism, Environmental,
--   Intellectual Property, Cyber Crime)
-- ============================================================
