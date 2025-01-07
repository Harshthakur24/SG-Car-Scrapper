import { useEffect, useState } from 'react';
import { User } from '@prisma/client';

export const UserDocumentsPDF = ({ user }: { user: User }) => {
    const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const mergePDFs = async () => {
            setLoading(true);
            try {
                const validUrls = [
                    user.adharCard,
                    user.panCard,
                    user.registrationCertificate,
                    user.challanSeizureMemo,
                    user.cancelledCheck,
                    user.deathCertificate,
                    user.hypothecationClearanceDoc
                ]
                    .filter(Boolean)
                    .map(url => getDocumentUrl(url))
                    .filter(Boolean) as string[];

                const response = await fetch('/api/merge-pdfs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ urls: validUrls }),
                });

                if (!response.ok) throw new Error('Failed to merge PDFs');
                const blob = await response.blob();
                setPdfBlob(blob);
            } catch (error) {
                console.error('Error merging PDFs:', error);
            } finally {
                setLoading(false);
            }
        };

        mergePDFs();
    }, [user]);

    const getDocumentUrl = (url: string | null) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (url.includes('res.cloudinary.com')) return `https://${url}`;
        return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/raw/upload/${url}`;
    };

    if (loading) {
        return (
            <button disabled className="flex items-center space-x-2 px-4 py-2 bg-red-400 text-white rounded-lg opacity-75 cursor-wait">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Preparing Documents...</span>
            </button>
        );
    }

    if (!pdfBlob) return null;

    return (
        <a
            href={URL.createObjectURL(pdfBlob)}
            download="all-documents.pdf"
            className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 
                text-white font-medium rounded-3xl hover:from-red-600 hover:to-red-700
                transform hover:scale-110 active:scale-100
                transition-all duration-300 ease-in-out
                shadow-[0_4px_12px_rgba(220,38,38,0.25)] hover:shadow-[0_6px_16px_rgba(220,38,38,0.35)]
                focus:outline-none"
        >
            <svg
                className="h-5 w-5 transition-transform group-hover:translate-y-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
            </svg>
            <span className="text-sm font-semibold tracking-wide">
                Download All Documents
            </span>
        </a>
    );
}; 