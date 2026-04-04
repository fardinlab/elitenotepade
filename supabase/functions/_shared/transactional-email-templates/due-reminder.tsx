/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Link,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Tech Subx BD~ Subscription"

interface DueReminderProps {
  teamName?: string
  subscriptionName?: string
  memberEmail?: string
  pendingAmount?: string
  joinDate?: string
  isUsdt?: string
}

const DueReminderEmail = ({
  teamName,
  subscriptionName,
  memberEmail,
  pendingAmount,
  joinDate,
  isUsdt,
}: DueReminderProps) => {
  const isUsdtCustomer = isUsdt === 'true'
  const currencySymbol = isUsdtCustomer ? '$' : '৳'
  const currencyLabel = isUsdtCustomer ? 'USD' : 'BDT'
  const planLabel = subscriptionName
    ? `${subscriptionName} Subscription`
    : 'Subscription'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`Payment Reminder - ${planLabel} has a pending balance of ${currencySymbol}${pendingAmount || '0'}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={headerEmoji}>&#128181;</Text>
            <Heading style={h1}>Payment Reminder</Heading>
            <Text style={headerSubtext}>You have a pending balance</Text>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Text style={greetingText}>
              Dear Valued Customer,
            </Text>
            <Text style={text}>
              This is a friendly reminder that you have an outstanding balance for your <strong>{planLabel}</strong> in <strong>{teamName || 'your team'}</strong>.
            </Text>

            {/* Due Details Card */}
            <Section style={detailsCard}>
              <Text style={detailsHeader}>Payment Details</Text>
              <Hr style={detailsDivider} />

              <Section style={detailRow}>
                <Text style={detailLabel}>Plan</Text>
                <Text style={detailValue}>{planLabel}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Team</Text>
                <Text style={detailValue}>{teamName || 'N/A'}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Email</Text>
                <Text style={detailValue}>{memberEmail || 'N/A'}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>Join Date</Text>
                <Text style={detailValue}>{joinDate || 'N/A'}</Text>
              </Section>

              <Section style={amountRow}>
                <Text style={amountLabel}>Pending Amount</Text>
                <Text style={amountValue}>{pendingAmount || '0'} BDT</Text>
              </Section>
            </Section>

            {/* Warning Banner */}
            <Section style={warningBanner}>
              <Text style={warningText}>
                Please clear your pending balance at your earliest convenience to continue uninterrupted service.
              </Text>
            </Section>

            {/* Contact Info */}
            <Section style={contactSection}>
              <Text style={contactItem}>
                WhatsApp: <Link href="https://wa.me/8801322230857" style={contactLink}>01322230857</Link>
              </Text>
              <Text style={contactItem}>
                Website: <Link href="https://myproduct.tech" style={contactLink}>myproduct.tech</Link>
              </Text>
            </Section>

            <Hr style={hr} />

            {/* Footer */}
            <Text style={footer}>
              Thank you,<br />
              <strong>Tech Subx BD Team</strong>
            </Text>
            <Text style={footerSub}>
              {SITE_NAME}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DueReminderEmail,
  subject: (data: Record<string, any>) => {
    const service = data.subscriptionName || 'Tech Subx BD'
    return `Payment Reminder - ${service} | Pending: ${data.pendingAmount || '0'} BDT`
  },
  displayName: 'Due Payment Reminder',
  previewData: {
    teamName: 'ChatGPT Elite Team',
    subscriptionName: 'ChatGPT',
    memberEmail: 'member@example.com',
    pendingAmount: '500',
    joinDate: '2026-04-01',
  },
} satisfies TemplateEntry

/* Styles */
const main = { backgroundColor: '#f4f4f7', fontFamily: "'Segoe UI', 'Inter', Arial, sans-serif" }

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  overflow: 'hidden' as const,
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
}

const headerSection = {
  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
  padding: '40px 30px 32px',
  textAlign: 'center' as const,
}

const headerEmoji = { fontSize: '48px', margin: '0 0 8px', lineHeight: '1' }
const h1 = { fontSize: '28px', fontWeight: '700' as const, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.5px' }
const headerSubtext = { fontSize: '14px', color: 'rgba(255,255,255,0.85)', margin: '0', fontWeight: '400' as const }

const contentSection = { padding: '32px 30px 24px' }
const greetingText = { fontSize: '16px', color: '#1a1a1a', margin: '0 0 12px', fontWeight: '600' as const }
const text = { fontSize: '15px', color: '#4a4a4a', lineHeight: '1.7', margin: '0 0 24px' }

const detailsCard = {
  backgroundColor: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
}

const detailsHeader = { fontSize: '16px', fontWeight: '700' as const, color: '#991B1B', margin: '0 0 4px', textAlign: 'center' as const }
const detailsDivider = { borderColor: '#FECACA', margin: '12px 0 16px' }

const detailRow = {
  margin: '0 0 10px',
  padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.7)',
  borderRadius: '8px',
}

const detailLabel = { fontSize: '13px', color: '#991B1B', margin: '0 0 2px', fontWeight: '600' as const }
const detailValue = { fontSize: '15px', color: '#1a1a1a', margin: '0', fontWeight: '500' as const }

const amountRow = {
  margin: '0',
  padding: '12px 16px',
  backgroundColor: '#DC2626',
  borderRadius: '8px',
}

const amountLabel = { fontSize: '13px', color: 'rgba(255,255,255,0.8)', margin: '0 0 2px', fontWeight: '600' as const }
const amountValue = { fontSize: '22px', color: '#ffffff', margin: '0', fontWeight: '700' as const }

const warningBanner = {
  backgroundColor: '#FFF7ED',
  border: '1px solid #FED7AA',
  borderRadius: '12px',
  padding: '18px 24px',
  margin: '0 0 24px',
}

const warningText = { fontSize: '15px', color: '#9A3412', margin: '0', lineHeight: '1.6' }

const contactSection = {
  backgroundColor: '#EFF6FF',
  border: '1px solid #BFDBFE',
  borderRadius: '12px',
  padding: '16px 24px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const contactItem = { fontSize: '14px', color: '#1E40AF', margin: '0 0 6px', lineHeight: '1.6' }
const contactLink = { color: '#1D4ED8', textDecoration: 'underline' as const, fontWeight: '600' as const }

const hr = { borderColor: '#e5e5e5', margin: '24px 0 20px' }
const footer = { fontSize: '14px', color: '#4a4a4a', margin: '0 0 6px', textAlign: 'center' as const, lineHeight: '1.6' }
const footerSub = { fontSize: '12px', color: '#9CA3AF', margin: '0', textAlign: 'center' as const }
