import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppTextMessage } from '@/utils/whatsapp';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// GET: Obtener todas las plantillas de mensajes configuradas
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('configuraciones_mensajes')
      .select('*')
      .order('categoria', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error('Error obteniendo configuraciones_mensajes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ plantillas: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}

// PATCH: Actualizar una plantilla de mensaje (editar texto o activar/desactivar)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, mensaje, activo, nombre, descripcion_caso } = body;

    if (!id) {
      return NextResponse.json({ error: 'El ID de la plantilla es requerido.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof mensaje === 'string') updates.mensaje = mensaje;
    if (typeof activo === 'boolean') updates.activo = activo;
    if (typeof nombre === 'string') updates.nombre = nombre;
    if (typeof descripcion_caso === 'string') updates.descripcion_caso = descripcion_caso;

    const { data, error } = await supabase
      .from('configuraciones_mensajes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, plantilla: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar plantilla' }, { status: 500 });
  }
}

// POST: Enviar un mensaje de prueba al teléfono indicado con variables simuladas
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, telefonoPrueba, mensajeCustom } = body;

    if (!telefonoPrueba) {
      return NextResponse.json({ error: 'El número de teléfono para la prueba es obligatorio.' }, { status: 400 });
    }

    let textoFinal = mensajeCustom || '';

    // Si no se envió mensaje custom, obtener de la base de datos
    if (!textoFinal && id) {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('configuraciones_mensajes')
        .select('mensaje')
        .eq('id', id)
        .single();
      textoFinal = data?.mensaje || '';
    }

    if (!textoFinal) {
      return NextResponse.json({ error: 'No hay texto de mensaje para enviar.' }, { status: 400 });
    }

    // Reemplazar variables con datos simulados
    const textoReemplazado = textoFinal
      .replace(/\{\{nombre\}\}/g, 'Cliente de Prueba')
      .replace(/\{\{tramite\}\}/g, 'Crédito Mejoravit')
      .replace(/\{\{folio\}\}/g, 'DEMO-789')
      .replace(/\{\{estado\}\}/g, 'En Proceso')
      .replace(/\{\{observaciones\}\}/g, 'Documentación completa en revisión')
      .replace(/\{\{nss\}\}/g, '12345678901')
      .replace(/\{\{enlace\}\}/g, 'https://santina.estev.dev/seguimiento?folio=DEMO-789')
      .replace(/\{\{documento\}\}/g, 'Contrato de Servicios');

    const res = await sendWhatsAppTextMessage({
      to: telefonoPrueba,
      message: textoReemplazado,
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
      mensajeEnviado: textoReemplazado,
      destinatario: telefonoPrueba,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al enviar prueba' }, { status: 500 });
  }
}
