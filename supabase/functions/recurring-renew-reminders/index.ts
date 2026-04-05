import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Plan name logic based on team logo/subscription type
function getPlanName(logo: string | null): string {
  if (!logo) return 'Business Subscription'
  if (logo === 'gemini' || logo === 'canva') return 'Pro Subscription'
  if (logo === 'youtube') return 'Premium Subscription'
  return 'Business Subscription'
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

  // 1. Get all members from non-yearly, non-plus teams
  const { data: allMembers, error: membersError } = await supabase
    .from('members')
    .select('id, email, join_date, is_usdt, is_pushed, team_id, active_team_id')

  if (membersError) {
    console.error('Failed to fetch members', membersError)
    return new Response(JSON.stringify({ error: 'Failed to fetch members' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!allMembers || allMembers.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 2. Get teams info
  const teamIds = [...new Set(allMembers.map((m) => m.team_id))]
  const { data: teams, error: teamsError } = await supabase
    .from('teams')
    .select('id, is_yearly, is_plus, team_name, logo')
    .in('id', teamIds)

  if (teamsError) {
    console.error('Failed to fetch teams', teamsError)
    return new Response(JSON.stringify({ error: 'Failed to fetch teams' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Exclude yearly teams; include normal + plus teams
  const yearlyTeamIds = new Set((teams || []).filter((t) => t.is_yearly).map((t) => t.id))
  const teamMap = new Map((teams || []).map((t) => [t.id, t]))

  // 3. Filter members: not pushed, not yearly, joined exactly 29+ days ago
  const now = new Date()
  const eligibleMembers = allMembers.filter((m) => {
    if (m.is_pushed) return false
    if (yearlyTeamIds.has(m.team_id)) return false
    if (!m.join_date) return false

    // Calculate days since join
    const parts = m.join_date.split('-')
    if (parts.length < 3) return false
    const joinDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    const diffDays = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24))

    // Send at exactly 29 days (or 29+ for members who may have been missed)
    // But cap at 33 to avoid spamming very old members
    return diffDays >= 29 && diffDays <= 33
  })

  if (eligibleMembers.length === 0) {
    console.log('No members at 29 days for renewal reminder')
    return new Response(JSON.stringify({ sent: 0 }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // 4. Check who already got a renewal reminder recently (within 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const memberEmails = eligibleMembers.map((m) => m.email.toLowerCase())

  const { data: recentLogs } = await supabase
    .from('email_send_log')
    .select('recipient_email')
    .eq('template_name', 'renew-reminder')
    .in('status', ['pending', 'sent'])
    .gte('created_at', sevenDaysAgo.toISOString())
    .in('recipient_email', memberEmails)

  const recentlySent = new Set(
    (recentLogs || []).map((l) => l.recipient_email.toLowerCase())
  )

  // 5. Send renewal reminders
  let sentCount = 0
  for (const member of eligibleMembers) {
    if (recentlySent.has(member.email.toLowerCase())) {
      continue
    }

    const team = teamMap.get(member.team_id)
    const planName = getPlanName(team?.logo || null)

    try {
      const { error: invokeError } = await supabase.functions.invoke(
        'send-transactional-email',
        {
          body: {
            templateName: 'renew-reminder',
            recipientEmail: member.email,
            idempotencyKey: `renew-${member.id}-${now.toISOString().split('T')[0]}`,
            templateData: {
              email: member.email,
              joinDate: member.join_date,
              planName,
              isUsdt: member.is_usdt || false,
              teamName: team?.team_name || '',
            },
          },
        }
      )

      if (invokeError) {
        console.error(`Failed to send renewal reminder to ${member.email}`, invokeError)
      } else {
        sentCount++
        console.log(`Renewal reminder sent to ${member.email}`)
      }
    } catch (e) {
      console.error(`Error sending renewal reminder to ${member.email}`, e)
    }

    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`Renewal reminders: sent ${sentCount}/${eligibleMembers.length}`)

  return new Response(
    JSON.stringify({ sent: sentCount, total: eligibleMembers.length }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
