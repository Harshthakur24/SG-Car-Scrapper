import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        
        if (!body) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid request body',
                code: 'INVALID_REQUEST'
            }, { status: 400 });
        }

        const { email, phoneNumber, otp, tempId, method, formData } = body;
        const otpData = global.otpStore?.get(tempId);

        // Process and upload files if not already uploaded
        if (!otpData?.uploadResults) {
            try {
                const uploadResults = await Promise.all(
                    Object.entries(formData.files || {}).map(async ([key, value]) => {
                        if (!value) return null;
                        try {
                            console.log(`Uploading ${key}...`);
                            if (typeof value === 'string' && value.includes('base64')) {
                                const url = await uploadToCloudinary(value);
                                console.log(`Successfully uploaded ${key}: ${url}`);
                                return url;
                            }
                            return null;
                        } catch (error) {
                            console.error(`Failed to upload ${key}:`, error);
                            return null;
                        }
                    })
                );
                
                // Store upload results in OTP data
                if (otpData) {
                    otpData.uploadResults = uploadResults;
                    global.otpStore?.set(tempId, otpData);
                }
            } catch (error) {
                console.error('Upload error:', error);
                return NextResponse.json({ 
                    success: false,
                    error: 'Failed to upload files',
                    code: 'UPLOAD_ERROR'
                }, { status: 500 });
            }
        }

        // Verify OTP
        if (!otpData) {
            return NextResponse.json({ 
                success: false,
                error: 'Verification session expired. Please request a new code.',
                code: 'SESSION_EXPIRED'
            }, { status: 400 });
        }

        if (otpData.email !== email) {
            return NextResponse.json({ 
                success: false,
                error: 'Invalid verification session',
                code: 'INVALID_SESSION'
            }, { status: 400 });
        }

        let isValidOTP = false;
        if (method === 'phone') {
            const formattedPhone = phoneNumber.startsWith('+') 
                ? phoneNumber 
                : `+91${phoneNumber.replace(/^0+/, '')}`;
            isValidOTP = await verifyOTP(formattedPhone, otp);
        } else {
            isValidOTP = otpData.otp === otp;
        }

        if (!isValidOTP) {
            return NextResponse.json({ 
                success: false,
                error: 'Invalid verification code',
                code: 'INVALID_OTP'
            }, { status: 400 });
        }

        // Create user with stored upload results
        try {
            const uploadResults = otpData.uploadResults || [];
            const user = await prisma.user.create({
                data: {
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    vehicleNumber: formData.vehicleNumber?.toString().toUpperCase() || '',
                    aadharNumber: formData.aadharNumber?.replace(/\D/g, '') || '',
                    adharCard: uploadResults[0] || '',
                    panCard: uploadResults[1] || '',
                    registrationCertificate: uploadResults[2] || '',
                    cancelledCheck: uploadResults[3] || '',
                    challanSeizureMemo: uploadResults[4] || '',
                    deathCertificate: uploadResults[5] || null,
                    hypothecationClearanceDoc: uploadResults[6] || null,
                    isHypothecated: Boolean(formData.isHypothecated),
                    isRcLost: Boolean(formData.isRcLost),
                    rcLostDeclaration: formData.rcLostDeclaration || '',
                    vahanRegistrationLink: formData.vahanRegistrationLink || '',
                    isVerified: true,
                    paymentDone: false
                },
            });

            // Clean up OTP data after successful verification and user creation
            global.otpStore?.delete(tempId);

            return NextResponse.json({ 
                success: true,
                userId: user.id,
                message: 'Verification successful'
            });

        } catch (error) {
            console.error('Data processing error:', error);
            return NextResponse.json({ 
                success: false,
                error: 'Failed to process submission',
                code: 'PROCESSING_ERROR'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to process request',
            code: 'SERVER_ERROR'
        }, { status: 500 });
    }
} 