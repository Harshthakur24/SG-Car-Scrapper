import React from 'react';
import { motion } from 'framer-motion';

export default function Header() {
    const CarIcon = () => (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
            }}
        >
            <motion.svg
                className="w-12 h-12 text-blue-600"
                viewBox="0 0 24 24"
                fill="currentColor"
                animate={{
                    y: [0, -4, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <motion.path
                    d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-5h14v5z"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{
                        duration: 2,
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 1
                    }}
                />
                <motion.circle
                    cx="7.5"
                    cy="14.5"
                    r="1.5"
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
                <motion.circle
                    cx="16.5"
                    cy="14.5"
                    r="1.5"
                    animate={{
                        rotate: [0, 360],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />
            </motion.svg>
        </motion.div>
    );

    return (
        <div className="text-center py-8">
            <div className="flex flex-col items-center gap-4">
                <CarIcon />
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                        SG JUNKYARD AND RECYCLING LLP
                    </h1>
                    <div className="space-y-1">
                        <p className="text-xl text-gray-600 font-medium">
                            AUTHORIZED CAR SCRAPPER
                        </p>
                        <p className="text-gray-500">
                            DELHI, INDIA
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 