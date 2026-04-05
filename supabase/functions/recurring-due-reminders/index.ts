import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    return new Response(JSON.stringify({ error: 'Config error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Get all members with pending_amount > 0
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('id, email, pending_amount, is_usdt, is_pushed, team_id')
    .gt('pending_amount', 0)

  if (membersError) {
    console.error('Failed to fetch members', membersError)
    return new Response(JSON.stringify({ error: 'Failed to fetch members' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!members || members.length === 0) {
    console.log('No members with pending amounts')
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 2. Get teams to exclude yearly teams and pushed members
  const teamIds = [...new Set(members.map((m) => m.team_id))]
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, is_yearly, team_name')
    .in('id', teamIds)

  if (teamsError) {
    console.error('Failed to fetch teams', teamsError)
    return new Response(JSON.stringify({ error: 'Failed to fetch teams' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const yearlyTeamIds = new Set((teams || []).filter((t) => t.is_yearly).map((t) => t.id))
  const teamNameMap = new Map((teams || []).map((t) => [t.id, t.team_name]))

  // Filter: exclude pushed members and yearly team members
  const eligibleMembers = members.filter(
    (m) => !m.is_pushed && !yearlyTeamIds.has(m.team_id)
  )

  if (eligibleMembers.length === 0) {
    console.log('No eligible members for due reminders')
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 3. Check which members got a due-reminder in the last 3 days
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const memberEmails = eligibleMembers.map((m) => m.email.toLowerCase())

  const { data: recentLogs, error: logError } = await supabase
    .from('email_send_log')
    .select('recipient_email, created_at')
    .eq('template_name', 'due-reminder')
    .in('status', ['pending', 'sent'])
    .gte('created_at', threeDaysAgo.toISOString())
    .in('recipient_email', memberEmails)

  if (logError) {
    console.error('Failed to check recent logs', logError)
  }

  const recentlySent = new Set(
    (recentLogs || []).map((l) => l.recipient_email.toLowerCase())
  )

  // 4. Send due reminders to members who haven't received one in 3 days
  let sentCount = 0
  for (const member of eligibleMembers) {
    if (recentlySent.has(member.email.toLowerCase())) {
      continue
    }

    try {
      const { error: invokeError } = await supabase.functions.invoke(
        'send-transactional-email',
        {
          body: {
            templateName: 'due-reminder',
            recipientEmail: member.email,
            idempotencyKey: `recurring-due-${member.id}-${new Date().toISOString().split('T')[0]}`,
            templateData: {
              email: member.email,
              dueAmount: member.pending_amount,
              isUsdt: member.is_usdt || false,
              teamName: teamNameMap.get(member.team_id) || '',
            },
          },
        }
      )

      if (invokeError) {
        console.error(`Failed to send due reminder to ${member.email}`, invokeError)
      } else {
        sentCount++
        console.log(`Due reminder sent to ${member.email} (${member.pending_amount})`)
      }
    } catch (e) {
      console.error(`Error sending due reminder to ${member.email}`, e)
    }

    // Small delay between sends to avoid overwhelming
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`Recurring due reminders: sent ${sentCount}/${eligibleMembers.length}`)

  return new Response(
    JSON.stringify({ sent: sentCount, total: eligibleMembers.length }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
