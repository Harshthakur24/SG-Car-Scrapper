"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import { motion } from "framer-motion";

// Custom error types
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class APIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'APIError';
  }
}

interface FormFiles {
  [key: string]: string;
}

interface FormData {
  files: FormFiles;
  [key: string]: any;
}

// Retry configuration
const MAX_RETRIES = 1;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function VerifyContent() {
  const [otp, setOtp] = useState("");
  const [aadharNumber, setAadharNumber] = useState("");
  const [token, setToken] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<"email" | "phone">("email");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Retry function for API calls
  const retryApiCall = async <T,>(
    apiCall: () => Promise<T>,
    errorMessage: string,
    currentRetry: number = 0
  ): Promise<T> => {
    try {
      return await apiCall();
    } catch (error) {
      if (currentRetry < MAX_RETRIES) {
        toast.loading(`Retrying... Attempt ${currentRetry + 1} of ${MAX_RETRIES + 1}`);
        await sleep(RETRY_DELAY);
        return retryApiCall(apiCall, errorMessage, currentRetry + 1);
      }
      throw error;
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      try {
        const email = searchParams?.get("email");
        const tempId = searchParams?.get("tempId");

        if (!searchParams || !email || !tempId) {
          throw new ValidationError("Missing required parameters");
        }

        const pending = localStorage.getItem("pendingBasicData");
        if (!pending) {
          throw new ValidationError("No pending verification found");
        }

        try {
          const basicData = JSON.parse(pending);
          if (basicData.aadharNumber) {
            setAadharNumber(basicData.aadharNumber);
          }
        } catch (error) {
          throw new ValidationError("Invalid pending data format");
        }

        setIsLoading(false);
      } catch (error) {
        if (error instanceof ValidationError) {
          toast.error(error.message);
        } else {
          toast.error("Failed to initialize verification page");
        }
        router.push("/");
      }
    };

    initializePage();
  }, [searchParams, router]);

  const verifyEmailOtp = async () => {
    const email = searchParams?.get("email");
    const tempId = searchParams?.get("tempId");

    if (!email || !tempId) {
      throw new ValidationError("Missing required parameters");
    }

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

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new APIError(data.error || "Email verification failed", response.status);
    }

    const data = await response.json();
    if (!data.success) {
      throw new APIError(data.error || "Email verification failed");
    }

    return data;
  };

  const verifyPhoneOtp = async () => {
    const email = searchParams?.get("email");
    const tempId = searchParams?.get("tempId");

    const basicData = localStorage.getItem("pendingBasicData");
    if (!basicData) {
      throw new ValidationError("No pending submission found");
    }

    const formData: FormData = JSON.parse(basicData);
    const fileKeys = [
      "adharCard",
      "panCard",
      "registrationCertificate",
      "cancelledCheck",
      "challanSeizureMemo",
      "deathCertificate",
      "hypothecationClearanceDoc",
    ];

    formData.files = reconstructFileData(fileKeys);

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

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new APIError(data.error || "Phone verification failed", response.status);
    }

    const data = await response.json();
    if (!data.success) {
      throw new APIError(data.error || "Phone verification failed");
    }

    return { data, fileKeys };
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);
    const loadingToast = toast.loading("Verifying...");

    try {
      if (step === "email") {
        const data = await retryApiCall(
          verifyEmailOtp,
          "Email verification failed"
        );

        setToken(data.token);
        toast.dismiss(loadingToast);
        toast.success("Email verified! Phone OTP has been sent.");
        setStep("phone");
        setOtp("");
        setRetryCount(0);

      } else if (step === "phone") {
        const { data, fileKeys } = await retryApiCall(
          verifyPhoneOtp,
          "Phone verification failed"
        );

        toast.dismiss(loadingToast);
        toast.success("Verification successful!");
        cleanupStorageData(fileKeys);
        router.push("/success");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      let errorMessage = "An unexpected error occurred";
      
      if (error instanceof ValidationError) {
        errorMessage = error.message;
      } else if (error instanceof APIError) {
        errorMessage = error.message;
        if (error.statusCode === 429) {
          errorMessage = "Too many attempts. Please try again later.";
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setRetryCount(prev => prev + 1);
    } finally {
      setIsVerifying(false);
    }
  };

  const reconstructFileData = (fileKeys: string[]): FormFiles => {
    const files: FormFiles = {};

    for (const key of fileKeys) {
      try {
        const chunks = parseInt(localStorage.getItem(`file_${key}_chunks`) || "0");
        if (!chunks) continue;

        let fileData = "";
        for (let i = 0; i < chunks; i++) {
          const chunk = localStorage.getItem(`file_${key}_${i}`);
          if (!chunk) throw new Error(`Missing chunk ${i} for file ${key}`);
          fileData += chunk;
        }
        files[key] = fileData;
      } catch (error) {
        throw new ValidationError(`Failed to reconstruct file: ${key}`);
      }
    }

    return files;
  };

  const cleanupStorageData = (fileKeys: string[]) => {
    localStorage.removeItem("pendingBasicData");
    localStorage.removeItem("otpSent");
    localStorage.removeItem("lastResendAttempt");

    fileKeys.forEach((key) => {
      const chunks = parseInt(localStorage.getItem(`file_${key}_chunks`) || "0");
      for (let i = 0; i < chunks; i++) {
        localStorage.removeItem(`file_${key}_${i}`);
      }
      localStorage.removeItem(`file_${key}_chunks`);
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Toaster position="top-center" />
      <motion.div className="w-full max-w-md p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50">
        <motion.h2 className="text-3xl font-bold text-center text-black mb-8">
          {step === "email" ? "Verify Your Email" : "Verify Your Phone"}
        </motion.h2>

        {error && (
          <motion.div 
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
            {retryCount <= MAX_RETRIES && (
              <p className="mt-2 text-sm">
                Automatically retrying... Attempt {retryCount + 1} of {MAX_RETRIES + 1}
              </p>
            )}
          </motion.div>
        )}

        <motion.p className="text-center text-black mb-8 font-medium">
          {step === "email"
            ? `We've sent a verification code to ${searchParams?.get("email")}. Please enter the received OTP.`
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
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={1}
                  value={otp[index] || ""}
                  onChange={(e) => {
                    const value = e.target.value.slice(-1);
                    if (/^\d*$/.test(value)) {
                      const newOtp = [...otp];
                      newOtp[index] = value;
                      setOtp(newOtp.join(""));

                      if (value && index < 5) {
                        const inputs = e.target.parentElement?.parentElement?.querySelectorAll(
                          "input"
                        );
                        if (inputs?.[index + 1]) {
                          (inputs[index + 1] as HTMLInputElement).focus();
                        }
                      }
                    }
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      const target = e.currentTarget;
                      const inputs = target.parentElement?.parentElement?.querySelectorAll<HTMLInputElement>("input");
                      if (inputs?.[index - 1]) {
                        inputs[index - 1].focus();
                      }
                    }
                  }}
                  className="w-8 sm:w-12 h-10 sm:h-14 text-center text-lg sm:text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white shadow-sm transition-all duration-200 text-black"
                  aria-label={`OTP digit ${index + 1}`}
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
                ? `Verifying${retryCount > 0 ? ` (Attempt ${retryCount + 1}/${MAX_RETRIES + 1})` : '...'}`
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