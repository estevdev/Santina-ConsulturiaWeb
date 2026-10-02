import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET() {
  try {
    const supabase = getSupabase();

    // Consultar todos los perfiles de usuarios registrados
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    return NextResponse.json({ profiles: profiles || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'El correo electrónico es requerido y debe ser válido.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Invocar la función RPC admin_create_user
    const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_create_user', {
      p_email: email.trim().toLowerCase(),
      p_password: password,
      p_name: name?.trim() || email.split('@')[0],
      p_role: role || 'socios',
    });

    if (rpcErr) {
      return NextResponse.json({ error: rpcErr.message }, { status: 500 });
    }

    if (rpcData && rpcData.success === false) {
      return NextResponse.json({ error: rpcData.error || 'Error al crear usuario' }, { status: 400 });
    }

    const userId = rpcData?.user_id;

    // 2. Obtener el perfil recién creado
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    return NextResponse.json({ profile, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, role, email, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido.' }, { status: 400 });
    }

    const supabase = getSupabase();

    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    if (name !== undefined) updates.name = name.trim();
    if (role !== undefined) updates.role = role;
    if (email !== undefined) updates.email = email.trim().toLowerCase();

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si también se envió una contraseña nueva en el PUT
    if (password && password.length >= 6) {
      const { error: pwdErr } = await supabase.rpc('admin_change_user_password', {
        target_user_id: id,
        new_password: password,
      });
      if (pwdErr) {
        console.warn('Error al actualizar contraseña en PUT:', pwdErr.message);
      }
    }

    return NextResponse.json({ profile: updated, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, password } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data, error } = await supabase.rpc('admin_change_user_password', {
      target_user_id: id,
      new_password: password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (data && data.success === false) {
      return NextResponse.json({ error: data.error || 'No se pudo actualizar la contraseña' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Contraseña actualizada exitosamente' });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al actualizar contraseña' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    let id: string | null = null;
    const { searchParams } = new URL(req.url);
    id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id || null;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido.' }, { status: 400 });
    }

    const supabase = getSupabase();

    // 1. Eliminar mediante función RPC (elimina de auth.users y cascada a profiles)
    const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_delete_user', {
      target_user_id: id,
    });

    if (rpcErr || (rpcData && rpcData.success === false)) {
      console.warn('Aviso en RPC admin_delete_user:', rpcErr?.message || rpcData?.error);
      // Fallback: eliminar directamente de profiles
      const { error: profileErr } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (profileErr) {
        return NextResponse.json({ error: profileErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al eliminar usuario' }, { status: 500 });
  }
}
