import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase'

export async function POST(request: Request) {
  const body = await request.json()

  const subject = typeof body?.subject === 'string' ? body.subject : ''
  const concept = typeof body?.concept === 'string' ? body.concept : ''
  const masteryLevel = typeof body?.masteryLevel === 'string' ? body.masteryLevel : null
  const overviewGist = typeof body?.overviewGist === 'string' ? body.overviewGist : null
  const deepDiveGist = Array.isArray(body?.deepDiveGist)
    ? body.deepDiveGist.filter((item: unknown): item is string => typeof item === 'string')
    : []
  const strongAreas = Array.isArray(body?.strongAreas)
    ? body.strongAreas.filter((item: unknown): item is string => typeof item === 'string')
    : []
  const weakAreas = Array.isArray(body?.weakAreas)
    ? body.weakAreas.filter((item: unknown): item is string => typeof item === 'string')
    : []
  const nextSteps = Array.isArray(body?.nextSteps)
    ? body.nextSteps.filter((item: unknown): item is string => typeof item === 'string')
    : []
  const notes = typeof body?.notes === 'string' ? body.notes : null

  if (!subject || !concept) {
    return NextResponse.json({ error: 'subject and concept are required' }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase.from('concepts').upsert(
    {
      subject,
      concept,
      mastery_level: masteryLevel,
      overview_gist: overviewGist,
      deep_dive_gist: deepDiveGist,
      strong_areas: strongAreas,
      weak_areas: weakAreas,
      next_steps: nextSteps,
      notes,
      last_updated: new Date().toISOString(),
    },
    {
      onConflict: 'subject,concept',
    }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
