

## Automated Email System for Tech Subx BD

### What We'll Build

1. **Welcome Email** — sent automatically when you add a member to any team
2. **Due/Payment Reminder Email** — sent automatically when you add or edit a member's due amount
3. **Bilingual support** — USDT members get English emails, others get Bengali emails

### Technical Steps

#### Step 1: Email Domain Setup
Your project doesn't have an email domain configured yet. We need to set up `notify.myproduct.tech` (or similar) as your sender domain first. This involves adding DNS records at your domain provider. You'll see a setup dialog to configure this.

#### Step 2: Email Infrastructure
Set up the email queue system (retry handling, suppression, logging) so emails are reliably delivered.

#### Step 3: Create Email Templates (2 templates)

**Welcome Email Template** (`welcome-member.tsx`):
- Beautiful branded design with Tech Subx BD branding
- Shows: Join Date, Email, Plan Name (based on team subscriptions), Duration (30 days/1 month), Expiry Date (join date + 30 days)
- Bengali version for non-USDT members, English for USDT members
- WhatsApp: 01322230857, Website: myproduct.tech
- Professional gradient header, card-based layout

**Due Reminder Email Template** (`due-reminder.tsx`):
- Red-accented urgent design
- Shows the due amount in BDT (or USD for USDT members)
- Bengali for non-USDT, English for USDT members
- Contact info and payment reminder

#### Step 4: Register Templates
Add both templates to the registry so `send-transactional-email` can use them.

#### Step 5: Wire Up Triggers in Existing Code

**Welcome email trigger** — in `useSupabaseData.ts` `addMember` function:
- After successful member addition, invoke `send-transactional-email` with `welcome-member` template
- Pass member email, join date, team name, `isUsdt` flag
- Idempotency key: `welcome-{memberId}`
- Uses the Lovable Cloud Supabase client for Edge Function invocation

**Due reminder trigger** — in `MemberCard.tsx` `handleSavePending` and `PlusMemberCard.tsx`:
- After saving a pending amount > 0, invoke `send-transactional-email` with `due-reminder` template
- Pass member email, due amount, `isUsdt` flag
- Idempotency key: `due-{memberId}-{timestamp}`

#### Step 6: Unsubscribe Page
Create `/unsubscribe` route for email opt-out compliance.

#### Step 7: Deploy Edge Functions
Deploy all email-related edge functions.

### Data Safety
- No database schema changes needed — all existing tables stay untouched
- Email sending is a side-effect after the existing data operations complete
- If email fails, member data is already saved (no rollback)
- Uses existing `is_usdt` field to determine language

### Plan Name Logic
Based on team's logo/subscription type:
- `gemini` or `canva` → "Pro Subscription"
- `youtube` → "Premium Subscription"  
- Others (chatgpt, etc.) → "Business Subscription"

