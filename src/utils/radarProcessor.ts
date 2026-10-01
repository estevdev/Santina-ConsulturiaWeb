import { Cliente, TramiteMejoravit, TramiteRetiroDesempleo, TramiteAltaMedicaImss } from '@/types/cliente';
import { ClienteRadar, TramiteSummary, CitaSummary } from '@/types/radar';

export function processRadarClients(
  clientes: Cliente[],
  tramitesRetiro: TramiteRetiroDesempleo[] = [],
  tramitesMejoravit: TramiteMejoravit[] = [],
  tramitesAltaMedica: TramiteAltaMedicaImss[] = []
): ClienteRadar[] {
  // Index tramites by cliente_id
  const retiroMap = new Map<string, TramiteRetiroDesempleo[]>();
  for (const tr of tramitesRetiro) {
    if (tr.cliente_id) {
      const list = retiroMap.get(tr.cliente_id) || [];
      list.push(tr);
      retiroMap.set(tr.cliente_id, list);
    }
  }

  const mejoravitMap = new Map<string, TramiteMejoravit[]>();
  for (const tr of tramitesMejoravit) {
    if (tr.cliente_id) {
      const list = mejoravitMap.get(tr.cliente_id) || [];
      list.push(tr);
      mejoravitMap.set(tr.cliente_id, list);
    }
  }

  const altaMedicaMap = new Map<string, TramiteAltaMedicaImss[]>();
  for (const tr of tramitesAltaMedica) {
    if (tr.cliente_id) {
      const list = altaMedicaMap.get(tr.cliente_id) || [];
      list.push(tr);
      altaMedicaMap.set(tr.cliente_id, list);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return clientes
    .filter((c) => !c.deleted_at)
    .map((cli) => {
      const nombreCompleto = [
        cli.nombre,
        cli.apellido_paterno,
        cli.apellido_materno,
        cli.apellidos,
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      const userRetiros = retiroMap.get(cli.id) || [];
      const userMejoravit = mejoravitMap.get(cli.id) || [];
      const userAltaMedica = altaMedicaMap.get(cli.id) || [];

      const tramites: TramiteSummary[] = [];

      // 1. Process Retiro
      userRetiros.forEach((tr) => {
        const reqList: { key: string; label: string; checked: boolean }[] = [
          { key: 'req_ine_vigente', label: 'INE Vigente', checked: !!tr.req_ine_vigente },
          { key: 'req_comprobante_domicilio', label: 'Comprobante Domicilio', checked: !!tr.req_comprobante_domicilio },
          { key: 'req_curp', label: 'CURP', checked: !!tr.req_curp },
          { key: 'req_constancia_situacion_fiscal', label: 'Constancia SAT', checked: !!tr.req_constancia_situacion_fiscal },
          { key: 'req_reporte_semanas_imss', label: 'Reporte Semanas IMSS', checked: !!tr.req_reporte_semanas_imss },
          { key: 'req_app_aforemovil_instalada', label: 'App AforeMóvil', checked: !!tr.req_app_aforemovil_instalada },
          { key: 'req_registro_aforemovil_realizado', label: 'Registro AforeMóvil', checked: !!tr.req_registro_aforemovil_realizado },
          { key: 'req_saldo_visible_aforemovil', label: 'Saldo AforeMóvil', checked: !!tr.req_saldo_visible_aforemovil },
          { key: 'req_tiene_semanas_descontadas', label: 'Semanas Descontadas', checked: !!tr.req_tiene_semanas_descontadas },
          { key: 'req_anexo_sindo', label: 'Anexo SINDO', checked: !!tr.req_anexo_sindo },
        ];
        const completedReqs = reqList.filter((r) => r.checked).length;
        const totalReqs = reqList.length;
        const progreso = Math.round((completedReqs / totalReqs) * 100);

        tramites.push({
          tipo: 'retiro_desempleo',
          nombre: 'Retiro por Desempleo AFORE',
          estado: tr.estado || 'en_proceso',
          totalReqs,
          completedReqs,
          progreso,
          faltantes: reqList.filter((r) => !r.checked).map((r) => r.label),
          completados: reqList.filter((r) => r.checked).map((r) => r.label),
        });
      });

      // 2. Process Mejoravit
      userMejoravit.forEach((tr) => {
        const reqList: { key: string; label: string; checked: boolean }[] = [
          { key: 'req_ine_normal', label: 'INE Normal', checked: !!tr.req_ine_normal },
          { key: 'req_ine_ampliada_200', label: 'INE Ampliada 200%', checked: !!tr.req_ine_ampliada_200 },
          { key: 'req_curp_actualizada', label: 'CURP Actualizada', checked: !!tr.req_curp_actualizada },
          { key: 'req_acta_nacimiento', label: 'Acta Nacimiento', checked: !!tr.req_acta_nacimiento },
          { key: 'req_comprobante_domicilio', label: 'Comprobante Domicilio', checked: !!tr.req_comprobante_domicilio },
          { key: 'req_estado_cuenta_bancario', label: 'Estado de Cuenta', checked: !!tr.req_estado_cuenta_bancario },
          { key: 'req_constancia_situacion_fiscal', label: 'Constancia SAT', checked: !!tr.req_constancia_situacion_fiscal },
          { key: 'req_3_referencias_personales', label: '3 Referencias', checked: !!tr.req_3_referencias_personales },
          { key: 'req_portal_infonavit_validado', label: 'Portal Infonavit', checked: !!tr.req_portal_infonavit_validado },
          { key: 'req_fotos_inmueble_5', label: '5 Fotos Inmueble', checked: !!tr.req_fotos_inmueble_5 },
        ];
        const completedReqs = reqList.filter((r) => r.checked).length;
        const totalReqs = reqList.length;
        const progreso = Math.round((completedReqs / totalReqs) * 100);

        tramites.push({
          tipo: 'mejoravit',
          nombre: 'Crédito Mejoravit Infonavit',
          estado: tr.estado || 'en_proceso',
          totalReqs,
          completedReqs,
          progreso,
          faltantes: reqList.filter((r) => !r.checked).map((r) => r.label),
          completados: reqList.filter((r) => r.checked).map((r) => r.label),
        });
      });

      // 3. Process Alta Médica IMSS
      userAltaMedica.forEach((tr) => {
        const reqList: { key: string; label: string; checked: boolean }[] = [
          { key: 'req_curp_validada', label: 'CURP Validada', checked: !!tr.req_curp_validada },
          { key: 'req_comprobante_domicilio_reciente', label: 'Comprobante Reciente', checked: !!tr.req_comprobante_domicilio_reciente },
          { key: 'req_identificacion_oficial', label: 'INE / Identificación', checked: !!tr.req_identificacion_oficial },
          { key: 'req_fotografia_infantil', label: 'Foto Infantil', checked: !!tr.req_fotografia_infantil },
          { key: 'req_cartilla_nacional_salud', label: 'Cartilla de Salud', checked: !!tr.req_cartilla_nacional_salud },
          { key: 'req_alta_patronal_vigente', label: 'Alta Patronal Vigente', checked: !!tr.req_alta_patronal_vigente },
        ];
        const completedReqs = reqList.filter((r) => r.checked).length;
        const totalReqs = reqList.length;
        const progreso = Math.round((completedReqs / totalReqs) * 100);

        tramites.push({
          tipo: 'alta_medica',
          nombre: 'Alta Médica IMSS',
          estado: tr.estado || 'en_proceso',
          totalReqs,
          completedReqs,
          progreso,
          faltantes: reqList.filter((r) => !r.checked).map((r) => r.label),
          completados: reqList.filter((r) => r.checked).map((r) => r.label),
        });
      });

      // Overall Progress Calculation
      let overallProgress = 0;
      if (tramites.length > 0) {
        const sumProg = tramites.reduce((acc, t) => acc + t.progreso, 0);
        overallProgress = Math.round(sumProg / tramites.length);
      } else {
        // Fallback for clients with no formal trámite row yet: evaluate basic profile docs
        let basicPoints = 0;
        let basicTotal = 4;
        if (cli.telefono) basicPoints++;
        if (cli.curp) basicPoints++;
        if (cli.nss) basicPoints++;
        if (cli.ine_frente_url || cli.ine_completa_url) basicPoints++;
        overallProgress = Math.round((basicPoints / basicTotal) * 40); // Max 40% until trámite assigned
      }

      // Check Cita Infonavit
      const rawCita =
        (userMejoravit[0]?.documentos_urls as any)?.cita_infonavit ||
        (cli.documentos_urls as any)?.cita_infonavit ||
        null;

      const comprobanteUrl =
        (userMejoravit[0]?.documentos_urls as any)?.comprobante_cita_infonavit ||
        (cli.documentos_urls as any)?.comprobante_cita_infonavit ||
        null;

      let cita: CitaSummary | null = null;
      if (rawCita && (rawCita.fecha || rawCita.estado || rawCita.lugar)) {
        let diasRestantes: number | undefined = undefined;
        let esHoy = false;
        let esManana = false;

        if (rawCita.fecha) {
          const parts = rawCita.fecha.split('-');
          if (parts.length === 3) {
            const citaDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
            citaDate.setHours(0, 0, 0, 0);
            const diffMs = citaDate.getTime() - today.getTime();
            diasRestantes = Math.round(diffMs / (1000 * 60 * 60 * 24));
            esHoy = diasRestantes === 0;
            esManana = diasRestantes === 1;
          }
        }

        cita = {
          fecha: rawCita.fecha,
          hora: rawCita.hora,
          lugar: rawCita.lugar,
          folio: rawCita.folio,
          estado: rawCita.estado || 'pendiente',
          notas: rawCita.notas,
          comprobanteUrl,
          diasRestantes,
          esHoy,
          esManana,
        };
      }

      // Determine "A punto de salir" (near completion)
      const st = (cli.estado_cliente || 'interesado').toLowerCase();
      let isPuntoDeSalir = false;
      let motivoPuntoDeSalir = '';

      if (st !== 'terminado' && st !== 'cancelado') {
        if (cita && (cita.estado === 'asistida' || cita.estado === 'confirmada')) {
          isPuntoDeSalir = true;
          motivoPuntoDeSalir = cita.estado === 'asistida' 
            ? 'Cita asistida en Infonavit - Listo para cierre y cobro'
            : `Cita confirmada (${cita.fecha || 'Próxima'}) - Etapa final`;
        } else if (st === 'cita_programada') {
          isPuntoDeSalir = true;
          motivoPuntoDeSalir = 'Cita agendada ante la institución';
        } else if (overallProgress >= 80) {
          isPuntoDeSalir = true;
          motivoPuntoDeSalir = `${overallProgress}% de expediente completo`;
        } else if (st === 'en_proceso' && overallProgress >= 70) {
          isPuntoDeSalir = true;
          motivoPuntoDeSalir = `En proceso avanzado (${overallProgress}%)`;
        }
      }

      const tieneFaltantesCriticos =
        st === 'documentacion_pendiente' ||
        (tramites.length > 0 && tramites.some((t) => t.faltantes.length > 0 && t.progreso < 50));

      return {
        id: cli.id,
        nombre: cli.nombre,
        apellido_paterno: cli.apellido_paterno,
        apellido_materno: cli.apellido_materno,
        apellidos: cli.apellidos,
        nombreCompleto: nombreCompleto || 'Cliente sin nombre',
        telefono: cli.telefono,
        email: cli.email,
        curp: cli.curp,
        nss: cli.nss,
        estado_cliente: cli.estado_cliente || 'interesado',
        creado_por_nombre: cli.creado_por_nombre,
        creado_por_email: cli.creado_por_email,
        created_at: cli.created_at,
        updated_at: cli.updated_at,
        notas: cli.notas,
        tramites,
        tramitesNombres: tramites.map((t) => t.nombre),
        overallProgress,
        cita,
        isPuntoDeSalir,
        motivoPuntoDeSalir,
        hasCita: !!cita && !!cita.fecha,
        tieneFaltantesCriticos,
        clienteOriginal: cli,
      };
    });
}
