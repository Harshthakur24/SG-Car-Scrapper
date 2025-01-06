import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

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

    console.log('Verification sent:', verification.status);
    return verification;
  } catch (error) {
    console.error('Failed to send verification:', error);
    throw error;
  }
}

export async function verifyOTP(phoneNumber: string, code: string) {
  try {
    let formattedNumber = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      formattedNumber = `+91${phoneNumber.replace(/\D/g, '')}`;
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verificationChecks.create({
        to: formattedNumber,
        code
      });

    return verification.status === 'approved';
  } catch (error) {
    console.error('Failed to verify code:', error);
    throw error;
  }
} 