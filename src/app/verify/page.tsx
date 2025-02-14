/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

function VerifyContent() {
  const [otp, setOtp] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [token, setToken] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<"email" | "phone">("email");
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get("email");
  const tempId = searchParams?.get("tempId");

  useEffect(() => {
    if (!searchParams || !email || !tempId) {
      router.push("/");
      return;
    }
    // Retrieve pending basic data from local storage.
    const pending = localStorage.getItem("pendingBasicData");
    if (pending) {
      try {
        const basicData = JSON.parse(pending);
        if (basicData.aadharNumber) {
          setAadharNumber(basicData.aadharNumber);
        }
      } catch (error) {
        console.error("Error parsing pending basic data:", error);
      }
    }
  }, [searchParams, email, tempId, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    const loadingToast = toast.loading("Verifying...");
    try {
      if (step === "email") {
        // Verify Email OTP including aadharNumber in the payload
        const response = await fetch("/api/verify-email-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp: otp.trim(),
            tempId,
            aadharNumber,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Email verification failed");
        }

        toast.dismiss(loadingToast);
        toast.success("Email verified! Phone OTP has been sent.");
        // Switch to the phone verification step and clear the OTP input
        setStep("phone");
        setOtp("");
      } else if (step === "phone") {
        // Retrieve basic form data from local storage (including files)
        const basicData = localStorage.getItem("pendingBasicData");
        if (!basicData) throw new Error("No pending submission found");

        // Reconstruct the full form data
        const formData = JSON.parse(basicData);
        formData.files = {};

        // Collect stored files from local storage
        const fileKeys = [
          "adharCard",
          "panCard",
          "registrationCertificate",
          "cancelledCheck",
          "challanSeizureMemo",
          "deathCertificate",
          "hypothecationClearanceDoc",
        ];

        const reconstructFile = (key: string): string | null => {
          const chunks = parseInt(
            localStorage.getItem(`file_${key}_chunks`) || "0"
          );
          if (!chunks) return null;

          let result = "";
          for (let i = 0; i < chunks; i++) {
            const chunk = localStorage.getItem(`file_${key}_${i}`);
            if (!chunk) return null;
            result += chunk;
          }
          return result;
        };

        for (const key of fileKeys) {
          const fileData = reconstructFile(key);
          if (fileData) {
            formData.files[key] = fileData;
            // Clean up chunks
            const chunks = parseInt(
              localStorage.getItem(`file_${key}_chunks`) || "0"
            );
            for (let i = 0; i < chunks; i++) {
              localStorage.removeItem(`file_${key}_${i}`);
            }
            localStorage.removeItem(`file_${key}_chunks`);
          }
        }

        const response = await fetch("/api/verify-phone-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            otp: otp.trim(),
            tempId,
            formData,
            token,
          }),
        });

        let data;
        try {
          data = await response.json();
        } catch (error) {
          throw new Error("Invalid server response");
        }

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Phone verification failed");
        }

        toast.dismiss(loadingToast);
        toast.success("Verification successful!");

        // Clear all related data
        localStorage.removeItem("pendingBasicData");
        localStorage.removeItem("otpSent");
        localStorage.removeItem("lastResendAttempt");

        // Clear file chunks
        fileKeys.forEach((key) => {
          const chunks = parseInt(
            localStorage.getItem(`file_${key}_chunks`) || "0"
          );
          for (let i = 0; i < chunks; i++) {
            localStorage.removeItem(`file_${key}_${i}`);
          }
          localStorage.removeItem(`file_${key}_chunks`);
        });

        router.push("/success");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(
        error instanceof Error ? error.message : "Verification failed"
      );
      console.error("Verification error:", error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Toaster position="top-center" />
      <motion.div className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
        <motion.h2 className="text-3xl font-bold text-center text-black mb-8">
          {step === "email" ? "Verify Your Email" : "Verify Your Phone"}
        </motion.h2>

        <motion.p className="text-center text-black mb-8 font-medium">
          {step === "email"
            ? `We've sent a verification code to ${email}. Please enter the recieved OTP.`
            : "We've sent a verification code to your Aadhaar-linked mobile number."}
        </motion.p>

        <form onSubmit={handleVerify} className="space-y-8">
          

          <div className="flex justify-center gap-2 sm:gap-3">
            {[...Array(6)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <input
                  type="text"
                  maxLength={1}
                  value={otp[index] || ""}
                  onChange={(e) => {
                    const value = e.target.value.slice(-1);
                    if (/^\d*$/.test(value)) {
                      const newOtp = [...otp];
                      newOtp[index] = value;
                      setOtp(newOtp.join(""));

                      if (value && index < 5) {
                        const target = e.target as HTMLInputElement;
                        const inputs =
                          target.parentElement?.parentElement?.querySelectorAll(
                            "input"
                          );
                        if (inputs && inputs[index + 1]) {
                          (inputs[index + 1] as HTMLInputElement).focus();
                        }
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      const target = e.target as HTMLInputElement;
                      const inputs =
                        target.parentElement?.parentElement?.querySelectorAll(
                          "input"
                        );
                      if (inputs && inputs[index - 1]) {
                        (inputs[index - 1] as HTMLInputElement).focus();
                      }
                    }
                  }}
                  className="w-8 sm:w-12 h-10 sm:h-14 text-center text-lg sm:text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm transition-all duration-200 text-black"
                />
              </motion.div>
            ))}
          </div>

          <motion.div>
            <button
              type="submit"
              disabled={
                isVerifying ||
                otp.length !== 6 ||
                (step === "email" && !aadharNumber)
              }
              className={`w-full py-4 px-4 rounded-xl text-white font-medium transition-all duration-300 
                ${
                  isVerifying ||
                  otp.length !== 6 ||
                  (step === "email" && !aadharNumber)
                    ? "bg-gray-400 cursor-not-allowed opacity-70"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isVerifying
                ? "Verifying..."
                : step === "email"
                ? "Verify Email Code"
                : "Verify Phone Code"}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
