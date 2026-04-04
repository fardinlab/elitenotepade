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

  // We need auth to read from external DB - use service role approach
  // Since anon key might have RLS, let's try fetching
  const { data: teams, error: teamsError } = await extSupabase
    .from('teams')
    .select('id, team_name, logo, is_yearly, is_plus')
    .or('is_yearly.is.null,is_yearly.eq.false')

  if (teamsError) {
    console.error('Failed to fetch teams', teamsError)
    return new Response(JSON.stringify({ error: 'Failed to fetch teams', details: teamsError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!teams || teams.length === 0) {
    return new Response(JSON.stringify({ processed: 0, message: 'No qualifying teams' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const teamIds = teams.map(t => t.id)
  const teamMap = new Map(teams.map(t => [t.id, t]))

  // Get members with pending_amount > 0, not pushed
  const { data: members, error: membersError } = await extSupabase
    .from('members')
    .select('id, email, team_id, join_date, pending_amount, is_pushed, is_usdt')
    .in('team_id', teamIds)
    .gt('pending_amount', 0)
    .or('is_pushed.is.null,is_pushed.eq.false')

  if (membersError) {
    console.error('Failed to fetch members', membersError)
    return new Response(JSON.stringify({ error: 'Failed to fetch members', details: membersError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!members || members.length === 0) {
    console.log('No members with pending dues')
    return new Response(JSON.stringify({ processed: 0, message: 'No members with pending dues' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  let sent = 0
  for (const member of members) {
    if (!member.email) continue

    const team = teamMap.get(member.team_id)
    if (!team) continue

    // Check last due-reminder sent to this member (from Cloud Supabase)
    const { data: lastSent } = await cloudSupabase
      .from('email_send_log')
      .select('created_at')
      .eq('template_name', 'due-reminder')
      .eq('recipient_email', member.email)
      .order('created_at', { ascending: false })
      .limit(1)

    if (lastSent && lastSent.length > 0) {
      const lastSentDate = new Date(lastSent[0].created_at)
      const daysSinceLast = Math.floor((today.getTime() - lastSentDate.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceLast < 3) {
        console.log(`Skipping ${member.email} - last reminder ${daysSinceLast} day(s) ago`)
        continue
      }
    }

    const subscriptionName = team.logo ? SUBSCRIPTION_NAMES[team.logo] : undefined

    try {
      await cloudSupabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'due-reminder',
          recipientEmail: member.email,
          idempotencyKey: `due-reminder-${member.id}-${todayStr}`,
          templateData: {
            teamName: team.team_name,
            subscriptionName,
            memberEmail: member.email,
            pendingAmount: String(member.pending_amount),
            joinDate: member.join_date,
          },
        },
      })
      sent++
      console.log(`Due reminder sent to ${member.email} (pending: ${member.pending_amount})`)
    } catch (e) {
      console.error(`Failed to send due reminder to ${member.email}:`, e)
    }
  }

  console.log(`Due reminders: ${sent}/${members.length} sent`)
  return new Response(JSON.stringify({ processed: sent, total: members.length }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
