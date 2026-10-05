import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppClienteStatusUpdate, sendWhatsAppTextMessage, formatFolio } from '@/utils/whatsapp';
import { getEstadoClienteConfig } from '@/constants/estadosCliente';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clienteId, nuevoEstado, folio, tramiteTipo, observaciones } = body;

    if (!clienteId || !nuevoEstado) {
      return NextResponse.json(
        { error: 'clienteId y nuevoEstado son requeridos.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // 1. Obtener datos del cliente
    const { data: cliente, error: cliErr } = await supabase
      .from('clientes')
      .select('id, nombre, apellido_paterno, apellido_materno, telefono, estado_cliente')
      .eq('id', clienteId)
      .single();

    if (cliErr || !cliente) {
      return NextResponse.json(
        { error: 'Cliente no encontrado en la base de datos.' },
        { status: 404 }
      );
    }

    if (!cliente.telefono || cliente.telefono.trim() === '') {
      return NextResponse.json({
        success: false,
        reason: 'NO_PHONE',
        warning: `El cliente "${cliente.nombre}" no tiene un número de teléfono registrado.`,
      });
    }

    // 2. Resolver Folio y Trámite con certeza (siempre código limpio de 8 caracteres)
    let resolvedFolio = formatFolio(folio);
    let resolvedTramite = (tramiteTipo && tramiteTipo !== 'Trámite') ? tramiteTipo : '';

    // Si falta el folio o el tipo de trámite, consultar las tablas de trámites
    if (!resolvedFolio || !resolvedTramite) {
      const [retiro, mejoravit, alta] = await Promise.all([
        supabase.from('tramites_retiro_desempleo').select('id').eq('cliente_id', clienteId),
        supabase.from('tramites_mejoravit').select('id').eq('cliente_id', clienteId),
        supabase.from('tramites_alta_medica_imss').select('id').eq('cliente_id', clienteId),
      ]);

      const altasList = alta.data || [];
      const mejoravitList = mejoravit.data || [];
      const retiroList = retiro.data || [];

      // Si ya teníamos un folio específico, buscar cuál trámite coincide
      if (resolvedFolio) {
        if (altasList.some((a: any) => formatFolio(a.id) === resolvedFolio)) {
          resolvedTramite = 'Alta Médica IMSS';
        } else if (mejoravitList.some((m: any) => formatFolio(m.id) === resolvedFolio)) {
          resolvedTramite = 'Crédito Mejoravit';
        } else if (retiroList.some((r: any) => formatFolio(r.id) === resolvedFolio)) {
          resolvedTramite = 'Retiro por Desempleo';
        }
      }

      // Si aún no está resuelto el tipo de trámite o el folio, tomar el primer trámite existente
      if (!resolvedTramite || !resolvedFolio) {
        if (altasList.length > 0) {
          if (!resolvedFolio) resolvedFolio = formatFolio(altasList[0].id);
          if (!resolvedTramite) resolvedTramite = 'Alta Médica IMSS';
        } else if (mejoravitList.length > 0) {
          if (!resolvedFolio) resolvedFolio = formatFolio(mejoravitList[0].id);
          if (!resolvedTramite) resolvedTramite = 'Crédito Mejoravit';
        } else if (retiroList.length > 0) {
          if (!resolvedFolio) resolvedFolio = formatFolio(retiroList[0].id);
          if (!resolvedTramite) resolvedTramite = 'Retiro por Desempleo';
        }
      }
    }

    // Fallback de folio si el cliente aún no tiene trámites creados
    if (!resolvedFolio) {
      resolvedFolio = formatFolio(cliente.id);
    }

    const statusConfig = getEstadoClienteConfig(nuevoEstado);
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido_paterno || ''}`.trim();

    // 3. Revisar si hay una plantilla configurada en la base de datos
    const templateId = `cliente_${nuevoEstado}`;
    const { data: dbTemplate } = await supabase
      .from('configuraciones_mensajes')
      .select('mensaje, activo')
      .eq('id', templateId)
      .single();

    if (dbTemplate && dbTemplate.activo === false) {
      return NextResponse.json({
        success: false,
        reason: 'MUTED',
        warning: `El envío de WhatsApp para el estado "${statusConfig.label}" está pausado en Configuración Global.`,
      });
    }

    let waResult;
    if (dbTemplate?.mensaje) {
      const primerNombre = (cliente.nombre || 'Cliente').split(' ')[0];
      const tramiteLabel = resolvedTramite && resolvedTramite !== 'Trámite' ? resolvedTramite : '';

      let mensajeRenderizado = dbTemplate.mensaje
        .replace(/\{\{nombre\}\}/g, primerNombre)
        .replace(/\{\{folio\}\}/g, resolvedFolio || 'N/A')
        .replace(/\{\{estado\}\}/g, statusConfig.label)
        .replace(/\{\{observaciones\}\}/g, observaciones || '');

      // Manejo inteligente de {{tramite}} para evitar "de Trámite", "de  " o "de "
      if (tramiteLabel) {
        mensajeRenderizado = mensajeRenderizado.replace(/\{\{tramite\}\}/g, tramiteLabel);
      } else {
        mensajeRenderizado = mensajeRenderizado
          .replace(/de \*?\{\{tramite\}\}\*?\s*/gi, '')
          .replace(/\(\*?\{\{tramite\}\}\*?,?\s*/gi, '(')
          .replace(/\{\{tramite\}\}/g, 'Trámite');
      }

      waResult = await sendWhatsAppTextMessage({
        to: cliente.telefono,
        message: mensajeRenderizado,
      });
    } else {
      waResult = await sendWhatsAppClienteStatusUpdate({
        telefono: cliente.telefono,
        nombreCliente: nombreCompleto,
        nuevoEstado,
        estadoLabel: statusConfig.label,
        folio: resolvedFolio,
        tipoTramite: resolvedTramite || undefined,
        observaciones,
      });
    }

    if (!waResult.success) {
      return NextResponse.json({
        success: false,
        error: waResult.error,
        metaErrorCode: waResult.metaErrorCode,
        details: waResult.details,
      });
    }

    return NextResponse.json({
      success: true,
      messageId: waResult.messageId,
      cliente: nombreCompleto,
      telefono: cliente.telefono,
      nuevoEstado: statusConfig.label,
      folio: resolvedFolio,
      tramite: resolvedTramite,
    });
  } catch (error: any) {
    console.error('Error en /api/whatsapp/notificar-estado:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar notificación de WhatsApp' },
      { status: 500 }
    );
  }
}
