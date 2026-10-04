import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const folio = (formData.get('folio') as string) || '';
    const nss = (formData.get('nss') as string) || '';
    const reqKey = (formData.get('reqKey') as string) || '';
    const file = formData.get('file') as File | null;

    if (!folio.trim() || !nss.trim()) {
      return NextResponse.json(
        { error: 'Credenciales inválidas. El Folio y el NSS son obligatorios.' },
        { status: 400 }
      );
    }

    if (!reqKey.trim()) {
      return NextResponse.json(
        { error: 'Debe especificarse el tipo de documento a subir (reqKey).' },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { error: 'Debes seleccionar un archivo válido.' },
        { status: 400 }
      );
    }

    // Límite de tamaño: 20MB
    const MAX_SIZE_BYTES = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'El archivo excede el tamaño máximo permitido de 20MB.' },
        { status: 400 }
      );
    }

    const cleanFolio = folio.trim().toLowerCase();
    const cleanNss = nss.replace(/\D/g, '');

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar en las 3 tablas de trámites
    let tramite: any = null;
    let cliente: any = null;
    let tipoTramite: 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss' | null = null;
    let tablaTramite = '';

    const matchesFolio = (idStr: string) => {
      const tid = (idStr || '').toLowerCase();
      const tidNoHyphens = tid.replace(/-/g, '');
      const cleanNoHyphens = cleanFolio.replace(/-/g, '');
      return (
        tid === cleanFolio ||
        tid.startsWith(cleanFolio) ||
        tidNoHyphens.startsWith(cleanNoHyphens)
      );
    };

    // Buscar en Retiro por Desempleo
    const { data: retiroData } = await supabase
      .from('tramites_retiro_desempleo')
      .select('*, cliente:clientes(*)');

    if (retiroData) {
      const match = retiroData.find((t: any) => matchesFolio(t.id));
      if (match) {
        tramite = match;
        cliente = Array.isArray(match.cliente) ? match.cliente[0] : match.cliente;
        tipoTramite = 'retiro_desempleo';
        tablaTramite = 'tramites_retiro_desempleo';
      }
    }

    // Buscar en Mejoravit si no se encontró
    if (!tramite) {
      const { data: mejoravitData } = await supabase
        .from('tramites_mejoravit')
        .select('*, cliente:clientes(*)');

      if (mejoravitData) {
        const match = mejoravitData.find((t: any) => matchesFolio(t.id));
        if (match) {
          tramite = match;
          cliente = Array.isArray(match.cliente) ? match.cliente[0] : match.cliente;
          tipoTramite = 'mejoravit';
          tablaTramite = 'tramites_mejoravit';
        }
      }
    }

    // Buscar en Alta Médica IMSS si no se encontró
    if (!tramite) {
      const { data: altaMedicaData } = await supabase
        .from('tramites_alta_medica_imss')
        .select('*, cliente:clientes(*)');

      if (altaMedicaData) {
        const match = altaMedicaData.find((t: any) => matchesFolio(t.id));
        if (match) {
          tramite = match;
          cliente = Array.isArray(match.cliente) ? match.cliente[0] : match.cliente;
          tipoTramite = 'alta_medica_imss';
          tablaTramite = 'tramites_alta_medica_imss';
        }
      }
    }

    if (tramite && !cliente && tramite.cliente_id) {
      const { data: cliData } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', tramite.cliente_id)
        .single();
      if (cliData) {
        cliente = cliData;
      }
    }

    if (!tramite || !cliente) {
      return NextResponse.json(
        { error: 'No se encontró ningún expediente con el folio especificado.' },
        { status: 404 }
      );
    }

    // 2. Validar autenticación con NSS
    const dbNssClean = (cliente.nss || tramite.nss_portal_infonavit || '').replace(/\D/g, '');
    if (!dbNssClean || dbNssClean !== cleanNss) {
      return NextResponse.json(
        { error: 'El Número de Seguridad Social (NSS) no coincide con el expediente.' },
        { status: 401 }
      );
    }

    // 3. Procesar y subir archivo a Supabase Storage
    const rawExt = file.name.split('.').pop() || 'pdf';
    const ext = rawExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const timestamp = Date.now();
    const storagePath = `${cliente.id}/${tipoTramite}/${tramite.id}/${reqKey}_${timestamp}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from('ine_documents')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      });

    if (uploadError) {
      console.error('Error al subir documento a Supabase Storage:', uploadError);
      return NextResponse.json(
        { error: `Error al almacenar el archivo: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from('ine_documents')
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // 4. Actualizar tabla de Trámites
    const currentTramiteDocs = tramite.documentos_urls || {};
    const updatedTramiteDocs = { ...currentTramiteDocs, [reqKey]: publicUrl };

    const tramiteUpdatePayload: Record<string, any> = {
      [reqKey]: true,
      documentos_urls: updatedTramiteDocs,
      updated_at: new Date().toISOString(),
    };

    const { error: tramiteUpdateErr } = await supabase
      .from(tablaTramite)
      .update(tramiteUpdatePayload)
      .eq('id', tramite.id);

    if (tramiteUpdateErr) {
      console.error('Error al actualizar registro de trámite:', tramiteUpdateErr);
      return NextResponse.json(
        { error: `Error al registrar el documento en el expediente: ${tramiteUpdateErr.message}` },
        { status: 500 }
      );
    }

    // 5. Actualizar registro de Cliente (documentos_urls y atajos directos)
    const currentCliDocs = cliente.documentos_urls || {};
    const clientUpdates: Record<string, any> = {
      documentos_urls: { ...currentCliDocs, [reqKey]: publicUrl },
      updated_at: new Date().toISOString(),
    };

    if (['req_ine_vigente', 'req_ine_normal', 'req_identificacion_oficial'].includes(reqKey)) {
      clientUpdates.ine_completa_url = publicUrl;
    }
    if (['req_curp', 'req_curp_actualizada', 'req_curp_validada'].includes(reqKey)) {
      clientUpdates.curp_document_url = publicUrl;
    }

    await supabase
      .from('clientes')
      .update(clientUpdates)
      .eq('id', cliente.id);

    return NextResponse.json({
      success: true,
      message: 'Documento subido y registrado exitosamente.',
      url: publicUrl,
      reqKey,
      updated_at: tramiteUpdatePayload.updated_at,
    });
  } catch (error: any) {
    console.error('Error en api/seguimiento/subir-documento:', error);
    return NextResponse.json(
      { error: error.message || 'Error inesperado al subir el documento.' },
      { status: 500 }
    );
  }
}
