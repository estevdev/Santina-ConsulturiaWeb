import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de cliente requerido' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isUuid) {
      return NextResponse.json({ error: 'ID de cliente inválido' }, { status: 404 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cliente, error } = await supabase
      .from('clientes')
      .select('id, nombre, apellido_paterno, apellido_materno, apellidos, curp, ine_completa_url, ine_frente_url, ine_reverso_url')
      .eq('id', id)
      .maybeSingle();

    if (error || !cliente) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const fullApellidos = [cliente.apellido_paterno, cliente.apellido_materno].filter(Boolean).join(' ') || cliente.apellidos || '';

    return NextResponse.json({
      id: cliente.id,
      nombre: cliente.nombre,
      apellidos: fullApellidos,
      curp: cliente.curp,
      hasCompletedScan: !!cliente.ine_completa_url,
      ineCompletaUrl: cliente.ine_completa_url,
    });
  } catch (error: any) {
    console.error('Error en /api/scan-ine/info:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
