import sharp from 'sharp'

export async function processImage(buffer: Buffer) {
    return sharp(buffer)
        .resize(800, 600)
        .jpeg()
        .toBuffer()
} 