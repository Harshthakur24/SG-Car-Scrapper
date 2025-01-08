import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

async function convertImageToPDF(imageUrl: string): Promise<Uint8Array> {
    try {
        const response = await fetch(imageUrl);
        const imageData = await response.arrayBuffer();
        
        const pdfDoc = await PDFDocument.create();
        
        // Determine image type and embed accordingly
        const isJpg = imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg');
        const isPng = imageUrl.toLowerCase().includes('.png');
        
        const image = isJpg 
            ? await pdfDoc.embedJpg(imageData)
            : isPng 
                ? await pdfDoc.embedPng(imageData)
                : null;
                
        if (!image) throw new Error('Unsupported image format');

        const page = pdfDoc.addPage();
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: page.getWidth(),
            height: page.getHeight()
        });

        return await pdfDoc.save();
    } catch (error) {
        console.error('Error converting image to PDF:', error);
        throw error;
    }
}

export async function POST(req: Request) {
    try {
        const { urls } = await req.json();
        console.log('Received URLs:', urls);

        if (!urls || urls.length === 0) {
            return new NextResponse('No URLs provided', { status: 400 });
        }

        const mergedPdf = await PDFDocument.create();

        for (const url of urls) {
            if (!url) continue;
            const fullUrl = url.startsWith('http') ? url : `https://${url}`;
            
            try {
                console.log('Processing:', fullUrl);

                // Check if it's an image or PDF
                const isImage = /\.(jpg|jpeg|png)$/i.test(fullUrl);
                
                if (isImage) {
                    const imagePdfBytes = await convertImageToPDF(fullUrl);
                    const imagePdf = await PDFDocument.load(imagePdfBytes);
                    const pages = await mergedPdf.copyPages(imagePdf, imagePdf.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                } else {
                    const response = await fetch(fullUrl);
                    const pdfBytes = await response.arrayBuffer();
                    const pdf = await PDFDocument.load(pdfBytes);
                    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                    pages.forEach(page => mergedPdf.addPage(page));
                }
            } catch (error) {
                console.error('Error processing file:', fullUrl, error);
                continue;
            }
        }

        const mergedPdfBytes = await mergedPdf.save();
        return new NextResponse(mergedPdfBytes, {
            headers: { 'Content-Type': 'application/pdf' }
        });
    } catch (error) {
        console.error('Failed to merge files:', error);
        return new NextResponse('Failed to merge files', { status: 500 });
    }
} 