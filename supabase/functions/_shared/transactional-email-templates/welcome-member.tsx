/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Tech Subx BD~ Subscription"

interface WelcomeMemberProps {
  teamName?: string
  subscriptionName?: string
  joinDate?: string
  memberEmail?: string
}

const WelcomeMemberEmail = ({ teamName, subscriptionName, joinDate, memberEmail }: WelcomeMemberProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>🎉 স্বাগতম! Welcome to {subscriptionName || teamName || 'our team'}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Heading style={h1}>🎉 স্বাগতম! Welcome!</Heading>
        </Section>

        <Text style={text}>
          আপনাকে <strong>{teamName || 'our team'}</strong> টিমে যুক্ত করা হয়েছে।
        </Text>

        {subscriptionName && (
          <Text style={text}>
            আপনার <strong>{subscriptionName}</strong> সাবস্ক্রিপশন সক্রিয় করা হয়েছে।
          </Text>
        )}

        <Section style={infoBox}>
          <Text style={infoText}>
            📅 <strong>জয়েন তারিখ / Join Date:</strong> {joinDate || 'N/A'}
          </Text>
          <Text style={infoText}>
            📧 <strong>Email:</strong> {memberEmail || 'N/A'}
          </Text>
          <Text style={infoText}>
            ⏳ <strong>সাবস্ক্রিপশন মেয়াদ:</strong> ৩০ দিন (30 days)
          </Text>
        </Section>

        <Text style={text}>
          Your {subscriptionName || 'subscription'} is now active for 30 days.
          Please ensure timely renewal to avoid service interruption.
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
  component: WelcomeMemberEmail,
  subject: (data: Record<string, any>) =>
    `Welcome to ${data.subscriptionName || data.teamName || 'Tech Subx BD'} - ${SITE_NAME}`,
  displayName: 'Welcome Member',
  previewData: {
    teamName: 'ChatGPT Elite Team',
    subscriptionName: 'ChatGPT',
    joinDate: '2026-04-03',
    memberEmail: 'member@example.com',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px', maxWidth: '580px', margin: '0 auto' }
const headerSection = {
  backgroundColor: 'hsl(37, 92%, 50%)',
  borderRadius: '12px 12px 0 0',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '0',
}
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#ffffff', margin: '0' }
const text = { fontSize: '15px', color: '#333333', lineHeight: '1.6', margin: '0 0 16px' }
const infoBox = {
  backgroundColor: '#FFF8E1',
  border: '1px solid hsl(37, 92%, 50%)',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}
const infoText = { fontSize: '14px', color: '#333333', lineHeight: '1.8', margin: '0' }
const hr = { borderColor: '#e5e5e5', margin: '24px 0' }
const footer = { fontSize: '13px', color: '#999999', margin: '0', lineHeight: '1.6' }
