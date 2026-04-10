const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const callClaude = async (systemPrompt, userMessage) => {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });
  return response.content[0].text;
};

// 1. Goldman Sachs - Stock Screener
exports.stockScreener = async (req, res) => {
  try {
    const { riskTolerance, investmentAmount, timeHorizon, sectors, goals } = req.body;
    const system = `You are a senior equity analyst at Goldman Sachs with 20 years of experience screening stocks for high-net-worth clients. You provide institutional-grade research with precise data, specific ticker symbols, and professional formatting. Always structure your response with clear sections and tables.`;
    const user = `I need a complete stock screening framework for my investment goals.

Investment Profile:
- Risk Tolerance: ${riskTolerance}
- Investment Amount: $${investmentAmount}
- Time Horizon: ${timeHorizon}
- Preferred Sectors: ${sectors}
- Goals: ${goals}

Analyze and provide:
1. Top 10 stocks matching my criteria with ticker symbols
2. P/E ratio analysis compared to sector averages
3. Revenue growth trends over the last 5 years
4. Debt-to-equity health check for each pick
5. Dividend yield and payout sustainability score
6. Competitive moat rating (Weak / Moderate / Strong)
7. Bull case and bear case price targets for 12 months
8. Risk rating on a scale of 1-10 with clear reasoning
9. Entry price zones and stop-loss suggestions

Format as a professional Goldman Sachs equity research screening report with a summary table at the top.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Goldman Sachs Stock Screener' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Morgan Stanley - DCF Valuation
exports.dcfValuation = async (req, res) => {
  try {
    const { ticker, companyName } = req.body;
    const system = `You are a VP-level investment banker at Morgan Stanley who builds valuation models for Fortune 500 M&A deals. You are known for rigorous DCF models, precise financial projections, and clear investment verdicts backed by quantitative analysis.`;
    const user = `I need a full discounted cash flow analysis for ${companyName} (${ticker}).

Build out:
1. 5-year revenue projection with growth assumptions (Year 1-5 table)
2. Operating margin estimates based on historical trends
3. Free cash flow calculations year by year
4. Weighted average cost of capital (WACC) estimate with breakdown
5. Terminal value using both exit multiple and perpetuity growth methods
6. Sensitivity table showing fair value at different discount rates (8%-14%)
7. Comparison of DCF value vs current estimated market price
8. Clear verdict: Undervalued / Fairly Valued / Overvalued
9. Key assumptions that could break the model (bull/bear)

Format as a Morgan Stanley investment banking valuation memo with tables and clear math. Include a decision summary box at the top.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Morgan Stanley DCF Valuation' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Bridgewater - Risk Analysis
exports.riskAnalysis = async (req, res) => {
  try {
    const { holdings, portfolioValue } = req.body;
    const system = `You are a senior risk analyst at Bridgewater Associates, trained by Ray Dalio's principles of radical transparency in investing. You specialize in all-weather portfolio construction, correlation analysis, and systematic risk management.`;
    const user = `I need a complete risk assessment of my current portfolio.

Portfolio:
${holdings}
Total Portfolio Value: $${portfolioValue}

Evaluate:
1. Correlation analysis between my holdings (high/medium/low matrix)
2. Sector concentration risk with percentage breakdown
3. Geographic exposure and currency risk factors
4. Interest rate sensitivity for each position
5. Recession stress test showing estimated drawdown (2008 scenario, 2020 scenario)
6. Liquidity risk rating for each holding
7. Single stock risk and position sizing recommendations
8. Tail risk scenarios with probability estimates
9. Top 3 hedging strategies to reduce my biggest risks
10. Rebalancing suggestions with specific allocation percentages

Format as a professional Bridgewater risk management report with a risk heat map summary table. Rate overall portfolio risk 1-10.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Bridgewater Risk Analysis' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 4. JPMorgan - Earnings Breakdown
exports.earningsBreakdown = async (req, res) => {
  try {
    const { company, ticker, earningsDate } = req.body;
    const system = `You are a senior equity research analyst at JPMorgan Chase who writes earnings previews for institutional investors. Your reports are known for actionable trade recommendations and precise quantitative analysis.`;
    const user = `I need a complete earnings analysis before ${company} (${ticker}) reports${earningsDate ? ` on ${earningsDate}` : ''}.

Deliver:
1. Last 4 quarters earnings vs estimates (beat or miss history with EPS and revenue)
2. Revenue and EPS consensus estimates for the upcoming quarter
3. Key metrics Wall Street is watching for this specific company
4. Segment-by-segment revenue breakdown and trends
5. Management guidance from last earnings call summarized
6. Options market implied move for earnings day (estimated)
7. Historical stock price reaction after last 4 earnings reports (+/-%)
8. Bull case scenario and price impact estimate
9. Bear case scenario and downside risk estimate
10. My recommended play: Buy before / Sell before / Wait

Format as a JPMorgan pre-earnings research brief with a DECISION SUMMARY box at the very top.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'JPMorgan Earnings Breakdown' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 5. BlackRock - Portfolio Builder
exports.portfolioBuilder = async (req, res) => {
  try {
    const { age, income, savings, goals, riskTolerance, accountType, monthlyInvestment } = req.body;
    const system = `You are a senior portfolio strategist at BlackRock managing multi-asset portfolios worth $500M+ for institutional clients. You apply factor investing, smart beta strategies, and tax-efficient portfolio construction.`;
    const user = `I need a custom investment portfolio built from scratch for my situation.

My Details:
- Age: ${age}
- Annual Income: $${income}
- Current Savings: $${savings}
- Investment Goals: ${goals}
- Risk Tolerance: ${riskTolerance}
- Account Type: ${accountType}
- Monthly Investment: $${monthlyInvestment || 0}

Create:
1. Exact asset allocation with percentages across stocks, bonds, alternatives, cash
2. Specific ETF or fund recommendations for each category with ticker symbols
3. Core holdings (70%) vs satellite positions (30%) clearly labeled
4. Expected annual return range based on historical data
5. Expected maximum drawdown in a bad year
6. Rebalancing schedule and trigger rules (quarterly/annual + % drift rule)
7. Tax efficiency strategy for my account type
8. Dollar cost averaging plan if I invest monthly
9. Benchmark to measure performance against
10. One-page investment policy statement I can follow

Format as a BlackRock investment policy document with an allocation breakdown table.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'BlackRock Portfolio Builder' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 6. Institutional Stock Breakdown
exports.stockBreakdown = async (req, res) => {
  try {
    const { ticker, focusAreas } = req.body;
    const system = `You are a professional equity analyst at a top-tier institutional investment firm. You write deep-dive research notes that combine fundamental analysis, competitive intelligence, and forward-looking thesis building.`;
    const user = `Act as a professional equity analyst. Analyze the company ${ticker}${focusAreas ? `. Focus especially on: ${focusAreas}` : ''}.

Provide:
1. Business Model Overview — how the company makes money, revenue streams
2. Key Revenue Drivers — what factors drive growth or decline
3. Competitive Advantages (Moat Analysis) — pricing power, network effects, switching costs, IP
4. Key Risks — regulatory, competitive, macro, execution risks
5. Management Quality Assessment — track record, capital allocation
6. Long-Term Growth Potential — TAM, market share opportunity, growth catalysts
7. Bullish Investment Thesis — the case for buying with price target
8. Bearish Investment Thesis — the case against with downside scenario
9. Key Metrics to Monitor — KPIs that will prove or disprove the thesis
10. Final Analyst Rating: Strong Buy / Buy / Hold / Sell / Strong Sell

Format as a professional equity research note with an executive summary at the top.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Institutional Stock Breakdown' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 7. Smart Trade Setup Builder
exports.tradeSetup = async (req, res) => {
  try {
    const { ticker, currentPrice, tradeType, timeframe, riskAmount } = req.body;
    const system = `You are a professional trading strategist and technical analyst with 15 years of experience in equities, forex, and commodities. You specialize in high-probability trade setups using market structure, risk-reward analysis, and institutional order flow concepts.`;
    const user = `Create a structured trade plan for ${ticker}.

Trade Details:
- Current Price: $${currentPrice}
- Trade Direction: ${tradeType || 'Both Long and Short scenarios'}
- Timeframe: ${timeframe || 'Swing trade (days to weeks)'}
- Risk Amount: $${riskAmount || 'Suggest appropriate sizing'}

Build:
1. Entry Zone — specific price range with reasoning
2. Stop Loss Level — exact price with % risk
3. Target 1 (TP1) — conservative target with R:R ratio
4. Target 2 (TP2) — extended target with R:R ratio
5. Target 3 (TP3) — maximum upside target
6. Position Size Recommendation
7. Trade Invalidation Conditions
8. Key Levels to Watch — support, resistance, pivots
9. Market Context — conditions affecting this trade
10. Trade Grade: A+ / A / B / C

Format as a professional trade brief with ENTRY / STOP / TARGET summary box at the top.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Smart Trade Setup Builder' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 8. Earnings Reaction Analyzer
exports.earningsReaction = async (req, res) => {
  try {
    const { company, ticker, numQuarters } = req.body;
    const system = `You are a quantitative equity strategist specializing in earnings event analysis. You study historical earnings reaction patterns to identify statistical edges for traders positioning around earnings announcements.`;
    const user = `Analyze the last ${numQuarters || 4} earnings reports for ${company} (${ticker}).

Identify:
1. Earnings Beat/Miss History — EPS and revenue vs estimates each quarter
2. Average Post-Earnings Stock Move — magnitude and direction pattern
3. Guidance Patterns — raised, lowered, or maintained?
4. Sentiment Shifts — analyst rating changes after each report
5. Key Earnings Surprises — biggest beats and misses, what caused them
6. Seasonality Patterns — which quarters historically perform best/worst
7. Options Implied Move vs Actual Move comparison
8. Institutional Reaction — buying/selling patterns after earnings
9. What Traders Should Watch Next — 3 most critical metrics
10. Statistical Edge Summary — buy before / sell before / stay flat?

Format as a pre-earnings intelligence brief with a PATTERN SUMMARY table.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Earnings Reaction Analyzer' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 9. Portfolio Risk Scanner
exports.portfolioRiskScan = async (req, res) => {
  try {
    const { stocks, portfolioSize, goal } = req.body;
    const system = `You are a portfolio risk manager at a leading hedge fund. You specialize in identifying hidden risks, correlation traps, and concentration dangers in multi-asset portfolios.`;
    const user = `My portfolio: ${stocks}
Portfolio Value: $${portfolioSize}
Goal: ${goal}

Conduct a risk scan:
1. Sector Concentration Analysis — overweighted sectors with % breakdown
2. Correlation Risk Map — holdings that move together
3. Single Stock Risk — positions too large relative to portfolio
4. Macro Sensitivity — interest rates, inflation, USD exposure
5. Geographic/Currency Risk breakdown
6. Liquidity Risk — can you exit all positions in a crisis?
7. Drawdown Simulation — loss in -10%, -20%, -30% market scenarios
8. Top 3 Portfolio Weaknesses
9. Recommended Fixes — specific changes to reduce each weakness
10. Overall Portfolio Health Score: 1-10

Format as an executive risk scan with a RISK DASHBOARD (red/yellow/green) at the top.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Portfolio Risk Scanner' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 10. Sector Opportunity Finder
exports.sectorFinder = async (req, res) => {
  try {
    const { macroConditions, timeframe } = req.body;
    const system = `You are a macro strategist and sector rotation specialist at a top global investment bank. You identify sector opportunities based on macroeconomic cycles, monetary policy, and thematic trends. Your sector calls have consistently outperformed the S&P 500.`;
    const user = `Based on current macro conditions: ${macroConditions}

Identify 5 sectors likely to outperform over the next ${timeframe || '6-12 months'}.

For each sector provide:
1. Sector Name and why it outperforms in current macro environment
2. Key macro tailwinds driving the opportunity
3. Top 3 specific companies within the sector (with tickers)
4. Brief investment thesis for each company
5. Key risks that could derail this sector call
6. Suggested allocation % for a diversified portfolio
7. Entry timing — buy now / wait for pullback / accumulate gradually
8. Performance catalyst — what event/data will confirm the thesis

Format as a macro sector rotation report with a SECTOR SCORECARD table ranking all 5 by opportunity score.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Sector Opportunity Finder' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 11. Long-Term Compounder Finder
exports.compounderFinder = async (req, res) => {
  try {
    const { exampleCompany, criteria } = req.body;
    const system = `You are a fundamental growth investor in the style of Warren Buffett, Charlie Munger, and Terry Smith. You specialize in identifying exceptional businesses with durable competitive advantages, high returns on capital, and the ability to compound shareholder wealth for decades.`;
    const user = `Find companies similar to ${exampleCompany}.${criteria ? ` Additional criteria: ${criteria}` : ''}

Screen for businesses with:
- Strong and accelerating revenue growth
- High and expanding profit margins
- Durable competitive advantages (moat)
- Scalable business model (asset-light preferred)
- Strong management with skin in the game
- High return on invested capital (ROIC > 15%)

For each of the 5 candidates provide:
1. Company Name and Ticker
2. Why it's similar to ${exampleCompany}
3. Core competitive advantage (moat type)
4. Revenue growth rate (3-year CAGR)
5. Net profit margin and ROIC
6. Addressable market size (TAM)
7. 5-year compounding potential (estimated return)
8. Key risk to the long-term thesis
9. Ideal entry price zone / current valuation assessment
10. Investment Conviction Level: High / Medium / Speculative

Format as a long-term compounder research report with a COMPARISON TABLE at the top.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Long-Term Compounder Finder' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 12. News Sentiment Analyzer
exports.newsSentiment = async (req, res) => {
  try {
    const { ticker, companyName, headlines, timeframe } = req.body;
    const system = `You are a senior equity research analyst and media intelligence specialist at a top-tier hedge fund. You specialize in analyzing news flow, sentiment shifts, and their quantitative impact on stock prices. You provide institutional-grade news interpretation that goes beyond surface-level headlines.`;
    const user = `Analyze the following news headlines for ${companyName || ticker} (${ticker}).

Headlines:
${headlines}

Timeframe context: ${timeframe || 'Near-term (1-4 weeks)'}

Provide a complete news sentiment intelligence report:

1. **Overall Sentiment Score** — Rate as: Strongly Bearish / Bearish / Neutral / Bullish / Strongly Bullish (with numeric score -10 to +10)
2. **Headline-by-Headline Breakdown** — For each headline: sentiment tag, significance rating (1-5), and why it matters
3. **Key Themes Identified** — Top 3 narratives driving the sentiment
4. **Institutional Interpretation** — How large funds and algos are likely reading this news flow
5. **Short-Term Price Impact (1-5 days)** — Expected direction and magnitude with reasoning
6. **Medium-Term Impact (1-4 weeks)** — Trend continuation or reversal signals
7. **News Catalysts to Watch** — Upcoming events that could flip the narrative
8. **Risk Factors in Current News** — Hidden risks buried in the headlines
9. **Trade Implication** — Based purely on news sentiment: Buy / Hold / Sell with conviction level
10. **Sentiment vs Price Action** — Whether current sentiment is already priced in or not

Format as a professional news intelligence brief with a SENTIMENT DASHBOARD at the top showing: Score, Direction, Conviction.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'News Sentiment Analyzer' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// 13. Options Strategy Builder
exports.optionsStrategy = async (req, res) => {
  try {
    const { ticker, currentPrice, catalyst, catalystDate, sentiment, riskTolerance, accountSize } = req.body;
    const system = `You are a professional options trader and derivatives strategist with 15+ years of experience at a major options market maker. You specialize in event-driven options strategies, volatility trading, and risk-defined plays for both retail and institutional clients. You are known for precise strike selection, optimal expiration choice, and clear risk/reward framing.`;
    const user = `Build a complete options strategy for ${ticker}.

Trade Parameters:
- Current Stock Price: $${currentPrice}
- Catalyst / Event: ${catalyst}
- Catalyst Date: ${catalystDate || 'Within 4 weeks'}
- Market Sentiment: ${sentiment || 'Neutral'}
- Risk Tolerance: ${riskTolerance || 'Moderate'}
- Account Size: $${accountSize || '10000'}

Build the full options playbook:

1. **Recommended Primary Strategy** — Name it (e.g., Bull Call Spread, Straddle, Iron Condor, Cash-Secured Put, etc.)
2. **Why This Strategy** — Match to the catalyst, sentiment, and risk profile
3. **Exact Trade Structure** — Specific strikes, expiration date, number of contracts for a $1,000 risk
4. **Max Profit / Max Loss** — Dollar amounts and percentages
5. **Breakeven Point(s)** — Exact price(s) where the trade breaks even
6. **Probability of Profit** — Estimated win rate based on typical setups
7. **Implied Volatility Considerations** — Is IV high or low? Should you buy or sell premium?
8. **Entry Timing** — When exactly to enter relative to the catalyst
9. **Exit Plan** — Take profit target, stop loss, and time decay management
10. **Alternative Strategy** — A secondary lower-risk play if the primary is too aggressive
11. **Greeks Summary** — Delta, Theta, Vega impact on this trade
12. **Risk Warning** — Key scenarios where this trade loses money

Format as a professional options trade brief with a TRADE STRUCTURE BOX at the top showing: Strategy, Entry, Max Profit, Max Loss, Breakeven.`;
    const result = await callClaude(system, user);
    res.json({ success: true, analysis: result, module: 'Options Strategy Builder' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
