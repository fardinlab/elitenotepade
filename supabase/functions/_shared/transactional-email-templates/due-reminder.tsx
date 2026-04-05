import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Tech Subx BD"

interface DueReminderProps {
  email?: string
  dueAmount?: number
  isUsdt?: boolean
  planName?: string
}

const DueReminderEmail = ({ email, dueAmount, isUsdt, planName }: DueReminderProps) => {
  const amount = dueAmount || 0
  const plan = planName || 'Subscription'
  const displayAmount = isUsdt ? `$${(amount / 125).toFixed(2)}` : `৳${amount}`

  if (isUsdt) {
    // English version for USDT members
    return (
      <Html lang="en" dir="ltr">
        <Head />
        <Preview>Payment Reminder — {displayAmount} due on {SITE_NAME}</Preview>
        <Body style={main}>
          <Container style={container}>
            <Section style={headerSection}>
              <Heading style={brandName}>{SITE_NAME}</Heading>
              <Text style={headerSubtext}>Payment Reminder</Text>
            </Section>

            <Section style={contentSection}>
              <Heading style={h1}>⚠️ Payment Due</Heading>
              <Text style={text}>
                Dear Customer, this is a reminder that you have an outstanding balance on your account.
              </Text>

              <Section style={amountBox}>
                <Text style={amountLabel}>Amount Due</Text>
                <Text style={amountValue}>{displayAmount}</Text>
                {planName && <Text style={amountPlan}>{plan}</Text>}
              </Section>

              <Text style={text}>
                Please settle your dues at your earliest convenience to continue uninterrupted service.
              </Text>

              <Section style={urgentBox}>
                <Text style={urgentText}>
                  ⏰ Failure to pay may result in service suspension. Contact us immediately if you have questions.
                </Text>
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
      <Preview>পেমেন্ট রিমাইন্ডার — {displayAmount} বকেয়া আছে</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={brandName}>{SITE_NAME}</Heading>
            <Text style={headerSubtext}>পেমেন্ট রিমাইন্ডার</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={h1}>⚠️ পেমেন্ট বকেয়া</Heading>
            <Text style={text}>
              প্রিয় গ্রাহক, আপনার অ্যাকাউন্টে বকেয়া আছে। অনুগ্রহ করে যত দ্রুত সম্ভব পরিশোধ করুন।
            </Text>

            <Section style={amountBox}>
              <Text style={amountLabel}>বকেয়া পরিমাণ</Text>
              <Text style={amountValue}>{displayAmount}</Text>
              {planName && <Text style={amountPlan}>{plan}</Text>}
            </Section>

            <Text style={text}>
              আপনার সার্ভিস চালু রাখতে তাড়াতাড়ি পেমেন্ট করুন। কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন।
            </Text>

            <Section style={urgentBox}>
              <Text style={urgentText}>
                ⏰ পেমেন্ট না করলে আপনার সার্ভিস বন্ধ হতে পারে। এখনই যোগাযোগ করুন।
              </Text>
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
  component: DueReminderEmail,
  subject: (data: Record<string, any>) => {
    const amount = data.dueAmount || 0
    const display = data.isUsdt ? `$${(amount / 125).toFixed(2)}` : `৳${amount}`
    return data.isUsdt
      ? `Payment Reminder — ${display} Due — Tech Subx BD`
      : `পেমেন্ট রিমাইন্ডার — ${display} বকেয়া — Tech Subx BD`
  },
  displayName: 'Due Reminder',
  previewData: {
    email: 'customer@example.com',
    dueAmount: 750,
    isUsdt: false,
    planName: 'Business Subscription',
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Segoe UI', Arial, sans-serif" }
const container = { maxWidth: '580px', margin: '0 auto' }
const headerSection = {
  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
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
const h1 = { fontSize: '24px', fontWeight: '700', color: '#dc2626', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6', margin: '0 0 20px' }
const amountBox = {
  background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
  border: '2px solid #fca5a5', borderRadius: '12px',
  padding: '24px', margin: '20px 0', textAlign: 'center' as const,
}
const amountLabel = { fontSize: '13px', fontWeight: '600', color: '#991b1b', margin: '0 0 8px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const amountValue = { fontSize: '36px', fontWeight: '800', color: '#dc2626', margin: '0 0 4px' }
const amountPlan = { fontSize: '13px', color: '#6b7280', margin: '0' }
const urgentBox = {
  backgroundColor: '#fff7ed', border: '1px solid #fb923c', borderRadius: '10px',
  padding: '16px', margin: '20px 0',
}
const urgentText = { fontSize: '14px', color: '#9a3412', margin: '0', lineHeight: '1.5' }
const divider = { borderColor: '#e5e7eb', margin: '24px 0' }
const contactText = { fontSize: '13px', color: '#6b7280', margin: '4px 0', textAlign: 'center' as const }
const linkStyle = { color: '#2563eb', textDecoration: 'underline' }
const footer = { fontSize: '14px', color: '#6b7280', textAlign: 'center' as const, margin: '16px 0 0' }
