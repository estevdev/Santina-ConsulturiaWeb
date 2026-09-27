import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { tramiteId, folio, subscription } = await req.json();

    if (!tramiteId || !subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Tramite ID y datos de suscripción requeridos.' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        tramite_id: tramiteId,
        folio: folio || tramiteId.substring(0, 8).toUpperCase(),
        endpoint: subscription.endpoint,
        subscription_data: subscription,
      })
      .select();

    if (error) {
      console.error('Error guardando suscripción push:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.[0]?.id });
  } catch (error: any) {
    console.error('Error en subscribe-push:', error);
    return NextResponse.json(
      { error: error.message || 'Error al guardar la suscripción' },
      { status: 500 }
    );
  }
}
