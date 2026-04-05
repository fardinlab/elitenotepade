import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Tech Subx BD"

interface WelcomeMemberProps {
  email?: string
  joinDate?: string
  planName?: string
  isUsdt?: boolean
  teamName?: string
}

const WelcomeMemberEmail = ({ email, joinDate, planName, isUsdt, teamName }: WelcomeMemberProps) => {
  const lang = isUsdt ? 'en' : 'bn'
  const jd = joinDate || new Date().toISOString().split('T')[0]
  const plan = planName || 'Business Subscription'
  
  // Calculate expiry (30 days from join)
  const joinDateObj = new Date(jd)
  const expiryDate = new Date(joinDateObj)
  expiryDate.setDate(expiryDate.getDate() + 30)
  const expiryStr = expiryDate.toISOString().split('T')[0]

  const formatDate = (d: string) => {
    const date = new Date(d)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  if (lang === 'en') {
    return (
      <Html lang="en" dir="ltr">
        <Head />
        <Preview>Welcome to {SITE_NAME}! Your subscription is now active.</Preview>
        <Body style={main}>
          <Container style={container}>
            <Section style={headerSection}>
              <Heading style={brandName}>{SITE_NAME}</Heading>
              <Text style={headerSubtext}>Subscription Activated</Text>
            </Section>

            <Section style={contentSection}>
              <Heading style={h1}>Welcome! 🎉</Heading>
              <Text style={text}>
                Dear Customer, welcome to {SITE_NAME}! Your subscription has been successfully activated.
              </Text>

              <Section style={detailsBox}>
                <Text style={detailsTitle}>Subscription Details</Text>
                <Hr style={detailsDivider} />
                <Text style={detailRow}><span style={detailLabel}>Join Date:</span> {formatDate(jd)}</Text>
                <Text style={detailRow}><span style={detailLabel}>Email:</span> {email || '—'}</Text>
              {teamName && <Text style={detailRow}><span style={detailLabel}>Team:</span> {teamName}</Text>}
                <Text style={detailRow}><span style={detailLabel}>Plan:</span> {plan}</Text>
                <Text style={detailRow}><span style={detailLabel}>Duration:</span> 30 Days / 1 Month</Text>
                <Text style={detailRow}><span style={detailLabel}>Expiry Date:</span> {formatDate(expiryStr)}</Text>
              </Section>

              <Text style={text}>
                Your service is now active. Please remember to renew before the expiry date to avoid any service interruption.
              </Text>

              <Section style={warningBox}>
                <Text style={warningTitle}>⚠️ Important</Text>
                <Text style={warningText}>• Do not share your login credentials with anyone</Text>
                <Text style={warningText}>• Contact us if you face any issues</Text>
              </Section>

              <Hr style={divider} />
              <Text style={contactText}>WhatsApp: 01322230857</Text>
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
      <Preview>Tech Subx BD-তে স্বাগতম! আপনার সাবস্ক্রিপশন সক্রিয় হয়েছে।</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={brandName}>{SITE_NAME}</Heading>
            <Text style={headerSubtext}>সাবস্ক্রিপশন সক্রিয়</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>স্বাগতম | Welcome! 🎉</Heading>
            <Text style={text}>
              প্রিয় গ্রাহক, আপনাকে {SITE_NAME}-তে স্বাগতম! আপনার সাবস্ক্রিপশন সফলভাবে সক্রিয় করা হয়েছে।
            </Text>

            <Section style={detailsBox}>
              <Text style={detailsTitle}>Subscription Details</Text>
              <Hr style={detailsDivider} />
              <Text style={detailRow}><span style={detailLabel}>Join Date:</span> {formatDate(jd)}</Text>
              <Text style={detailRow}><span style={detailLabel}>Email:</span> {email || '—'}</Text>
              {teamName && <Text style={detailRow}><span style={detailLabel}>Team Name:</span> {teamName}</Text>}
                <Text style={detailRow}><span style={detailLabel}>Plan Name:</span> {plan}</Text>
                <Text style={detailRow}><span style={detailLabel}>মেয়াদ / Duration:</span> 30 Days / 1 Month</Text>
              <Text style={detailRow}><span style={detailLabel}>Expiry Date:</span> {formatDate(expiryStr)}</Text>
            </Section>

            <Text style={text}>
              আপনার সার্ভিস এখন সক্রিয়। নির্ধারিত সময়ের আগে রিনিউ করতে ভুলবেন না, যাতে কোনো সার্ভিস বন্ধ না হয়।
            </Text>

            <Section style={warningBox}>
              <Text style={warningTitle}>⚠️ Important তথ্য</Text>
              <Text style={warningText}>• আপনার লগইন তথ্য অন্য কারো সাথে শেয়ার করবেন না</Text>
              <Text style={warningText}>• কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন</Text>
            </Section>

            <Hr style={divider} />
            <Text style={contactText}>WhatsApp: 01322230857</Text>
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
  component: WelcomeMemberEmail,
  subject: (data: Record<string, any>) =>
    data.isUsdt
      ? `Welcome to Tech Subx BD — ${data.planName || 'Subscription'} Activated!`
      : `স্বাগতম | ${data.planName || 'Subscription'} সক্রিয় — Tech Subx BD`,
  displayName: 'Welcome Member',
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
  background: 'linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 50%, #ec4899 100%)',
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
const warningBox = {
  backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '10px',
  padding: '16px', margin: '20px 0',
}
const warningTitle = { fontSize: '14px', fontWeight: '700', color: '#92400e', margin: '0 0 8px' }
const warningText = { fontSize: '13px', color: '#92400e', margin: '4px 0', lineHeight: '1.4' }
const divider = { borderColor: '#e5e7eb', margin: '24px 0' }
const contactText = { fontSize: '13px', color: '#6b7280', margin: '4px 0', textAlign: 'center' as const }
const linkStyle = { color: '#2563eb', textDecoration: 'underline' }
const footer = { fontSize: '14px', color: '#6b7280', textAlign: 'center' as const, margin: '16px 0 0' }
