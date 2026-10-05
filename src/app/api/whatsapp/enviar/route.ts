import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppTextMessage } from '@/utils/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { telefono, mensaje, clienteNombre } = body;

    if (!telefono) {
      return NextResponse.json(
        { error: 'El número de teléfono del cliente es requerido.' },
        { status: 400 }
      );
    }

    if (!mensaje || mensaje.trim() === '') {
      return NextResponse.json(
        { error: 'El contenido del mensaje no puede estar vacío.' },
        { status: 400 }
      );
    }

    const res = await sendWhatsAppTextMessage({
      to: telefono,
      message: mensaje,
    });

    if (!res.success) {
      return NextResponse.json({
        success: false,
        error: res.error,
        metaErrorCode: res.metaErrorCode,
        details: res.details,
      });
    }

    return NextResponse.json({
      success: true,
      messageId: res.messageId,
      destinatario: telefono,
      cliente: clienteNombre || 'Cliente',
    });
  } catch (err: any) {
    console.error('Error en /api/whatsapp/enviar:', err);
    return NextResponse.json(
      { error: err.message || 'Error interno al enviar WhatsApp' },
      { status: 500 }
    );
  }
}
