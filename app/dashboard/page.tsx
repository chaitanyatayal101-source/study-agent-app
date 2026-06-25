import { createClient } from '@/lib/supabase'

import PageShell from '../components/PageShell'
import DashboardClient from './DashboardClient'

type ConceptRow = {
  subject: string
  concept: string
  mastery_level?: string | null
  overview_gist?: string | null
  deep_dive_gist?: string[] | null
  strong_areas?: string[] | null
  weak_areas?: string[] | null
  next_steps?: string[] | null
  last_updated?: string | null
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data, error } = await supabase.from('concepts').select('*').order('last_updated', { ascending: false })

  const concepts = (data ?? []) as ConceptRow[]

  return (
    <PageShell maxWidth="max-w-6xl">
      <DashboardClient concepts={concepts} errorMessage={error?.message ?? null} />
    </PageShell>
  )
}
