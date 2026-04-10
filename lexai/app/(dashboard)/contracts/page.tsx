import { createClient } from '@/lib/supabase/server'
import { ContractUpload } from '@/components/contracts/ContractUpload'
import { ContractList } from '@/components/contracts/ContractList'

export default async function ContractsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: contracts } = await supabase
    .from('contracts')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('users')
    .select('plan')
    .eq('id', user!.id)
    .single()

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contract Analysis</h1>
        <p className="mt-1 text-gray-500">
          Upload a contract to get an instant risk score, red flags, and plain-English summary.
        </p>
      </div>

      <ContractUpload userPlan={profile?.plan ?? 'free'} />

      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Analyzed Contracts ({contracts?.length ?? 0})
        </h2>
        <ContractList contracts={contracts ?? []} />
      </div>
    </div>
  )
}
