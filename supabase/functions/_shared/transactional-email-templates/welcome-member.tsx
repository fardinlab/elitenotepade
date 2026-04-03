/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Link, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Tech Subx BD~ Subscription"

interface WelcomeMemberProps {
  teamName?: string
  subscriptionName?: string
  joinDate?: string
  expiryDate?: string
  memberEmail?: string
  memberName?: string
  duration?: string
}

const WelcomeMemberEmail = ({
  teamName,
  subscriptionName,
  joinDate,
  expiryDate,
  memberEmail,
  memberName,
  duration = '30 Days / 1 Month',
}: WelcomeMemberProps) => {
  const planLabel = subscriptionName
    ? `${subscriptionName} Business Subscription`
    : 'Subscription'
  const serviceName = subscriptionName || 'Service'

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>🎉 স্বাগতম! {planLabel} সফলভাবে সক্রিয় করা হয়েছে!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Text style={headerEmoji}>🎉</Text>
            <Heading style={h1}>স্বাগতম | Welcome!</Heading>
            <Text style={headerSubtext}>Your subscription is now active</Text>
          </Section>

          {/* Greeting */}
          <Section style={contentSection}>
            <Text style={greetingText}>
              প্রিয় {memberName || 'Valued Customer'},
            </Text>
            <Text style={text}>
              আপনাকে <strong>Tech Subx BD</strong>-তে স্বাগতম! আপনার সাবস্ক্রিপশন সফলভাবে সক্রিয় করা হয়েছে।
            </Text>

            {/* Subscription Details Card */}
            <Section style={detailsCard}>
              <Text style={detailsHeader}>📌 Subscription Details</Text>
              <Hr style={detailsDivider} />

              <Section style={detailRow}>
                <Text style={detailLabel}>📅 Join Date</Text>
                <Text style={detailValue}>{joinDate || 'N/A'}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>📧 Email</Text>
                <Text style={detailValue}>{memberEmail || 'N/A'}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>📦 Plan Name</Text>
                <Text style={detailValue}>{planLabel}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>⏳ মেয়াদ / Duration</Text>
                <Text style={detailValue}>{duration}</Text>
              </Section>

              <Section style={detailRow}>
                <Text style={detailLabel}>📆 Expiry Date</Text>
                <Text style={detailValue}>{expiryDate || 'N/A'}</Text>
              </Section>
            </Section>

            {/* Active Status */}
            <Section style={statusBanner}>
              <Text style={statusText}>
                ✅ আপনার <strong>{serviceName}</strong> এখন সক্রিয়।
              </Text>
              <Text style={statusSubtext}>
                ⏰ নির্ধারিত সময়ের আগে রিনিউ করতে ভুলবেন না, যাতে কোনো সার্ভিস বন্ধ না হয়।
              </Text>
            </Section>

            {/* Security Info */}
            <Section style={securityCard}>
              <Text style={securityHeader}>🔐 Important তথ্য</Text>
              <Hr style={securityDivider} />
              <Text style={securityItem}>
                • আপনার লগইন তথ্য অন্য কারো সাথে শেয়ার করবেন না
              </Text>
              <Text style={securityItem}>
                • কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন
              </Text>
            </Section>

            {/* Contact Info */}
            <Section style={contactSection}>
              <Text style={contactItem}>
                📞 WhatsApp: <Link href="https://wa.me/8801322230857" style={contactLink}>01322230857</Link>
              </Text>
              <Text style={contactItem}>
                🌐 Website: <Link href="https://myproduct.tech" style={contactLink}>myproduct.tech</Link>
              </Text>
            </Section>

            <Hr style={hr} />

            {/* Footer */}
            <Text style={footer}>
              ধন্যবাদান্তে,<br />
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
  component: WelcomeMemberEmail,
  subject: (data: Record<string, any>) => {
    const service = data.subscriptionName || 'Tech Subx BD'
    return `✅ ${service} Subscription Active - Welcome to Tech Subx BD`
  },
  displayName: 'Welcome Member',
  previewData: {
    teamName: 'ChatGPT Elite Team',
    subscriptionName: 'ChatGPT',
    joinDate: '2026-04-03',
    expiryDate: '2026-05-03',
    memberEmail: 'member@example.com',
    memberName: 'Customer',
    duration: '30 Days / 1 Month',
  },
} satisfies TemplateEntry

/* ─── Styles ─── */

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
  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
  padding: '40px 30px 32px',
  textAlign: 'center' as const,
}

const headerEmoji = {
  fontSize: '48px',
  margin: '0 0 8px',
  lineHeight: '1',
}

const h1 = {
  fontSize: '28px',
  fontWeight: '700' as const,
  color: '#ffffff',
  margin: '0 0 6px',
  letterSpacing: '-0.5px',
}

const headerSubtext = {
  fontSize: '14px',
  color: 'rgba(255,255,255,0.85)',
  margin: '0',
  fontWeight: '400' as const,
}

const contentSection = {
  padding: '32px 30px 24px',
}

const greetingText = {
  fontSize: '16px',
  color: '#1a1a1a',
  margin: '0 0 12px',
  fontWeight: '600' as const,
}

const text = {
  fontSize: '15px',
  color: '#4a4a4a',
  lineHeight: '1.7',
  margin: '0 0 24px',
}

const detailsCard = {
  backgroundColor: '#FFFBEB',
  border: '1px solid #FDE68A',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
}

const detailsHeader = {
  fontSize: '16px',
  fontWeight: '700' as const,
  color: '#92400E',
  margin: '0 0 4px',
  textAlign: 'center' as const,
}

const detailsDivider = {
  borderColor: '#FDE68A',
  margin: '12px 0 16px',
}

const detailRow = {
  margin: '0 0 10px',
  padding: '8px 12px',
  backgroundColor: 'rgba(255,255,255,0.7)',
  borderRadius: '8px',
}

const detailLabel = {
  fontSize: '13px',
  color: '#92400E',
  margin: '0 0 2px',
  fontWeight: '600' as const,
}

const detailValue = {
  fontSize: '15px',
  color: '#1a1a1a',
  margin: '0',
  fontWeight: '500' as const,
}

const statusBanner = {
  backgroundColor: '#ECFDF5',
  border: '1px solid #A7F3D0',
  borderRadius: '12px',
  padding: '18px 24px',
  margin: '0 0 24px',
}

const statusText = {
  fontSize: '15px',
  color: '#065F46',
  margin: '0 0 8px',
  lineHeight: '1.6',
}

const statusSubtext = {
  fontSize: '14px',
  color: '#047857',
  margin: '0',
  lineHeight: '1.6',
}

const securityCard = {
  backgroundColor: '#FEF2F2',
  border: '1px solid #FECACA',
  borderRadius: '12px',
  padding: '18px 24px',
  margin: '0 0 24px',
}

const securityHeader = {
  fontSize: '15px',
  fontWeight: '700' as const,
  color: '#991B1B',
  margin: '0 0 4px',
}

const securityDivider = {
  borderColor: '#FECACA',
  margin: '10px 0 14px',
}

const securityItem = {
  fontSize: '14px',
  color: '#7F1D1D',
  margin: '0 0 6px',
  lineHeight: '1.6',
}

const contactSection = {
  backgroundColor: '#EFF6FF',
  border: '1px solid #BFDBFE',
  borderRadius: '12px',
  padding: '16px 24px',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const contactItem = {
  fontSize: '14px',
  color: '#1E40AF',
  margin: '0 0 6px',
  lineHeight: '1.6',
}

const contactLink = {
  color: '#1D4ED8',
  textDecoration: 'underline' as const,
  fontWeight: '600' as const,
}

const hr = { borderColor: '#e5e5e5', margin: '24px 0 20px' }

const footer = {
  fontSize: '14px',
  color: '#4a4a4a',
  margin: '0 0 6px',
  textAlign: 'center' as const,
  lineHeight: '1.6',
}

const footerSub = {
  fontSize: '12px',
  color: '#9CA3AF',
  margin: '0',
  textAlign: 'center' as const,
}
