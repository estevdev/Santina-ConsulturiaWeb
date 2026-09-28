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

    const supabase = getSupabase();

    // 1. Intentar registrar el usuario en Supabase Auth
    let authUserId: string | null = null;
    if (password && password.length >= 6) {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            name: name?.trim() || email.split('@')[0],
            role: role || 'socios',
          },
        },
      });

      if (authErr) {
        console.warn('Advertencia en signUp:', authErr.message);
      } else if (authData.user) {
        authUserId = authData.user.id;
      }
    }

    // 2. Asegurar el registro en la tabla profiles
    const newId = authUserId || crypto.randomUUID();

    const { data: insertedProfile, error: insertErr } = await supabase
      .from('profiles')
      .upsert({
        id: newId,
        email: email.trim().toLowerCase(),
        name: name?.trim() || email.split('@')[0],
        role: role || 'socios',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ profile: insertedProfile, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, role, email } = body;

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

    return NextResponse.json({ profile: updated, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al actualizar usuario' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido.' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error al eliminar usuario' }, { status: 500 });
  }
}
