class OTPManager {
    private static otp: string | null = null;
    private static timeout: NodeJS.Timeout | null = null;
    private static expiryTime: number = 10 * 60 * 1000; // 10 minutes in milliseconds

    static setOTP(otp: string | null) {
        console.log('Setting OTP:', otp);
        this.clearOTP(); // Clear any existing OTP and timeout
        
        this.otp = otp;
        
        // Set new timeout if OTP exists
        if (otp) {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            
            this.timeout = setTimeout(() => {
                console.log('OTP expired by timeout');
                this.otp = null;
                this.timeout = null;
            }, this.expiryTime);
        }
    }

    static getOTP() {
        if (!this.otp) {
            console.log('OTP not found or expired');
            return null;
        }
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