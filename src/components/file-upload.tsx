import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";

export const FileUpload = forwardRef<
    HTMLInputElement,
    {
        label: string;
        name: string;
        required?: boolean;
        onChange: (file: File | null) => void;
    }
>(({ label, name, required = false, onChange }, ref) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => fileInputRef.current!);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            onChange(droppedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setFile(null);
        onChange(null);
    };

    const shakeAnimation = {
        rotate: [0, -8, 8, -8, 8, -4, 4, -4, 4, 0],
        x: [0, -2, 2, -2, 2, -1, 1, -1, 1, 0],
        transition: {
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut"
        },
    };

    return (
        <motion.div
            className="space-y-2"
            whileHover={{ scale: 1.04 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <label className="text-base font-bold text-gray-900">
                        {label}
                    </label>
                    {required && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded-full border border-red-100"
                        >
                            Required
                        </motion.span>
                    )}
                </div>
            </div>

            <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    "relative cursor-pointer border-2 border-dashed rounded-xl p-6 transition-all duration-200",
                    isDragging
                        ? "border-blue-500 bg-blue-50 ring-4 ring-blue-50"
                        : file
                            ? "border-green-500 bg-green-50/30 hover:bg-green-50"
                            : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/50",
                    "shadow-sm hover:shadow-md"
                )}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    name={name}
                    required={required}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        const selectedFile = e.target.files?.[0] || null;
                        setFile(selectedFile);
                        onChange(selectedFile);
                    }}
                />

                <AnimatePresence mode="wait">
                    {file ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg border border-green-100 shadow-sm"
                        >
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="p-2 bg-green-50 rounded-lg shrink-0">
                                    <motion.svg
                                        className="w-5 h-5 sm:w-6 sm:h-6 text-green-600"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1, rotate: 360 }}
                                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                                    >
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
                                    </motion.svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(file.size / 1024).toFixed(2)} KB
                                    </p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ rotate: 180, scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                onClick={handleRemoveFile}
                                className="p-1.5 sm:p-2 hover:bg-red-50 rounded-full group shrink-0 ml-2"
                            >
                                <svg
                                    className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-red-500 transition-colors"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center gap-3 py-4"
                        >
                            <motion.div
                                whileHover={shakeAnimation}
                                animate={{
                                    y: [0, -5, 0],
                                    scale: [1, 1.12, 1],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors"
                            >
                                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </motion.div>
                            <div className="text-center space-y-2">
                                <motion.p
                                    className="text-gray-700 font-medium"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    Drop your file here, or <span className="text-blue-500 hover:text-blue-600">browse</span>
                                </motion.p>
                                <p className="text-sm text-gray-500">
                                    Supports: PDF and Images
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
});

FileUpload.displayName = 'FileUpload'; 