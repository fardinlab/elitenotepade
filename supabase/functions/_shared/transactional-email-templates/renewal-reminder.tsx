/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Tech Subx BD~ Subscription"

interface RenewalReminderProps {
  teamName?: string
  subscriptionName?: string
  expiryDate?: string
  memberEmail?: string
}

const RenewalReminderEmail = ({ teamName, subscriptionName, expiryDate, memberEmail }: RenewalReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>⚠️ সাবস্ক্রিপশন রিনিউ করুন! Your {subscriptionName || 'subscription'} expires tomorrow!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>⚠️ সাবস্ক্রিপশন রিনিউ করুন!</Heading>
        </Section>

        <Text style={text}>
          আপনার <strong>{teamName || 'team'}</strong> টিমের সাবস্ক্রিপশন <strong>আগামীকাল শেষ হচ্ছে</strong>।
        </Text>

        {subscriptionName && (
          <Text style={text}>
            আপনার <strong>{subscriptionName}</strong> সাবস্ক্রিপশন রিনিউ করা প্রয়োজন।
          </Text>
        )}

        <Section style={warningBox}>
          <Text style={warningText}>
            📅 <strong>শেষ তারিখ / Expiry Date:</strong> {expiryDate || 'Tomorrow'}
          </Text>
          <Text style={warningText}>
            📧 <strong>Email:</strong> {memberEmail || 'N/A'}
          </Text>
        </Section>

        <Text style={text}>
          Your {subscriptionName || 'subscription'} in <strong>{teamName || 'the team'}</strong> expires tomorrow.
          Please renew your subscription to continue uninterrupted service.
        </Text>

        <Text style={textBold}>
          দয়া করে রিনিউ করুন। / Please renew your subscription.
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          ধন্যবাদ / Thank you,<br />
          {SITE_NAME}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: RenewalReminderEmail,
  subject: (data: Record<string, any>) =>
    `⚠️ Renewal Reminder - ${data.subscriptionName || data.teamName || 'Subscription'} expires tomorrow`,
  displayName: 'Renewal Reminder',
  previewData: {
    teamName: 'ChatGPT Elite Team',
    subscriptionName: 'ChatGPT',
    expiryDate: '2026-05-03',
    memberEmail: 'member@example.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '580px', margin: '0 auto' }
const headerSection = {
  backgroundColor: '#E65100',
  borderRadius: '12px 12px 0 0',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '0',
}
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const textBold = { fontSize: '15px', color: '#E65100', lineHeight: '1.6', margin: '0 0 16px', fontWeight: 'bold' as const }
const warningBox = {
  backgroundColor: '#FFF3E0',
  border: '2px solid #E65100',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}
const warningText = { fontSize: '14px', color: '#333333', lineHeight: '1.8', margin: '0' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0', lineHeight: '1.6' }
