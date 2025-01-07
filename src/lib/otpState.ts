class OTPManager {
    private static otp: string | null = null;
    private static timeout: NodeJS.Timeout | null = null;

    static setOTP(otp: string | null) {
        console.log('Setting OTP:', otp);
        this.otp = otp;
        
        // Clear existing timeout
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }

        // Set new timeout if OTP exists
        if (otp) {
            this.timeout = setTimeout(() => {
                console.log('OTP expired by timeout');
                this.otp = null;
            }, 5 * 60 * 1000); // 5 minutes
        }
    }

    static getOTP() {
        console.log('Current OTP:', this.otp);
        return this.otp;
    }

    static clearOTP() {
        console.log('Clearing OTP');
        this.otp = null;
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = null;
        }
    }
}

export default OTPManager; 