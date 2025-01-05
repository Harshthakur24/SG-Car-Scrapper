import React from 'react';
import { motion } from 'framer-motion';
import { IoCarSportOutline } from 'react-icons/io5';

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
            <motion.div
                className="text-blue-600"
                animate={{
                    rotate: [-8, 8, -8],
                    scale: [1, 1.1, 1],
                    y: [0, -5, 0],
                }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            >
                <IoCarSportOutline className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20" />
            </motion.div>
        </motion.div>
    );

    return (
        <div className="text-center py-4 md:py-6 lg:py-8 px-4 md:px-6">
            <div className="flex flex-col items-center gap-2 md:gap-4">
                <CarIcon />
                <div className="max-w-[90%] md:max-w-[80%] lg:max-w-[70%] mx-auto">
                    <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-black tracking-tight mb-2 leading-tight">
                        SG JUNKYARD AND RECYCLING LLP
                    </h1>
                    <div className="space-y-0.5 md:space-y-1">
                        <p className="text-lg md:text-xl text-gray-900 font-bold">
                            AUTHORIZED CAR SCRAPPER
                        </p>
                        <p className="text-base md:text-lg text-gray-800 font-bold">
                            DELHI, INDIA
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
} 