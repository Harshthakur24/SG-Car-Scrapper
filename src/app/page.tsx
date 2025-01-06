'use client';
import React, { useState, useRef } from 'react';
import Header from '@/components/Header';
import { FileUpload } from "@/components/file-upload";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function FormPage() {
  const [emailInput, setEmailInput] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isRcLost, setIsRcLost] = useState<boolean | null>(null);
  const [isHypothecationCleared, setIsHypothecationCleared] = useState<boolean | null>(null);
  const [vahanLink, setVahanLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    adharCard: null,
    panCard: null,
    registrationCertificate: null,
    cancelledCheck: null,
    challanSeizureMemo: null,
    deathCertificate: null,
    hypothecationClearanceDoc: null
  });
  const fileInputsRef = useRef<{
    adharCard: HTMLInputElement | null;
    panCard: HTMLInputElement | null;
    registrationCertificate: HTMLInputElement | null;
    deathCertificate: HTMLInputElement | null;
    cancelledCheck: HTMLInputElement | null;
    challanSeizureMemo: HTMLInputElement | null;
    hypothecationClearanceDoc: HTMLInputElement | null;
  }>({
    adharCard: null,
    panCard: null,
    registrationCertificate: null,
    deathCertificate: null,
    cancelledCheck: null,
    challanSeizureMemo: null,
    hypothecationClearanceDoc: null,
  });
  const router = useRouter();

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Sending verification code...');

    try {
      // Convert files to base64
      const filesBase64: { [key: string]: string | null } = {};
      for (const [key, file] of Object.entries(files)) {
        if (file) {
          filesBase64[key] = await convertFileToBase64(file);
        } else {
          filesBase64[key] = null;
        }
      }

      // Generate OTP
      const response = await fetch('/api/generate-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: (form.elements.namedItem('email') as HTMLInputElement).value,
          phoneNumber: (form.elements.namedItem('phoneNumber') as HTMLInputElement).value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Store form data in localStorage
      const formDataToStore = {
        name: (form.elements.namedItem('name') as HTMLInputElement).value,
        email: (form.elements.namedItem('email') as HTMLInputElement).value,
        phoneNumber: (form.elements.namedItem('phoneNumber') as HTMLInputElement).value,
        files: filesBase64,
        vahanRegistrationLink: vahanLink,
        isRcLost,
        isHypothecationCleared,
        rcLostDeclaration: (form.elements.namedItem('rcLostDeclaration') as HTMLInputElement)?.value,
        tempId: data.tempId,
      };

      localStorage.setItem('pendingSubmission', JSON.stringify(formDataToStore));

      toast.dismiss(loadingToast);
      toast.success('Verification codes sent!', {
        duration: 5000,
        style: {
          background: '#ffffff',
          color: '#000000',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
      });

      router.push(`/verify?email=${encodeURIComponent(formDataToStore.email)}&phoneNumber=${encodeURIComponent(formDataToStore.phoneNumber)}&tempId=${data.tempId}`);

    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed to send verification codes', {
        style: {
          background: '#ffffff',
          color: '#ef4444',
          padding: '16px',
          borderRadius: '8px',
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const form = document.querySelector('form');
    if (!form) return false;

    const requiredFields = {
      name: 'Name',
      email: 'Email',
      phoneNumber: 'Phone Number',
      adharCard: 'Aadhar Card',
      panCard: 'PAN Card',
      registrationCertificate: 'Registration Certificate',
      cancelledCheck: 'Cancelled Check',
      challanSeizureMemo: 'Challan Seizure Memo'
    };

    // Check required text fields
    for (const [fieldName, label] of Object.entries(requiredFields)) {
      const input = form.elements.namedItem(fieldName) as HTMLInputElement;
      if (!input?.value) {
        toast.error(`Please enter ${label}`, {
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
          },
        });
        return false;
      }
    }

    // Check required files
    const missingFiles = Object.entries(requiredFields)
      .filter(([key]) => files[key as keyof typeof files] === null)
      .map(([, label]) => label);

    if (missingFiles.length > 0) {
      missingFiles.forEach(doc => {
        toast.error(`Please upload ${doc}`, {
          duration: 3000,
          style: {
            background: '#fee2e2',
            color: '#991b1b',
            padding: '16px',
          },
        });
      });
      return false;
    }

    // Check hypothecation doc if needed
    if (isHypothecationCleared === true && !files.hypothecationClearanceDoc) {
      toast.error('Please upload Hypothecation Clearance Document', {
        duration: 3000,
        style: {
          background: '#fee2e2',
          color: '#991b1b',
          padding: '16px',
        },
      });
      return false;
    }

    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.5rem',
            padding: '1rem',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Header />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="relative p-1 rounded-2xl bg-gradient-to-r">
          <div className="absolute inset-0 border-2 border-dashed border-black rounded-2xl"></div>
          <div className="relative bg-white rounded-2xl shadow-xl p-8 md:p-10">

            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl text-gray-900 font-bold text-center">
                Required Documents
                <span className="block mt-3 text-lg md:text-xl font-normal text-gray-500 tracking-wide">
                  For Vehicle Scrap Value Claim
                </span>
              </h2>
              <div className="mt-3 w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>

            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b">
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border bg-gray-50 text-gray-900 transition-all",
                        errors.name
                          ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                          : "border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                      )}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Phone Number
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 bg-gray-100 text-gray-600 font-medium">
                        +91
                      </span>
                      <input
                        type="tel"
                        name="phoneNumber"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        onKeyPress={(e) => {
                          if (!/[0-9]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        className="w-full px-4 py-2 rounded-r-lg border border-gray-300 bg-gray-50 text-gray-900 hover:border-blue-300 focus:border-blue-600 focus:bg-white focus:outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        className={cn(
                          "w-6/12 px-4 py-2 rounded-lg border bg-gray-50 text-gray-900 transition-all",
                          errors.email
                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-200"
                        )}
                        placeholder="Enter your email"
                        value={emailInput}
                        onChange={(e) => {
                          setEmailInput(e.target.value);
                          setErrors({ ...errors, email: '' }); // Clear error on change
                        }}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 pb-2 border-b">
                  Required Documents
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FileUpload
                    label="Aadhar Card"
                    name="adharCard"
                    required
                    ref={el => {
                      fileInputsRef.current.adharCard = el;
                    }}
                    onChange={(file) => {
                      const newFiles = { ...files, adharCard: file };
                      setFiles(newFiles);
                    }}
                  />

                  <FileUpload
                    label="PAN Card"
                    name="panCard"
                    required
                    ref={el => {
                      fileInputsRef.current.panCard = el;
                    }}
                    onChange={(file) => {
                      const newFiles = { ...files, panCard: file };
                      setFiles(newFiles);
                    }}
                  />

                  <FileUpload
                    label="Registration Certificate"
                    name="registrationCertificate"
                    required
                    ref={el => {
                      fileInputsRef.current.registrationCertificate = el;
                    }}
                    onChange={(file) => {
                      const newFiles = { ...files, registrationCertificate: file };
                      setFiles(newFiles);
                    }}
                  />

                  <FileUpload
                    label="Death Certificate"
                    name="deathCertificate"
                    ref={el => {
                      fileInputsRef.current.deathCertificate = el;
                    }}
                    onChange={(file) => {
                      const newFiles = { ...files, deathCertificate: file };
                      setFiles(newFiles);
                    }}
                  />

                  <FileUpload
                    label="Cancelled Check / Pass Book"
                    name="cancelledCheck"
                    required
                    ref={el => {
                      fileInputsRef.current.cancelledCheck = el;
                    }}
                    onChange={(file) => {
                      const newFiles = { ...files, cancelledCheck: file };
                      setFiles(newFiles);
                    }}
                  />

                  <FileUpload
                    label="Challan Seizure Memo"
                    name="challanSeizureMemo"
                    required
                    ref={el => {
                      fileInputsRef.current.challanSeizureMemo = el;
                    }}
                    onChange={(file) => {
                      const newFiles = { ...files, challanSeizureMemo: file };
                      setFiles(newFiles);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="space-y-4 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-900 mb-3 sm:mb-0">Is your vehicle&apos;s hypothecation cleared?</h4>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setIsHypothecationCleared(true)}
                            className={`px-4 py-2 rounded-full text-sm font-medium ${isHypothecationCleared ? 'bg-amber-600 text-white' : 'bg-white border text-gray-600'}`}>
                            Yes
                          </button>
                          <button type="button" onClick={() => setIsHypothecationCleared(false)}
                            className={`px-4 py-2 rounded-full text-sm font-medium ${isHypothecationCleared === false ? 'bg-gray-600 text-white' : 'bg-white border text-gray-600'}`}>
                            No
                          </button>
                        </div>
                      </div>

                      {isHypothecationCleared && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <FileUpload
                            label="Hypothecation Clearance Document"
                            name="hypothecationClearanceDoc"
                            required
                            ref={el => {
                              fileInputsRef.current.hypothecationClearanceDoc = el;
                            }}
                            onChange={(file) => {
                              const newFiles = { ...files, hypothecationClearanceDoc: file };
                              setFiles(newFiles);
                            }}
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RC Lost Declaration Section */}
                <div className="bg-gradient-to-r from-rose-50 to-red-50 border border-rose-100 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 rounded-lg shrink-0">
                      <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="space-y-4 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <h4 className="text-base font-semibold text-gray-900 mb-3 sm:mb-0">Is your Registration Certificate (RC) Lost?</h4>
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => setIsRcLost(true)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isRcLost ? 'bg-rose-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-rose-300'}`}>
                            Yes
                          </button>
                          <button type="button" onClick={() => setIsRcLost(false)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${isRcLost === false ? 'bg-gray-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:border-gray-400'}`}>
                            No
                          </button>
                        </div>
                      </div>

                      {isRcLost && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-3"
                        >
                          <p className="text-sm text-gray-600">
                            Please provide a declaration stating the loss of your RC.
                          </p>
                          <div className="mt-2">
                            <textarea
                              name="rcLostDeclaration"
                              rows={6}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-rose-200 focus:border-rose-500 transition-all"
                              placeholder="I hereby declare that my vehicle's RC with registration number [ENTER NUMBER] has been lost. I take full responsibility for any misuse of the lost RC."
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="rcLostConfirm"
                              className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                            />
                            <label htmlFor="rcLostConfirm" className="text-sm text-gray-600">
                              I confirm this declaration is true and accurate
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  Generate Vahan Registration Link
                  <span className="block mt-1 text-sm font-normal text-gray-500">
                    Required for document verification
                  </span>
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <a
                    href="https://vahan.parivahan.gov.in/vahanservice/vahan/ui/login/login.xhtml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 rounded-full text-blue-600 font-medium transition-all duration-300 transform hover:scale-[1.06]"
                  >
                    Generate Link
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <motion.div
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [1, 0.6, 1],
                          y: [0, -2, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className="w-2 h-2 rounded-full bg-blue-600"
                      />
                    </div>
                  </a>
                </div>
              </div>

              {/* New Registration Link Input Section */}
              <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-4">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Link
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="url"
                        name="vahanRegistrationLink"
                        required
                        value={vahanLink}
                        onChange={(e) => setVahanLink(e.target.value)}
                        placeholder="Paste your Vahan registration link here"
                        className="w-full px-4 py-2.5 pr-10 rounded-lg border bg-white text-gray-900 transition-all
                          border-gray-300 hover:border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                      {vahanLink && (
                        <button
                          type="button"
                          onClick={() => setVahanLink('')}
                          className="absolute right-3 p-1 rounded-full hover:bg-gray-100"
                        >
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Please generate your Vahan registration link before submitting the documents. This link will be used to verify your vehicle registration details.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="submit"
                  onClick={(e) => {
                    if (!validateForm()) {
                      e.preventDefault();
                      return;
                    }
                  }}
                  disabled={isSubmitting}
                  className={`w-full md:w-4/12 bg-gradient-to-r ${isSubmitting
                    ? 'from-gray-400 to-gray-500 cursor-not-allowed'
                    : 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    } text-white text-lg font-semibold py-4 px-8 rounded-full focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-[1.06] hover:shadow-2xl shadow-lg`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Documents'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}