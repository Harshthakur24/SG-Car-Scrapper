import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email: string, otp: string) {
  try {
    console.log('Sending email to:', email, 'with OTP:', otp);

    const { data, error } = await resend.emails.send({
      from: 'Vehicle Scrap <no-reply@sg-junkyard.ecoelv.in>',
      to: email,
      subject: 'Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a365d;">Verify Your Email</h2>
          <p style="font-size: 16px; color: #4a5568;">Your verification code is:</p>
          <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 32px; font-weight: bold; color: #2d3748; text-align: center; margin: 0;">
              ${otp}
            </p>
          </div>
          <p style="color: #718096; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #718096; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
} 