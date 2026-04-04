import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// External Supabase project where teams/members data lives
const EXTERNAL_SUPABASE_URL = 'https://evcxopgdkkivlinjltdz.supabase.co'
const EXTERNAL_SUPABASE_KEY = 'sb_publishable_vbMguK56zKwjTAzgy8bbbw_qDY3Vw3h'

const SUBSCRIPTION_NAMES: Record<string, string> = {
  chatgpt: 'ChatGPT',
  gemini: 'Gemini AI',
  perplexity: 'Perplexity',
  youtube: 'YouTube',
  canva: 'Canva',
  quillbot: 'QuillBot',
  crunchyroll: 'Crunchyroll',
  netflix: 'Netflix',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Cloud Supabase for sending emails
  const cloudUrl = Deno.env.get('SUPABASE_URL')!
  const cloudKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const cloudSupabase = createClient(cloudUrl, cloudKey)

  // External Supabase for reading teams/members
  const extSupabase = createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_KEY)

  const today = new Date()
  const targetDate = new Date(today)
  targetDate.setDate(targetDate.getDate() - 29)
  const targetDateStr = targetDate.toISOString().split('T')[0]

  const { data: teams, error: teamsError } = await extSupabase
    .from('teams')
    .select('id, team_name, logo, is_yearly, is_plus')
    .or('is_yearly.is.null,is_yearly.eq.false')

  if (teamsError) {
    console.error('Failed to fetch teams', teamsError)
    return new Response(JSON.stringify({ error: 'Failed to fetch teams' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!teams || teams.length === 0) {
    return new Response(JSON.stringify({ processed: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const teamIds = teams.map(t => t.id)
  const teamMap = new Map(teams.map(t => [t.id, t]))

  const { data: members, error: membersError } = await extSupabase
    .from('members')
    .select('id, email, team_id, join_date, is_pushed')
    .in('team_id', teamIds)
    .eq('join_date', targetDateStr)
    .or('is_pushed.is.null,is_pushed.eq.false')

  if (membersError) {
    console.error('Failed to fetch members', membersError)
    return new Response(JSON.stringify({ error: 'Failed to fetch members' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!members || members.length === 0) {
    console.log('No members need renewal reminder today')
    return new Response(JSON.stringify({ processed: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let sent = 0
  for (const member of members) {
    if (!member.email) continue

    const team = teamMap.get(member.team_id)
    if (!team) continue

    const subscriptionName = team.logo ? SUBSCRIPTION_NAMES[team.logo] : undefined
    const expiryDate = new Date(member.join_date)
    expiryDate.setDate(expiryDate.getDate() + 30)
    const expiryDateStr = expiryDate.toISOString().split('T')[0]

    try {
      await cloudSupabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'renewal-reminder',
          recipientEmail: member.email,
          idempotencyKey: `renewal-${member.id}-${targetDateStr}`,
          templateData: {
            teamName: team.team_name,
            subscriptionName,
            expiryDate: expiryDateStr,
            memberEmail: member.email,
          },
        },
      })
      sent++
      console.log(`Renewal reminder sent to ${member.email}`)
    } catch (e) {
      console.error(`Failed to send renewal to ${member.email}:`, e)
    }
  }

  console.log(`Renewal reminders: ${sent}/${members.length} sent`)
  return new Response(JSON.stringify({ processed: sent, total: members.length }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
