import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// GET: Obtener todas las solicitudes registradas
export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tramite = searchParams.get('tramite');

    let query = supabase
      .from('solicitudes_contacto')
      .select('*')
      .order('created_at', { ascending: false });

    if (estado && estado !== 'todos') {
      query = query.eq('estado', estado);
    }
    if (tramite && tramite !== 'todos') {
      query = query.eq('tramite_interes', tramite);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ solicitudes: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error del servidor' }, { status: 500 });
  }
}

// POST: Registrar una nueva solicitud desde la Landing Page
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, telefono, email, estadoRepublica, tramiteInteres, mensaje } = body;

    if (!nombre || !telefono || !tramiteInteres) {
      return NextResponse.json(
        { error: 'El nombre, teléfono y trámite de interés son obligatorios.' },
        { status: 400 }
      );
    }

    // Limpiar teléfono
    const cleanPhone = telefono.replace(/\D/g, '');

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('solicitudes_contacto')
      .insert({
        nombre: nombre.trim(),
        telefono: cleanPhone,
        email: email ? email.trim() : null,
        estado_republica: estadoRepublica || 'Ciudad de México',
        tramite_interes: tramiteInteres,
        mensaje: mensaje ? mensaje.trim() : null,
        estado: 'pendiente',
      })
      .select()
      .single();

    if (error) {
      console.error('Error insertando solicitud en Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, solicitud: data });
  } catch (err: any) {
    console.error('Error en POST /api/solicitudes:', err);
    return NextResponse.json({ error: err?.message || 'Error del servidor' }, { status: 500 });
  }
}

// PATCH: Actualizar estado o notas de una solicitud
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, estado, notas_admin, cliente_id } = body;

    if (!id) {
      return NextResponse.json({ error: 'El ID de la solicitud es requerido.' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (estado !== undefined) updates.estado = estado;
    if (notas_admin !== undefined) updates.notas_admin = notas_admin;
    if (cliente_id !== undefined) updates.cliente_id = cliente_id;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('solicitudes_contacto')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, solicitud: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error del servidor' }, { status: 500 });
  }
}

// DELETE: Eliminar una solicitud
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'El ID es obligatorio.' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('solicitudes_contacto')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error del servidor' }, { status: 500 });
  }
}
