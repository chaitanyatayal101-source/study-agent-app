import { NextResponse } from 'next/server'

import { createServerSupabaseClient } from '@/lib/supabase'

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

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Please sign in to save your progress.' }, { status: 401 })
  }

  const payload = {
    user_id: user.id,
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
  }

  const { data: existing, error: lookupError } = await supabase
    .from('concepts')
    .select('id')
    .eq('user_id', user.id)
    .eq('subject', subject)
    .eq('concept', concept)
    .maybeSingle()

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 })
  }

  const { error } = existing?.id
    ? await supabase.from('concepts').update(payload).eq('id', existing.id)
    : await supabase.from('concepts').insert(payload)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
