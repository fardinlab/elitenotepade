import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Link, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Tech Subx BD"

interface RenewReminderProps {
  email?: string
  joinDate?: string
  planName?: string
  isUsdt?: boolean
  teamName?: string
}

const RenewReminderEmail = ({ email, joinDate, planName, isUsdt, teamName }: RenewReminderProps) => {
  const lang = isUsdt ? 'en' : 'bn'
  const jd = joinDate || new Date().toISOString().split('T')[0]
  const plan = planName || 'Business Subscription'

  const joinDateObj = new Date(jd)
  const expiryDate = new Date(joinDateObj)
  expiryDate.setDate(expiryDate.getDate() + 30)
  const expiryStr = expiryDate.toISOString().split('T')[0]

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const whatsappUrl = 'https://wa.me/8801322230857?text=' + encodeURIComponent(
    isUsdt
      ? `Hello, I want to renew my subscription. Email: ${email || ''}`
      : `হ্যালো, আমি আমার সাবস্ক্রিপশন রিনিউ করতে চাই। Email: ${email || ''}`
  )

  if (lang === 'en') {
    return (
      <Html lang="en" dir="ltr">
        <Head />
        <Preview>Your {plan} subscription is expiring soon — renew now!</Preview>
        <Body style={main}>
          <Container style={container}>
            <Section style={headerSection}>
              <Heading style={brandName}>{SITE_NAME}</Heading>
              <Text style={headerSubtext}>Subscription Renewal Reminder</Text>
            </Section>

            <Section style={contentSection}>
              <Heading style={h1}>⏰ Time to Renew!</Heading>
              <Text style={text}>
                Dear Customer, your subscription is about to expire. Please renew to continue enjoying uninterrupted service.
              </Text>

              <Section style={detailsBox}>
                <Text style={detailsTitle}>Subscription Details</Text>
                <Hr style={detailsDivider} />
                <Text style={detailRow}><span style={detailLabel}>Email:</span> {email || '—'}</Text>
                {teamName && <Text style={detailRow}><span style={detailLabel}>Team:</span> {teamName}</Text>}
                <Text style={detailRow}><span style={detailLabel}>Plan:</span> {plan}</Text>
                <Text style={detailRow}><span style={detailLabel}>Join Date:</span> {formatDate(jd)}</Text>
                <Text style={detailRow}><span style={detailLabel}>Expiry Date:</span> <span style={expiryHighlight}>{formatDate(expiryStr)}</span></Text>
              </Section>

              <Section style={urgentBox}>
                <Text style={urgentTitle}>🔔 Renew Now to Avoid Interruption</Text>
                <Text style={urgentText}>
                  Your subscription expires on {formatDate(expiryStr)}. Contact us on WhatsApp to renew immediately.
                </Text>
              </Section>

              <Section style={ctaSection}>
                <Button style={ctaButton} href={whatsappUrl}>
                  💬 Contact on WhatsApp
                </Button>
              </Section>

              <Text style={smallText}>
                Or message us directly at: <strong>01322230857</strong>
              </Text>

              <Hr style={divider} />
              <Text style={contactText}>
                Website: <Link href="https://myproduct.tech" style={linkStyle}>myproduct.tech</Link>
              </Text>
              <Hr style={divider} />
              <Text style={footer}>Best regards,<br />{SITE_NAME} Team</Text>
            </Section>
          </Container>
        </Body>
      </Html>
    )
  }

  // Bengali version
  return (
    <Html lang="bn" dir="ltr">
      <Head />
      <Preview>আপনার {plan} সাবস্ক্রিপশনের মেয়াদ শেষ হচ্ছে — এখনই রিনিউ করুন!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={brandName}>{SITE_NAME}</Heading>
            <Text style={headerSubtext}>সাবস্ক্রিপশন রিনিউ রিমাইন্ডার</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>⏰ রিনিউ করার সময় হয়েছে!</Heading>
            <Text style={text}>
              প্রিয় গ্রাহক, আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হতে চলেছে। নিরবচ্ছিন্ন সার্ভিস পেতে অনুগ্রহ করে রিনিউ করুন।
            </Text>

            <Section style={detailsBox}>
              <Text style={detailsTitle}>Subscription Details</Text>
              <Hr style={detailsDivider} />
              <Text style={detailRow}><span style={detailLabel}>Email:</span> {email || '—'}</Text>
              {teamName && <Text style={detailRow}><span style={detailLabel}>Team Name:</span> {teamName}</Text>}
              <Text style={detailRow}><span style={detailLabel}>Plan Name:</span> {plan}</Text>
              <Text style={detailRow}><span style={detailLabel}>Join Date:</span> {formatDate(jd)}</Text>
              <Text style={detailRow}><span style={detailLabel}>Expiry Date:</span> <span style={expiryHighlight}>{formatDate(expiryStr)}</span></Text>
            </Section>

            <Section style={urgentBox}>
              <Text style={urgentTitle}>🔔 সার্ভিস বন্ধ হওয়ার আগেই রিনিউ করুন</Text>
              <Text style={urgentText}>
                আপনার সাবস্ক্রিপশনের মেয়াদ {formatDate(expiryStr)} তারিখে শেষ হচ্ছে। রিনিউ করতে এখনই WhatsApp-এ যোগাযোগ করুন।
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button style={ctaButton} href={whatsappUrl}>
                💬 WhatsApp-এ যোগাযোগ করুন
              </Button>
            </Section>

            <Text style={smallText}>
              অথবা সরাসরি মেসেজ করুন: <strong>01322230857</strong>
            </Text>

            <Hr style={divider} />
            <Text style={contactText}>
              Website: <Link href="https://myproduct.tech" style={linkStyle}>myproduct.tech</Link>
            </Text>
            <Hr style={divider} />
            <Text style={footer}>ধন্যবাদান্তে,<br />{SITE_NAME} Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: RenewReminderEmail,
  subject: (data: Record<string, any>) =>
    data.isUsdt
      ? `⏰ Renew Your ${data.planName || 'Subscription'} — Tech Subx BD`
      : `⏰ রিনিউ করুন | ${data.planName || 'Subscription'} মেয়াদ শেষ — Tech Subx BD`,
  displayName: 'Renewal Reminder',
  previewData: {
    email: 'customer@example.com',
    joinDate: '2025-01-15',
    planName: 'Business Subscription',
    isUsdt: false,
    teamName: 'ChatGPT Team',
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '580px', margin: '0 auto' }
const headerSection = {
  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
  padding: '32px 24px',
  borderRadius: '12px 12px 0 0',
  textAlign: 'center' as const,
}
const brandName = {
  fontSize: '28px', fontWeight: '800', color: '#ffffff', margin: '0 0 4px',
  letterSpacing: '-0.5px',
}
const headerSubtext = { fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: '0' }
const contentSection = { padding: '32px 24px', backgroundColor: '#ffffff' }
const h1 = { fontSize: '24px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = {
  backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
  padding: '20px', margin: '20px 0',
}
const detailsTitle = {
  fontSize: '16px', fontWeight: '700', color: '#1e293b', margin: '0 0 8px',
  textAlign: 'center' as const,
}
const detailsDivider = { borderColor: '#e2e8f0', margin: '12px 0' }
const detailRow = { fontSize: '14px', color: '#475569', margin: '8px 0', lineHeight: '1.5' }
const detailLabel = { fontWeight: '600', color: '#1e293b' }
const expiryHighlight = { color: '#ef4444', fontWeight: '700' }
const urgentBox = {
  backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px',
  padding: '16px', margin: '20px 0',
}
const urgentTitle = { fontSize: '15px', fontWeight: '700', color: '#dc2626', margin: '0 0 8px' }
const urgentText = { fontSize: '14px', color: '#991b1b', margin: '0', lineHeight: '1.5' }
const ctaSection = { textAlign: 'center' as const, margin: '24px 0' }
const ctaButton = {
  backgroundColor: '#25D366', color: '#ffffff', padding: '14px 32px',
  borderRadius: '10px', fontSize: '16px', fontWeight: '700',
  textDecoration: 'none', display: 'inline-block',
}
const smallText = { fontSize: '13px', color: '#6b7280', textAlign: 'center' as const, margin: '8px 0 0' }
const divider = { borderColor: '#e5e7eb', margin: '24px 0' }
const contactText = { fontSize: '13px', color: '#6b7280', margin: '4px 0', textAlign: 'center' as const }
const linkStyle = { color: '#2563eb', textDecoration: 'underline' }
const footer = { fontSize: '14px', color: '#6b7280', textAlign: 'center' as const, margin: '16px 0 0' }
