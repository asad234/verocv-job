// components/Dashboard/emails/magic-link.tsx
import React from 'react'

interface MagicLinkEmailProps {
  firstName: string
  magicLink: string
}

export const MagicLinkEmail: React.FC<MagicLinkEmailProps> = ({
  firstName,
  magicLink,
}) => {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#2563eb', marginBottom: '16px' }}>You&apos;re invited!</h2>

      <p style={{ marginBottom: '16px', color: '#374151' }}>
        Hi {firstName},
      </p>

      <p style={{ marginBottom: '16px', color: '#374151' }}>
        You&apos;ve been invited to join our platform. Click the button below to accept your invitation and get started.
      </p>

      <div style={{ textAlign: 'center', margin: '32px 0' }}>
        <a
          href={magicLink}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold'
          }}
        >
          Accept Invitation
        </a>
      </div>

      <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>
        This invitation link will expire in 7 days for security purposes.
      </p>

      <p style={{ marginBottom: '16px', color: '#6b7280', fontSize: '14px' }}>
        If you didn&apos;t request this invitation, you can safely ignore this email.
      </p>

      <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

      <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center' }}>
        If the button doesn&apos;t work, copy and paste this link into your browser:
        <br />
        <a href={magicLink} style={{ color: '#2563eb' }}>{magicLink}</a>
      </p>
    </div>
  )
}
