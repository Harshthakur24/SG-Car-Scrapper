import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

interface TwilioError extends Error {
    code: number;
}

export async function sendVerificationSMS(phoneNumber: string) {
  try {
    // Ensure phone number is in E.164 format
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedNumber = `+91${phoneNumber.replace(/\D/g, '')}`;
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verifications.create({
        to: formattedNumber,
        channel: 'sms'
      });

    return verification;
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as TwilioError).code === 20429) {
      throw new Error('SMS service is temporarily unavailable. Please try email verification.');
    }
    console.error('Failed to send SMS:', error);
    throw new Error('Failed to send SMS. Please try email verification.');
  }
}

export async function verifyOTP(phoneNumber: string, code: string): Promise<boolean> {
    if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
        console.error('Cannot verify OTP: Missing TWILIO_VERIFY_SERVICE_SID');
        return false;
    }

    try {
        // Ensure proper formatting for Indian numbers
        let formattedPhone = phoneNumber;
        if (!phoneNumber.startsWith('+')) {
            // Remove any non-digit characters
            const cleaned = phoneNumber.replace(/\D/g, '');
            // Add +91 prefix if not present
            formattedPhone = cleaned.startsWith('91') ? `+${cleaned}` : `+91${cleaned}`;
        }
        
        console.log('Attempting to verify OTP:', {
            originalPhone: phoneNumber,
            formattedPhone: formattedPhone,
            code
        });

        const verification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks.create({
                to: formattedPhone,
                code: code
            });

        console.log('Twilio verification response:', {
            status: verification.status,
            valid: verification.valid,
            to: verification.to
        });

        return verification.status === 'approved';
    } catch (error) {
        console.error('Twilio verification error:', error);
        return false;
    }
}

export async function sendOTP(phoneNumber: string) {
    if (!process.env.TWILIO_VERIFY_SERVICE_SID) {
        throw new Error('Cannot send OTP: Missing TWILIO_VERIFY_SERVICE_SID');
    }

    try {
        // Ensure proper formatting for Indian numbers
        let formattedPhone = phoneNumber;
        if (!phoneNumber.startsWith('+')) {
            // Remove any non-digit characters
            const cleaned = phoneNumber.replace(/\D/g, '');
            // Add +91 prefix if not present
            formattedPhone = cleaned.startsWith('91') ? `+${cleaned}` : `+91${cleaned}`;
        }

        console.log('Attempting to send OTP:', {
            originalPhone: phoneNumber,
            formattedPhone: formattedPhone
        });

        const verification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications.create({
                to: formattedPhone,
                channel: 'sms'
            });
        
        console.log('Twilio send OTP response:', {
            status: verification.status,
            to: verification.to
        });

        return verification.status === 'pending';
    } catch (error) {
        console.error('Twilio send error:', error);
        throw error;
    }
} 