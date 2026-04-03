

## Automated Email System Plan

### What You Want
1. **Welcome Email** — মেম্বার add করার ১ মিনিট পরে একটি email যাবে (Normal + Plus teams)
2. **Renewal Reminder Email** — Join Date থেকে ২৯ দিন পরে (মাস শেষ হওয়ার ১ দিন আগে) reminder email যাবে

### How It Will Work

```text
Member Added → 1 min delay → Welcome Email
                              "আপনাকে [Team Name] এ যুক্ত করা হয়েছে"

Join Date + 29 days → Renewal Reminder Email
                      "আপনার সাবস্ক্রিপশন আগামীকাল শেষ হচ্ছে"
```

### Prerequisites (Setup Steps)

This project currently has no email infrastructure. We need to set up:

1. **Enable Lovable Cloud** — backend infrastructure for Edge Functions
2. **Set up email domain** — so emails come from your own domain (e.g. `notify@yourdomain.com`)
3. **Set up email infrastructure** — queue system for reliable delivery
4. **Create email templates** — Welcome + Renewal Reminder (Bengali + English mixed)

### Implementation Steps

**Step 1: Email Templates (2 templates)**

- **welcome-email** — Bengali/English mixed welcome message with team name, join date
- **renewal-reminder** — Bengali/English renewal reminder with team name, expiry date, member info

**Step 2: Edge Function Integration**

- In `addMember()` function (`useSupabaseData.ts`), after successfully adding a member, call `send-transactional-email` with a 1-minute delay using `setTimeout`
- For the 29-day reminder: use a **Supabase pg_cron job** that runs daily, checks all Normal + Plus team members whose join date is exactly 29 days ago, and triggers the renewal reminder email

**Step 3: Daily Cron for Renewal Reminders**

A database function will run daily at midnight that:
- Queries all members from Normal + Plus teams
- Finds members where `join_date + 29 days = today`
- Sends renewal reminder email to each qualifying member
- Tracks sent emails to avoid duplicates

### Email Content (Preview)

**Welcome Email:**
> 🎉 স্বাগতম! Welcome!
> আপনাকে **[Team Name]** টিমে যুক্ত করা হয়েছে।
> 📅 জয়েন তারিখ: [Join Date]
> আপনার সাবস্ক্রিপশন ৩০ দিনের জন্য সক্রিয়।

**Renewal Reminder:**
> ⚠️ সাবস্ক্রিপশন রিনিউ করুন!
> আপনার **[Team Name]** টিমের সাবস্ক্রিপশন আগামীকাল শেষ হচ্ছে।
> 📅 শেষ তারিখ: [Expiry Date]
> দয়া করে রিনিউ করুন।

### Important Notes

- Pushed মেম্বারদের email যাবে না
- শুধু Normal ও Plus teams এর জন্য কাজ করবে
- Duplicate email এড়ানোর জন্য tracking system থাকবে
- Email domain setup এর জন্য আপনার একটি custom domain লাগবে (e.g. yourdomain.com)

### Technical Details

- **Email sending**: Lovable's built-in email infrastructure (no external service needed)
- **Welcome trigger**: Client-side `supabase.functions.invoke()` call after `addMember()` succeeds
- **Renewal trigger**: pg_cron daily job → Edge Function invocation
- **Templates**: React Email components with inline styles
- **Queue**: pgmq-based reliable delivery with automatic retries

