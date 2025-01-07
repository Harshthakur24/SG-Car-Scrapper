import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

export async function POST(req: Request) {
    try {
        const { urls } = await req.json();
        console.log('Received URLs:', urls); // Debug log

        if (!urls || urls.length === 0) {
            console.log('No URLs provided'); // Debug log
            return new NextResponse('No URLs provided', { status: 400 });
        }

        const mergedPdf = await PDFDocument.create();

        for (const url of urls) {
            if (!url) continue;
            try {
                const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                console.log('Processing URL:', fullUrl); // Debug log
                
                const response = await fetch(fullUrl);
                if (!response.ok) {
                    console.error('Failed to fetch PDF:', fullUrl); // Debug log
                    continue;
                }
                
                const pdfBytes = await response.arrayBuffer();
                const pdf = await PDFDocument.load(pdfBytes);
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            } catch (error) {
                console.error('Error processing PDF:', url, error); // Debug log
                continue;
            }
        }

        const mergedPdfBytes = await mergedPdf.save();
        return new NextResponse(mergedPdfBytes, {
            headers: { 'Content-Type': 'application/pdf' }
        });
    } catch (error) {
        console.error('Failed to merge PDFs:', error); // Debug log
        return new NextResponse('Failed to merge PDFs', { status: 500 });
    }
} 