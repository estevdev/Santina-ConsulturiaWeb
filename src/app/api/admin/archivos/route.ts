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

const STORAGE_BUCKET = 'ine_documents';

// Mapeo amigable para claves de requisitos
const DOC_LABEL_MAP: Record<string, string> = {
  curp: 'CURP Certificada',
  curp_document_url: 'CURP Certificada',
  req_curp: 'CURP Certificada',
  req_curp_actualizada: 'CURP Actualizada',
  req_curp_validada: 'CURP Validada IMSS',
  ine_normal: 'INE Normal (Frente y Reverso)',
  req_ine_normal: 'INE Normal (Frente y Reverso)',
  ine_completa_url: 'INE Completa Oficial',
  ine_completa: 'INE Completa Oficial',
  ine_frente_url: 'INE Frente',
  ine_frente: 'INE Frente',
  ine_reverso_url: 'INE Reverso',
  ine_reverso: 'INE Reverso',
  req_ine_ampliada_200: 'INE Ampliada al 200%',
  req_ine_vigente: 'INE Vigente (Escaneo a Color)',
  req_acta_nacimiento: 'Acta de Nacimiento Certificada',
  acta_nacimiento: 'Acta de Nacimiento',
  req_comprobante_domicilio: 'Comprobante de Domicilio',
  req_comprobante_domicilio_reciente: 'Comprobante de Domicilio Reciente',
  comprobante_domicilio: 'Comprobante de Domicilio',
  comprobante_familiar_anexo_acta: 'Comprobante Familiar Anexo a Acta',
  req_estado_cuenta_bancario: 'Estado de Cuenta Bancario',
  estado_cuenta_bancario: 'Estado de Cuenta Bancario',
  req_constancia_situacion_fiscal: 'Constancia Situación Fiscal (SAT)',
  constancia_situacion_fiscal: 'Constancia Situación Fiscal (SAT)',
  req_reporte_semanas_imss: 'Reporte de Semanas Cotizadas IMSS',
  reporte_semanas_imss: 'Reporte de Semanas Cotizadas IMSS',
  req_anexo_sindo: 'Anexo SINDO IMSS',
  req_fotos_inmueble_5: 'Fotografías del Inmueble (5 Fotos)',
  fotos_inmueble: 'Fotografías del Inmueble',
  comprobante_cita_infonavit: 'Comprobante de Cita CESI / Infonavit',
  comprobante_cita: 'Comprobante de Cita',
  solicitud_inscripcion: 'Solicitud de Inscripción Crédito',
  solicitud_inscripcion_llenado: 'Solicitud de Inscripción (Llenada)',
  solicitud_inscripcion_borrador: 'Solicitud de Inscripción (Borrador)',
  solicitud_inscripcion_blanco: 'Solicitud de Inscripción (En Blanco)',
  carta_bajo_protesta: 'Carta Bajo Protesta',
  carta_bajo_protesta_llenado: 'Carta Bajo Protesta (Llenada)',
  carta_bajo_protesta_borrador: 'Carta Bajo Protesta (Borrador)',
  carta_bajo_protesta_blanco: 'Carta Bajo Protesta (En Blanco)',
  presupuesto_obra: 'Presupuesto de Obra',
  presupuesto_obra_llenado: 'Presupuesto de Obra (Llenado)',
  presupuesto_obra_borrador: 'Presupuesto de Obra (Borrador)',
  presupuesto_obra_blanco: 'Presupuesto de Obra (En Blanco)',
  tabla_amortizacion: 'Tabla de Amortización',
  expediente_documentos: 'Expediente Completo Documentos',
  expediente_borradores: 'Expediente Borradores de Trabajo',
  expediente_formato_blanco: 'Expediente Formatos en Blanco',
  req_identificacion_oficial: 'Identificación Oficial Vigente',
  req_fotografia_infantil: 'Fotografía Tamaño Infantil',
  req_cartilla_nacional_salud: 'Cartilla Nacional de Salud',
  req_alta_patronal_vigente: 'Alta Patronal Vigente',
};

function formatSize(bytes?: number): string {
  if (!bytes || isNaN(bytes) || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function cleanDisplayName(fileName: string, key?: string): string {
  if (key && DOC_LABEL_MAP[key]) {
    return DOC_LABEL_MAP[key];
  }
  // Remove leading timestamp like 1791139801197_
  let clean = fileName.replace(/^\d{10,14}_/, '');
  // Remove extension
  clean = clean.replace(/\.[^/.]+$/, '');
  // Replace underscores and dashes with spaces
  clean = clean.replace(/[_-]+/g, ' ').trim();
  // Capitalize words
  return clean.replace(/\b\w/g, (char) => char.toUpperCase());
}

async function listStorageFolderRecursively(
  supabase: any,
  bucket: string,
  prefix: string
): Promise<any[]> {
  const allFiles: any[] = [];

  async function recurse(path: string) {
    const { data, error } = await supabase.storage.from(bucket).list(path, { limit: 100 });
    if (error || !data) return;

    for (const item of data) {
      const fullPath = path ? `${path}/${item.name}` : item.name;

      if (item.metadata && (item.metadata.mimetype || item.metadata.size !== undefined)) {
        allFiles.push({
          name: item.name,
          path: fullPath,
          size: item.metadata.size || 0,
          mimetype: item.metadata.mimetype || 'application/octet-stream',
          updated_at: item.updated_at || item.created_at || new Date().toISOString(),
          created_at: item.created_at || item.updated_at || new Date().toISOString(),
        });
      } else if (!item.id && !item.metadata) {
        // Carpeta
        await recurse(fullPath);
      } else {
        // Fallback para archivos sin metadatos explícitos
        if (item.name.includes('.')) {
          allFiles.push({
            name: item.name,
            path: fullPath,
            size: item.metadata?.size || 0,
            mimetype: item.metadata?.mimetype || 'application/octet-stream',
            updated_at: item.updated_at || item.created_at || new Date().toISOString(),
            created_at: item.created_at || item.updated_at || new Date().toISOString(),
          });
        } else {
          await recurse(fullPath);
        }
      }
    }
  }

  await recurse(prefix);
  return allFiles;
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const targetClienteId = searchParams.get('clienteId');

    // 1. Obtener clientes
    let clientQuery = supabase.from('clientes').select('*');
    if (targetClienteId) {
      clientQuery = clientQuery.eq('id', targetClienteId);
    } else {
      clientQuery = clientQuery.order('nombre', { ascending: true });
    }

    const [clientesRes, retiroRes, mejoravitRes, altaMedicaRes] = await Promise.all([
      clientQuery,
      supabase.from('tramites_retiro_desempleo').select('id, cliente_id, documentos_urls'),
      supabase.from('tramites_mejoravit').select('id, cliente_id, documentos_urls, fotos_inmueble_urls'),
      supabase.from('tramites_alta_medica_imss').select('id, cliente_id, documentos_urls'),
    ]);

    if (clientesRes.error) {
      return NextResponse.json({ error: clientesRes.error.message }, { status: 500 });
    }

    const rawClientes = clientesRes.data || [];

    // Mapas auxiliares para trámites y folios
    const foliosByClient: Record<string, string[]> = {};
    const tramitesByClient: Record<string, string[]> = {};
    const annexedDocsByClient: Record<string, Record<string, string>> = {};

    const registerClientDoc = (clienteId: string, key: string, url: string) => {
      if (!clienteId || !url || typeof url !== 'string') return;
      if (!annexedDocsByClient[clienteId]) annexedDocsByClient[clienteId] = {};
      annexedDocsByClient[clienteId][key] = url;
    };

    (retiroRes.data || []).forEach((r: any) => {
      if (r.cliente_id) {
        if (!foliosByClient[r.cliente_id]) foliosByClient[r.cliente_id] = [];
        const short = r.id.substring(0, 8).toUpperCase();
        if (!foliosByClient[r.cliente_id].includes(short)) foliosByClient[r.cliente_id].push(short);

        if (!tramitesByClient[r.cliente_id]) tramitesByClient[r.cliente_id] = [];
        if (!tramitesByClient[r.cliente_id].includes('Retiro AFORE')) tramitesByClient[r.cliente_id].push('Retiro AFORE');

        if (r.documentos_urls && typeof r.documentos_urls === 'object') {
          Object.entries(r.documentos_urls).forEach(([k, u]) => registerClientDoc(r.cliente_id, k, u as string));
        }
      }
    });

    (mejoravitRes.data || []).forEach((m: any) => {
      if (m.cliente_id) {
        if (!foliosByClient[m.cliente_id]) foliosByClient[m.cliente_id] = [];
        const short = m.id.substring(0, 8).toUpperCase();
        if (!foliosByClient[m.cliente_id].includes(short)) foliosByClient[m.cliente_id].push(short);

        if (!tramitesByClient[m.cliente_id]) tramitesByClient[m.cliente_id] = [];
        if (!tramitesByClient[m.cliente_id].includes('Mejoravit')) tramitesByClient[m.cliente_id].push('Mejoravit');

        if (m.documentos_urls && typeof m.documentos_urls === 'object') {
          Object.entries(m.documentos_urls).forEach(([k, u]) => registerClientDoc(m.cliente_id, k, u as string));
        }
        if (Array.isArray(m.fotos_inmueble_urls)) {
          m.fotos_inmueble_urls.forEach((u: string, idx: number) => {
            registerClientDoc(m.cliente_id, `fotos_inmueble_${idx + 1}`, u);
          });
        }
      }
    });

    (altaMedicaRes.data || []).forEach((a: any) => {
      if (a.cliente_id) {
        if (!foliosByClient[a.cliente_id]) foliosByClient[a.cliente_id] = [];
        const short = a.id.substring(0, 8).toUpperCase();
        if (!foliosByClient[a.cliente_id].includes(short)) foliosByClient[a.cliente_id].push(short);

        if (!tramitesByClient[a.cliente_id]) tramitesByClient[a.cliente_id] = [];
        if (!tramitesByClient[a.cliente_id].includes('Alta IMSS')) tramitesByClient[a.cliente_id].push('Alta IMSS');

        if (a.documentos_urls && typeof a.documentos_urls === 'object') {
          Object.entries(a.documentos_urls).forEach(([k, u]) => registerClientDoc(a.cliente_id, k, u as string));
        }
      }
    });

    // Procesar cada cliente y sus archivos de storage
    const clientFolders = await Promise.all(
      rawClientes.map(async (c: any) => {
        // Integrar documentos oficiales registrados en la tabla clientes
        if (c.ine_completa_url) registerClientDoc(c.id, 'ine_completa_url', c.ine_completa_url);
        if (c.ine_frente_url) registerClientDoc(c.id, 'ine_frente_url', c.ine_frente_url);
        if (c.ine_reverso_url) registerClientDoc(c.id, 'ine_reverso_url', c.ine_reverso_url);
        if (c.curp_document_url) registerClientDoc(c.id, 'curp_document_url', c.curp_document_url);
        if (c.documentos_urls && typeof c.documentos_urls === 'object') {
          Object.entries(c.documentos_urls).forEach(([k, u]) => registerClientDoc(c.id, k, u as string));
        }

        const clientAnnexedMap = annexedDocsByClient[c.id] || {};

        // Escanear storage para este cliente
        const rawStorageFiles = await listStorageFolderRecursively(supabase, STORAGE_BUCKET, c.id);

        const seenUrls = new Set<string>();
        const seenNames = new Set<string>();
        const archivos: any[] = [];
        const subfolderSet = new Set<string>();

        // 1. Mapear archivos encontrados en Storage
        for (const sf of rawStorageFiles) {
          const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(sf.path).data.publicUrl;
          seenUrls.add(publicUrl);
          seenNames.add(sf.name);

          // Determinar subcarpeta
          const pathParts = sf.path.split('/');
          // [clientId, folder?, subfolder?, filename]
          const subfolder = pathParts.length > 2 ? pathParts.slice(1, -1).join('/') : 'Raíz';
          subfolderSet.add(subfolder);

          // Determinar si está anexado al expediente oficial
          let isAnexado = false;
          let matchedKey: string | undefined = undefined;

          for (const [docKey, docUrl] of Object.entries(clientAnnexedMap)) {
            if (typeof docUrl === 'string') {
              if (
                docUrl.includes(sf.name) ||
                sf.path.includes(docUrl) ||
                decodeURIComponent(docUrl).includes(sf.name) ||
                publicUrl.includes(docUrl) ||
                docUrl.includes(publicUrl)
              ) {
                isAnexado = true;
                matchedKey = docKey;
                break;
              }
            }
          }

          const ext = sf.name.split('.').pop()?.toLowerCase() || '';
          const isPdf = ext === 'pdf' || sf.mimetype === 'application/pdf';
          const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) || sf.mimetype.startsWith('image/');

          archivos.push({
            id: sf.path,
            name: sf.name,
            displayName: cleanDisplayName(sf.name, matchedKey),
            path: sf.path,
            url: publicUrl,
            size: sf.size,
            sizeFormatted: formatSize(sf.size),
            mimetype: sf.mimetype,
            extension: ext,
            isImage,
            isPdf,
            createdAt: sf.created_at,
            updatedAt: sf.updated_at,
            folder: subfolder,
            isAnexado,
            anexadoKey: matchedKey,
            anexadoLabel: matchedKey ? (DOC_LABEL_MAP[matchedKey] || cleanDisplayName(sf.name, matchedKey)) : undefined,
          });
        }

        // 2. Revisar si hay documentos anexados en la BD que no estaban directamente en storage list
        // (p.ej. URLs externas o de otro origen) para que nunca falte un documento del expediente
        for (const [docKey, docUrl] of Object.entries(clientAnnexedMap)) {
          if (typeof docUrl === 'string' && docUrl.startsWith('http')) {
            const fileNameFromUrl = docUrl.split('/').pop()?.split('?')[0] || `${docKey}.pdf`;
            const alreadyPresent = archivos.some(
              (a) => a.url === docUrl || a.name === fileNameFromUrl || (a.isAnexado && a.anexadoKey === docKey)
            );

            if (!alreadyPresent) {
              const ext = fileNameFromUrl.split('.').pop()?.toLowerCase() || 'pdf';
              const isPdf = ext === 'pdf';
              const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext);

              archivos.push({
                id: `db_${docKey}_${c.id}`,
                name: fileNameFromUrl,
                displayName: DOC_LABEL_MAP[docKey] || cleanDisplayName(fileNameFromUrl, docKey),
                path: `${c.id}/${fileNameFromUrl}`,
                url: docUrl,
                size: 0,
                sizeFormatted: 'Expediente BD',
                mimetype: isPdf ? 'application/pdf' : isImage ? 'image/png' : 'application/octet-stream',
                extension: ext,
                isImage,
                isPdf,
                createdAt: c.created_at || new Date().toISOString(),
                updatedAt: c.updated_at || new Date().toISOString(),
                folder: 'Expediente Digital',
                isAnexado: true,
                anexadoKey: docKey,
                anexadoLabel: DOC_LABEL_MAP[docKey] || cleanDisplayName(fileNameFromUrl, docKey),
              });
            }
          }
        }

        // Ordenar archivos: primero Anexados, luego por fecha más reciente
        archivos.sort((a, b) => {
          if (a.isAnexado && !b.isAnexado) return -1;
          if (!a.isAnexado && b.isAnexado) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });

        const totalArchivos = archivos.length;
        const totalAnexados = archivos.filter((a) => a.isAnexado).length;
        const totalAdicionales = totalArchivos - totalAnexados;

        const mainFolio = c.id ? c.id.substring(0, 8).toUpperCase() : '';
        const allFolios = Array.from(new Set([mainFolio, ...(foliosByClient[c.id] || [])])).filter(Boolean);

        const fullName = [c.nombre, c.apellido_paterno || c.apellidos, c.apellido_materno]
          .filter(Boolean)
          .join(' ')
          .trim();

        return {
          id: c.id,
          nombre: c.nombre || '',
          apellidos: [c.apellido_paterno || c.apellidos, c.apellido_materno].filter(Boolean).join(' '),
          nombreCompleto: fullName || 'Sin Nombre',
          folio: mainFolio,
          folios: allFolios,
          nss: c.nss || '',
          curp: c.curp || '',
          telefono: c.telefono || '',
          email: c.email || '',
          tramites: tramitesByClient[c.id] || [],
          createdAt: c.created_at,
          totalArchivos,
          totalAnexados,
          totalAdicionales,
          subfolders: Array.from(subfolderSet),
          archivos,
        };
      })
    );

    // Calcular estadísticas globales
    const totalClientes = clientFolders.length;
    const totalArchivosGlobal = clientFolders.reduce((acc, c) => acc + c.totalArchivos, 0);
    const totalAnexadosGlobal = clientFolders.reduce((acc, c) => acc + c.totalAnexados, 0);
    const totalAdicionalesGlobal = totalArchivosGlobal - totalAnexadosGlobal;

    return NextResponse.json({
      success: true,
      stats: {
        totalClientes,
        totalArchivos: totalArchivosGlobal,
        totalAnexados: totalAnexadosGlobal,
        totalAdicionales: totalAdicionalesGlobal,
      },
      clients: clientFolders,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/archivos GET:', err);
    return NextResponse.json({ error: err?.message || 'Error del servidor' }, { status: 500 });
  }
}

// Subir archivo adicional al folder del cliente
export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const formData = await req.formData();
    const clienteId = formData.get('clienteId') as string;
    const folder = (formData.get('folder') as string) || 'archivos_adicionales';
    const file = formData.get('file') as File;

    if (!clienteId || !file) {
      return NextResponse.json({ error: 'Faltan parámetros (clienteId, file)' }, { status: 400 });
    }

    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${clienteId}/${folder}/${Date.now()}_${cleanFileName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const publicUrl = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;

    return NextResponse.json({
      success: true,
      file: {
        path: storagePath,
        url: publicUrl,
        name: cleanFileName,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/archivos POST:', err);
    return NextResponse.json({ error: err?.message || 'Error del servidor' }, { status: 500 });
  }
}

// Eliminar archivo de storage
export async function DELETE(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { path } = body;

    if (!path) {
      return NextResponse.json({ error: 'Se requiere la ruta del archivo (path)' }, { status: 400 });
    }

    const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error in /api/admin/archivos DELETE:', err);
    return NextResponse.json({ error: err?.message || 'Error del servidor' }, { status: 500 });
  }
}
