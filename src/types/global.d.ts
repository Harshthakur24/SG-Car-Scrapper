declare global {
  // eslint-disable-next-line no-var
  var otpStore: Map<string, {
    otp: string;
    email: string;
    phoneNumber: string;
    expires: Date;
    attempts: number;
    verified: boolean;
  }>;
}

export {}; 