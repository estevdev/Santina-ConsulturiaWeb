import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, targetWidth = 2568, targetHeight = 1620, cropBox } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'No se proporcionó imagen para procesamiento' }, { status: 400 });
    }

    // 1. Limpiar cualquier prefijo Data URL de forma robusta
    const base64Clean = typeof imageBase64 === 'string' && imageBase64.includes(',')
      ? imageBase64.split(',')[1].trim()
      : typeof imageBase64 === 'string'
      ? imageBase64.trim()
      : '';

    if (!base64Clean) {
      return NextResponse.json({ error: 'Buffer de imagen vacío o formato base64 inválido' }, { status: 400 });
    }

    const inputBuffer = Buffer.from(base64Clean, 'base64');

    // 2. Normalizar orientación EXIF
    const orientedPipeline = sharp(inputBuffer).rotate();
    const rotatedBuffer = await orientedPipeline.toBuffer();
    
    let pipeline = sharp(rotatedBuffer);

    // Si se especificó un cuadro de recorte manual ajustado por el usuario
    if (cropBox && typeof cropBox.left === 'number' && typeof cropBox.top === 'number' && typeof cropBox.width === 'number' && typeof cropBox.height === 'number') {
      const meta = await sharp(rotatedBuffer).metadata();
      const imgW = meta.width || 1000;
      const imgH = meta.height || 1000;

      const left = Math.max(0, Math.min(imgW - 1, Math.round(cropBox.left)));
      const top = Math.max(0, Math.min(imgH - 1, Math.round(cropBox.top)));
      const width = Math.max(1, Math.min(imgW - left, Math.round(cropBox.width)));
      const height = Math.max(1, Math.min(imgH - top, Math.round(cropBox.height)));

      pipeline = pipeline.extract({ left, top, width, height });
    }

    // 3. Resizing Lanczos3 a resolución Ultra HD 4K exacta
    const processedBuffer = await pipeline
      .resize({
        width: targetWidth,
        height: targetHeight,
        fit: 'cover',
        position: 'center',
        kernel: sharp.kernel.lanczos3,
      })
      .modulate({
        brightness: 1.0,
        saturation: 1.0,
      })
      .sharpen({
        sigma: 0.8,
        m1: 0.5,
        m2: 1.5,
      })
      .png({ compressionLevel: 6, quality: 100 })
      .toBuffer();

    const outputBase64 = `data:image/png;base64,${processedBuffer.toString('base64')}`;

    return NextResponse.json({
      success: true,
      extractedDataUrl: outputBase64,
      width: targetWidth,
      height: targetHeight,
    });
  } catch (err: any) {
    console.error('Error en extracción de servidor:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno durante la extracción de imagen en servidor' },
      { status: 500 }
    );
  }
}
