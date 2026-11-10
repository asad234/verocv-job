import { type NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 },
      )
    }

    console.log('🔐 Password reset attempt with token')

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const payload = await getPayload({ config })

    // Find user with matching token and valid expiration
    const { docs: users } = await payload.find({
      collection: 'users',
      where: {
        and: [
          {
            resetPasswordToken: {
              equals: hashedToken,
            },
          },
          {
            resetPasswordExpiration: {
              greater_than: new Date().toISOString(),
            },
          },
        ],
      },
      limit: 1,
    })

    if (users.length === 0) {
      console.log('❌ Invalid or expired token')
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    const user = users[0]

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    console.log('✅ Valid token found for user:', user.email)

    // Update password and clear reset token fields
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        password, // Payload will automatically hash this
        resetPasswordToken: null,
        resetPasswordExpiration: null,
      },
    })

    console.log('✅ Password updated successfully for user:', user.email)

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now sign in with your new password.',
    })
  } catch (error) {
    console.error('❌ Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
