import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/twilio';
import { prisma } from '@/lib/prisma';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: Request) {
    try {
        // 1. Parse request body
        let body;
        try {
            body = await request.json();
        } catch (error) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid request body' 
            }, { status: 400 });
        }

        const { email, phoneNumber, otp, tempId, method, formData } = body;

        // Validate required fields
        if (!email || !phoneNumber || !otp || !tempId || !method || !formData) {
            return NextResponse.json({ 
                success: false, 
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        // 2. Verify OTP
        const otpData = global.otpStore?.get(tempId);
        if (!otpData || otpData.email !== email) {
            return NextResponse.json({ 
                success: false,
                error: 'Invalid session or email mismatch' 
            }, { status: 400 });
        }

        // 3. Verify based on method
        if (method === 'phone') {
            try {
                const isValid = await verifyOTP(phoneNumber, otp);
                if (!isValid) {
                    return NextResponse.json({ 
                        success: false,
                        error: 'Invalid verification code' 
                    }, { status: 400 });
                }
            } catch (error) {
                // Fallback to email verification
                if (otpData.otp !== otp) {
                    return NextResponse.json({ 
                        success: false,
                        error: 'Invalid verification code' 
                    }, { status: 400 });
                }
            }
        } else if (otpData.otp !== otp) {
            return NextResponse.json({ 
                success: false,
                error: 'Invalid verification code' 
            }, { status: 400 });
        }

        // 4. Process files and create user
        try {
            // Upload files with better error handling
            const uploadResults = await Promise.all(
                Object.entries(formData.files).map(async ([key, value]) => {
                    if (!value) return null;
                    
                    try {
                        console.log(`Uploading ${key}...`);
                        const url = await uploadToCloudinary(value as string);
                        console.log(`Successfully uploaded ${key}: ${url}`);
                        return url;
                    } catch (error) {
                        console.error(`Failed to upload ${key}:`, error);
                        throw new Error(`Failed to upload ${key}. Please try again.`);
                    }
                })
            );

            // Log the upload results
            console.log('Upload results:', uploadResults);

            // Create user with uploaded files
            const user = await prisma.user.create({
                data: {
                    name: formData.name,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    aadharNumber: formData.aadharNumber.replace(/\D/g, ''),
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
                },
            });

            // Log successful user creation
            console.log('User created:', user.id);

            // Cleanup and respond
            global.otpStore?.delete(tempId);
            
            return NextResponse.json({ 
                success: true,
                userId: user.id,
                message: 'Verification successful'
            });

        } catch (error) {
            console.error('Database/Upload error:', error);
            return NextResponse.json({ 
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process submission. Please try again.' 
            }, { status: 500 });
        }

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to process request' 
        }, { status: 500 });
    }
} 