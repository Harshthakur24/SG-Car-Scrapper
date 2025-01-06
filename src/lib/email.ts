import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email: string, otp: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Vehicle Scrap <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your document submission',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Document Submission</h2>
          <p>Your verification code is: <strong style="font-size: 24px; color: #4F46E5;">${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
} 