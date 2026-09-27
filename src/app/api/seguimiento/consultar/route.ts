import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const { folio, nss } = await req.json();

    if (!folio || !nss) {
      return NextResponse.json(
        { error: 'El número de folio y el Número de Seguridad Social (NSS) son obligatorios.' },
        { status: 400 }
      );
    }

    const cleanFolio = folio.trim().toLowerCase();
    const cleanNss = nss.replace(/\D/g, ''); // Solo dígitos

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Buscar en las 3 tablas de trámites
    let tramite: any = null;
    let cliente: any = null;
    let tipoTramite: 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss' | null = null;

    // Helper para verificar coincidencia de folio (UUID completo o primeros 8 caracteres)
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
        }
      }
    }

    // Si se encontró el trámite pero la relación cliente falló, buscar directamente en clientes
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
        { error: 'No se encontró ningún trámite con el número de folio proporcionado.' },
        { status: 404 }
      );
    }

    // 2. Validar NSS como Contraseña (revisar en cliente.nss o en tramite.nss_portal_infonavit)
    const dbNssClean = (cliente.nss || tramite.nss_portal_infonavit || '').replace(/\D/g, '');
    if (!dbNssClean || dbNssClean !== cleanNss) {
      return NextResponse.json(
        { error: 'El Número de Seguridad Social (NSS) no coincide con el folio ingresado.' },
        { status: 401 }
      );
    }

    // Sincronizar automáticamente cliente.nss si estaba nulo en la tabla de clientes
    if (!cliente.nss && tramite.nss_portal_infonavit) {
      await supabase.from('clientes').update({ nss: tramite.nss_portal_infonavit }).eq('id', cliente.id);
    }

    // 3. Estructurar Línea de Tiempo de Pasos según Tipo de Trámite
    let pasos: Array<{
      id: string;
      titulo: string;
      descripcion: string;
      completado: boolean;
      estadoPaso: 'completado' | 'en_proceso' | 'pendiente';
    }> = [];

    let tipoNombre = '';

    if (tipoTramite === 'retiro_desempleo') {
      tipoNombre = 'Retiro por Desempleo AFORE';
      const rawPasos = [
        {
          id: 'validado_inactivo_imss',
          titulo: 'Validación de Baja / Inactividad en IMSS',
          descripcion: 'Verificación oficial de no contar con patrón activo registrado ante el IMSS.',
          val: tramite.validado_inactivo_imss,
        },
        {
          id: 'req_ine_vigente',
          titulo: 'Identificación Oficial (INE) Vigente',
          descripcion: 'Verificación y digitalización a color de la credencial para votar vigente.',
          val: tramite.req_ine_vigente,
        },
        {
          id: 'req_comprobante_domicilio',
          titulo: 'Comprobante de Domicilio Reciente',
          descripcion: 'Comprobante de servicio (luz, agua o predial) no mayor a 3 meses.',
          val: tramite.req_comprobante_domicilio,
        },
        {
          id: 'req_curp',
          titulo: 'CURP Certificada Actualizada',
          descripcion: 'Validación e impresión oficial de la CURP certificada en RENAPO.',
          val: tramite.req_curp,
        },
        {
          id: 'req_constancia_situacion_fiscal',
          titulo: 'Constancia de Situación Fiscal (SAT)',
          descripcion: 'Verificación de RFC y datos fiscales actualizados ante el SAT.',
          val: tramite.req_constancia_situacion_fiscal,
        },
        {
          id: 'req_reporte_semanas_imss',
          titulo: 'Reporte de Semanas Cotizadas IMSS',
          descripcion: 'Emisión del reporte oficial de semanas cotizadas y trayectoria laboral.',
          val: tramite.req_reporte_semanas_imss,
        },
        {
          id: 'req_app_aforemovil_instalada',
          titulo: 'Aplicación AforeMóvil Instalada',
          descripcion: 'Descarga e instalación de la aplicación oficial AforeMóvil en el dispositivo.',
          val: tramite.req_app_aforemovil_instalada,
        },
        {
          id: 'req_registro_aforemovil_realizado',
          titulo: 'Registro y Enrolamiento AforeMóvil',
          descripcion: 'Enrolamiento biométrico y vinculación de la cuenta en la plataforma digital.',
          val: tramite.req_registro_aforemovil_realizado,
        },
        {
          id: 'req_saldo_visible_aforemovil',
          titulo: 'Validación de Saldo y Estatus en Afore',
          descripcion: 'Verificación de la disponibilidad del saldo en la AFORE para el retiro.',
          val: tramite.req_saldo_visible_aforemovil,
        },
        {
          id: 'req_tiene_semanas_descontadas',
          titulo: 'Análisis de Semanas a Descontar',
          descripcion: 'Cálculo del impacto de semanas descontadas por retiro en el sistema IMSS.',
          val: tramite.req_tiene_semanas_descontadas,
        },
        {
          id: 'req_anexo_sindo',
          titulo: 'Generación y Validación Anexo SINDO',
          descripcion: 'Emisión del anexo SINDO para procedencia del pago de retiro por desempleo.',
          val: tramite.req_anexo_sindo,
        },
      ];

      let foundEnProceso = false;
      pasos = rawPasos.map((p) => {
        const isDone = Boolean(p.val);
        let estadoPaso: 'completado' | 'en_proceso' | 'pendiente' = 'pendiente';
        if (isDone) {
          estadoPaso = 'completado';
        } else if (!foundEnProceso && tramite.estado !== 'rechazado' && tramite.estado !== 'finalizado') {
          estadoPaso = 'en_proceso';
          foundEnProceso = true;
        }
        return {
          id: p.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          completado: isDone,
          estadoPaso,
        };
      });

    } else if (tipoTramite === 'mejoravit') {
      tipoNombre = 'Crédito Mejoravit Infonavit';
      const rawPasos = [
        {
          id: 'req_ine_normal',
          titulo: 'Identificación Oficial INE (Frente y Reverso)',
          descripcion: 'Copia digital a color legible de la credencial oficial vigente.',
          val: tramite.req_ine_normal,
        },
        {
          id: 'req_ine_ampliada_200',
          titulo: 'INE Ampliada al 200%',
          descripcion: 'Documento en formato de ampliación al 200% para archivo Infonavit.',
          val: tramite.req_ine_ampliada_200,
        },
        {
          id: 'req_curp_actualizada',
          titulo: 'CURP Actualizada',
          descripcion: 'Documento oficial de CURP con formato vigente RENAPO.',
          val: tramite.req_curp_actualizada,
        },
        {
          id: 'req_acta_nacimiento',
          titulo: 'Acta de Nacimiento Certificada',
          descripcion: 'Copia del acta de nacimiento certificada en el Registro Civil.',
          val: tramite.req_acta_nacimiento,
        },
        {
          id: 'req_comprobante_domicilio',
          titulo: 'Comprobante de Domicilio Reciente',
          descripcion: 'Comprobante de domicilio no mayor a 3 meses correspondiente al inmueble.',
          val: tramite.req_comprobante_domicilio,
        },
        {
          id: 'req_estado_cuenta_bancario',
          titulo: 'Estado de Cuenta Bancario con CLABE',
          descripcion: 'Estado de cuenta bancario del último mes a nombre del solicitante con CLABE.',
          val: tramite.req_estado_cuenta_bancario,
        },
        {
          id: 'req_constancia_situacion_fiscal',
          titulo: 'Constancia de Situación Fiscal (SAT)',
          descripcion: 'Documento de situación fiscal con RFC validado ante el SAT.',
          val: tramite.req_constancia_situacion_fiscal,
        },
        {
          id: 'req_3_referencias_personales',
          titulo: '3 Referencias Personales Verificadas',
          descripcion: 'Registro de 3 referencias personales con datos de contacto verificados.',
          val: tramite.req_3_referencias_personales,
        },
        {
          id: 'req_portal_infonavit_validado',
          titulo: 'Credenciales y Acceso a Mi Cuenta Infonavit',
          descripcion: 'Validación del perfil en el portal Infonavit para gestión de solicitud.',
          val: tramite.req_portal_infonavit_validado,
        },
        {
          id: 'req_fotos_inmueble_5',
          titulo: 'Expediente de Fotografías del Inmueble (5 fotos)',
          descripcion: 'Fotografías (3 interiores y 2 exteriores) de las áreas a mejorar.',
          val: tramite.req_fotos_inmueble_5,
        },
      ];

      let foundEnProceso = false;
      pasos = rawPasos.map((p) => {
        const isDone = Boolean(p.val);
        let estadoPaso: 'completado' | 'en_proceso' | 'pendiente' = 'pendiente';
        if (isDone) {
          estadoPaso = 'completado';
        } else if (!foundEnProceso && tramite.estado !== 'rechazado' && tramite.estado !== 'finalizado') {
          estadoPaso = 'en_proceso';
          foundEnProceso = true;
        }
        return {
          id: p.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          completado: isDone,
          estadoPaso,
        };
      });

    } else if (tipoTramite === 'alta_medica_imss') {
      tipoNombre = 'Alta Médica IMSS';
      const rawPasos = [
        {
          id: 'req_curp_validada',
          titulo: 'CURP Validada ante IMSS',
          descripcion: 'Verificación de CURP en la base de datos nacional del seguro social.',
          val: tramite.req_curp_validada,
        },
        {
          id: 'req_comprobante_domicilio_reciente',
          titulo: 'Comprobante de Domicilio Reciente',
          descripcion: 'Comprobante para asignación de la Clínica UMF correspondiente.',
          val: tramite.req_comprobante_domicilio_reciente,
        },
        {
          id: 'req_identificacion_oficial',
          titulo: 'Identificación Oficial Vigente (INE/Pasaporte)',
          descripcion: 'Copia oficial de identificación para la cartilla de salud.',
          val: tramite.req_identificacion_oficial,
        },
        {
          id: 'req_fotografia_infantil',
          titulo: 'Fotografía Tamaño Infantil',
          descripcion: 'Fotografía infantil reciente para expediente médico.',
          val: tramite.req_fotografia_infantil,
        },
        {
          id: 'req_cartilla_nacional_salud',
          titulo: 'Emisión de Cartilla Nacional de Salud',
          descripcion: 'Preparación y alta en el registro de la unidad médica familiar.',
          val: tramite.req_cartilla_nacional_salud,
        },
        {
          id: 'req_alta_patronal_vigente',
          titulo: 'Alta Patronal Vigente Acreditada',
          descripcion: 'Confirmación de la relación laboral o modalidad de aseguramiento activa.',
          val: tramite.req_alta_patronal_vigente,
        },
      ];

      let foundEnProceso = false;
      pasos = rawPasos.map((p) => {
        const isDone = Boolean(p.val);
        let estadoPaso: 'completado' | 'en_proceso' | 'pendiente' = 'pendiente';
        if (isDone) {
          estadoPaso = 'completado';
        } else if (!foundEnProceso && tramite.estado !== 'rechazado' && tramite.estado !== 'finalizado') {
          estadoPaso = 'en_proceso';
          foundEnProceso = true;
        }
        return {
          id: p.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          completado: isDone,
          estadoPaso,
        };
      });
    }

    const completados = pasos.filter((p) => p.completado).length;
    const total = pasos.length;
    const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

    // Nombre formateado para el cliente (ej. "Madai C.")
    const primerNombre = (cliente.nombre || '').split(' ')[0];
    const primerApellido = cliente.apellido_paterno || (cliente.apellidos || '').split(' ')[0] || '';
    const clienteNombrePublico = `${primerNombre} ${primerApellido ? primerApellido.charAt(0) + '.' : ''}`.trim();

    return NextResponse.json({
      success: true,
      cliente: {
        nombrePublico: clienteNombrePublico,
      },
      tramite: {
        id: tramite.id,
        folio: (tramite.id || '').substring(0, 8).toUpperCase(),
        tipo: tipoTramite,
        tipoNombre,
        estado: tramite.estado || 'en_proceso',
        observaciones: tramite.observaciones || null,
        created_at: tramite.created_at,
        updated_at: tramite.updated_at,
      },
      pasos,
      progreso: {
        completados,
        total,
        porcentaje,
      },
    });
  } catch (error: any) {
    console.error('Error al consultar tramite:', error);
    return NextResponse.json(
      { error: error.message || 'Error al procesar la consulta de trámite' },
      { status: 500 }
    );
  }
}
