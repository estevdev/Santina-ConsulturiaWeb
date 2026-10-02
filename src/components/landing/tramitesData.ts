export interface TramiteInfo {
  id: 'retiro_desempleo' | 'mejoravit' | 'alta_medica_imss';
  badge: string;
  badgeColor: string;
  entidad: string;
  titulo: string;
  subtitulo: string;
  descripcionCorta: string;
  descripcionCompleta: string;
  imagen: string;
  icono: string;
  tiempoEstimado: string;
  beneficioPrincipal: string;
  requisitosClave: Array<{
    titulo: string;
    descripcion: string;
    obligatorio: boolean;
  }>;
  requisitosDetallados: Array<{
    numero: number;
    nombre: string;
    descripcion: string;
    tipAsesor: string;
  }>;
  pasosGestion: Array<{
    fase: string;
    titulo: string;
    descripcion: string;
  }>;
  preguntasFrecuentes: Array<{
    q: string;
    a: string;
  }>;
}

export const TRAMITES_SISTEMA: TramiteInfo[] = [
  {
    id: 'retiro_desempleo',
    badge: 'AFORE / CONSAR',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    entidad: 'Comisión Nacional del SAR e IMSS',
    titulo: 'Retiro Parcial por Desempleo AFORE',
    subtitulo: 'Recupera recursos de tu subcuenta de retiro de manera legal y asistida',
    descripcionCorta: 'Retira hasta el 11.5% del saldo de tu cuenta individual AFORE o hasta 90 días de tu salario base si te encuentras actualmente inactivo ante el IMSS.',
    descripcionCompleta: 'El Retiro por Desempleo es un derecho legal de los trabajadores que cotizan ante el IMSS. Te asesoramos en todo el proceso de validación ante el Instituto, enrolamiento biométrico en AforeMóvil, generación del Anexo SINDO y verificación de impacto en semanas de cotización para que obtengas el monto máximo correspondiente a tu modalidad (Modalidad A o Modalidad B).',
    imagen: '/card-desempleo.jpg',
    icono: '/tramite-desempleo.png',
    tiempoEstimado: '3 a 7 días hábiles',
    beneficioPrincipal: 'Disponibilidad de fondos en tu cuenta bancaria sin endeudamiento',
    requisitosClave: [
      {
        titulo: 'Mínimo 46 días naturales sin cotizar',
        descripcion: 'Tener al menos 46 días naturales desde la baja patronal registrada en el IMSS.',
        obligatorio: true,
      },
      {
        titulo: 'Al menos 3 años con cuenta AFORE abierta',
        descripcion: 'Tener una cuenta individual registrada en una AFORE con antigüedad mínima.',
        obligatorio: true,
      },
      {
        titulo: 'No haber retirado en los últimos 5 años',
        descripcion: 'No haber ejercido este beneficio en un lapso menor a 60 meses.',
        obligatorio: true,
      },
      {
        titulo: 'Expediente Biométrico en AforeMóvil',
        descripcion: 'Registro facial, huellas y datos actualizados en la aplicación oficial.',
        obligatorio: true,
      },
    ],
    requisitosDetallados: [
      {
        numero: 1,
        nombre: 'Validación de Baja / Inactividad en IMSS',
        descripcion: 'Verificación oficial de no contar con relación laboral activa ante el IMSS.',
        tipAsesor: 'Verificamos en el sistema que hayan transcurrido 46 días exactos para evitar rechazos automáticos.',
      },
      {
        numero: 2,
        nombre: 'Identificación Oficial (INE) Vigente a Color',
        descripcion: 'Credencial de elector vigente, escaneada por ambos lados en alta resolución sin cortes.',
        tipAsesor: 'La digitalizamos con nuestro procesador óptico para garantizar total legibilidad.',
      },
      {
        numero: 3,
        nombre: 'Comprobante de Domicilio Reciente',
        descripcion: 'Servicio de luz (CFE), agua, teléfono fijo o predial con antigüedad no mayor a 3 meses.',
        tipAsesor: 'El domicilio debe coincidir o anexar aclaración domiciliaria con la AFORE.',
      },
      {
        numero: 4,
        nombre: 'CURP Certificada Actualizada',
        descripcion: 'Documento oficial con la leyenda de certificación ante el Registro Civil (RENAPO).',
        tipAsesor: 'Emitimos la versión más reciente en formato digital oficial.',
      },
      {
        numero: 5,
        nombre: 'Constancia de Situación Fiscal (SAT)',
        descripcion: 'Documento expedido por el SAT con RFC validado y homoclave correspondiente.',
        tipAsesor: 'Indispensable para la correcta retención o exención tributaria.',
      },
      {
        numero: 6,
        nombre: 'Reporte Oficial de Semanas Cotizadas IMSS',
        descripcion: 'Constancia oficial emitida por el IMSS que acredita la trayectoria laboral del trabajador.',
        tipAsesor: 'Analizamos cuántas semanas tienes para calcular la mejor modalidad de retiro.',
      },
      {
        numero: 7,
        nombre: 'App AforeMóvil Instalada y Verificada',
        descripcion: 'Aplicación oficial instalada en el dispositivo móvil con acceso activo.',
        tipAsesor: 'Te apoyamos en la configuración técnica y verificación de seguridad.',
      },
      {
        numero: 8,
        nombre: 'Registro y Enrolamiento Biométrico Realizado',
        descripcion: 'Foto selfie biométrica, confirmación de correo y contraseña en AforeMóvil.',
        tipAsesor: 'Garantiza que nadie más pueda solicitar trámites a tu nombre.',
      },
      {
        numero: 9,
        nombre: 'Validación de Saldo y Estatus en AFORE',
        descripcion: 'Confirmación de que los fondos de la subcuenta RCV están disponibles y no congelados.',
        tipAsesor: 'Comprobamos el monto exacto estimado que podrás recibir.',
      },
      {
        numero: 10,
        nombre: 'Análisis de Semanas a Descontar',
        descripcion: 'Cálculo del impacto de semanas que descontará el IMSS y plan de reintegro futuro.',
        tipAsesor: 'Te explicamos con transparencia cómo puedes recuperar tus semanas cuando vuelvas a trabajar.',
      },
      {
        numero: 11,
        nombre: 'Generación y Validación de Anexo SINDO',
        descripcion: 'Formato y anexo técnico SINDO requerido para la procedencia del pago bancario.',
        tipAsesor: 'Preparamos el folio oficial en coordinación con la administradora.',
      },
    ],
    pasosGestion: [
      {
        fase: 'Paso 1',
        titulo: 'Diagnóstico y Precalificación',
        descripcion: 'Revisamos tu fecha de baja ante el IMSS, tu saldo en AFORE y calculamos tu monto probable.',
      },
      {
        fase: 'Paso 2',
        titulo: 'Integración Documental y AforeMóvil',
        descripcion: 'Digitalizamos tus documentos y dejamos activa tu cuenta con expediente biométrico verificado.',
      },
      {
        fase: 'Paso 3',
        titulo: 'Ingreso de Solicitud y Anexo SINDO',
        descripcion: 'Ingresamos la gestión ante la administradora y generamos el folio de certificación.',
      },
      {
        fase: 'Paso 4',
        titulo: 'Depósito Directo en tu Cuenta',
        descripcion: 'La AFORE realiza el depósito del recurso en tu cuenta bancaria personal.',
      },
    ],
    preguntasFrecuentes: [
      {
        q: '¿Afecta mi pensión retirar dinero de mi AFORE?',
        a: 'El IMSS descuenta un número proporcional de semanas cotizadas. Sin embargo, en el futuro puedes realizar el reintegro de fondos cuando tengas empleo para recuperar íntegramente las semanas descontadas.',
      },
      {
        q: '¿Puedo retirar si acabo de renunciar o me despidieron ayer?',
        a: 'No inmediatamente. La ley exige que hayan transcurrido al menos 46 días naturales continuos desde la fecha oficial de la baja patronal en el IMSS.',
      },
      {
        q: '¿Cuánto dinero puedo retirar?',
        a: 'Existen dos modalidades: la Modalidad A entrega 30 días del último salario base cotizado (hasta el tope de 10 UMAs). La Modalidad B entrega lo que resulte menor entre 90 días de salario promedio o el 11.5% del saldo de la subcuenta de retiro.',
      },
    ],
  },
  {
    id: 'mejoravit',
    badge: 'INFONAVIT',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    entidad: 'Instituto del Fondo Nacional de la Vivienda para los Trabajadores',
    titulo: 'Crédito Mejoravit Infonavit',
    subtitulo: 'Remodela, amplía o equipa tu casa con financiamiento formal sin hipotecarla',
    descripcionCorta: 'Obtén financiamiento directo para pintar, impermeabilizar, renovar pisos, baños o cocinas mediante tu crédito Mejoravit con tu Subcuenta de Vivienda como respaldo.',
    descripcionCompleta: 'El Crédito Mejoravit es una solución diseñada para derechohabientes del Infonavit con relación laboral activa que desean mejorar o acondicionar su vivienda sin gravar la propiedad. En Santina Consultoría integramos tu expediente completo con los estrictos estándares solicitados por Infonavit (incluyendo el formato especial de INE ampliada al 200%, validación de 3 referencias personales y reporte fotográfico del inmueble) y gestionamos tu cita presencial en el CESI.',
    imagen: '/card-mejoravit.jpg',
    icono: '/tramite-mejoravit.png',
    tiempoEstimado: '7 a 15 días hábiles',
    beneficioPrincipal: 'Financiamiento directo con descuento vía nómina sin comprometer la escritura',
    requisitosClave: [
      {
        titulo: 'Relación Laboral Vigente',
        descripcion: 'Estar cotizando activamente ante el IMSS e Infonavit al momento de la solicitud.',
        obligatorio: true,
      },
      {
        titulo: 'Puntos y Precalificación Infonavit',
        descripcion: 'Cumplir con el puntaje mínimo requerido en Mi Cuenta Infonavit.',
        obligatorio: true,
      },
      {
        titulo: 'Expediente Fotográfico del Inmueble',
        descripcion: '5 fotografías claras que acrediten las áreas a intervenir (3 interiores y 2 exteriores).',
        obligatorio: true,
      },
      {
        titulo: '3 Referencias Personales Verificables',
        descripcion: 'Familiares o conocidos con datos de contacto directos.',
        obligatorio: true,
      },
    ],
    requisitosDetallados: [
      {
        numero: 1,
        nombre: 'Credenciales de Mi Cuenta Infonavit',
        descripcion: 'NSS y contraseña de acceso al portal oficial para descarga de precalificación.',
        tipAsesor: 'Ingresamos de forma segura para obtener tu monto máximo disponible de crédito.',
      },
      {
        numero: 2,
        nombre: 'Tabla de Amortización Oficial',
        descripcion: 'Documento que detalla los plazos, tasas y montos de descuento quincenal o mensual.',
        tipAsesor: 'Te mostramos exactamente de cuánto será tu mensualidad antes de firmar cualquier compromiso.',
      },
      {
        numero: 3,
        nombre: 'Contrato de Asesoría y Prestación de Servicios',
        descripcion: 'Formalización del servicio de gestoría con total claridad y certeza jurídica.',
        tipAsesor: 'Firma electrónica directa desde tu celular sin necesidad de imprimir hojas.',
      },
      {
        numero: 4,
        nombre: 'Identificación Oficial INE (Frente y Reverso)',
        descripcion: 'Credencial vigente escaneada en formato original a color de alta definición.',
        tipAsesor: 'Verificamos que no tenga datos borrosos ni vigencia vencida.',
      },
      {
        numero: 5,
        nombre: 'INE Ampliada al 200% (Formato Infonavit)',
        descripcion: 'Ampliación exacta proporcional del 200% en hoja membretada según la norma de Infonavit.',
        tipAsesor: 'Nuestro sistema cuenta con un motor automático de recorte y escalado al 200% exacto.',
      },
      {
        numero: 6,
        nombre: 'CURP Certificada Actualizada',
        descripcion: 'Documento oficial con certificación vigente de RENAPO.',
        tipAsesor: 'Validamos que coincida con tu acta de nacimiento sin homonimias.',
      },
      {
        numero: 7,
        nombre: 'Acta de Nacimiento Certificada',
        descripcion: 'Copia certificada emitida por el Registro Civil en formato digital o tradicional.',
        tipAsesor: 'Requisito estricto para validar titularidad en los expedientes de vivienda.',
      },
      {
        numero: 8,
        nombre: 'Comprobante de Domicilio del Inmueble',
        descripcion: 'Recibo de luz, agua o predial del último mes. Si está a nombre de familiar, anexo de acta.',
        tipAsesor: 'Si el recibo no está a tu nombre, te decimos qué documento de parentesco adjuntar para que lo acepten.',
      },
      {
        numero: 9,
        nombre: 'Estado de Cuenta Bancario con CLABE',
        descripcion: 'Estado de cuenta del último mes con CLABE interbancaria visible a nombre del solicitante.',
        tipAsesor: 'Aquí es donde se deposita el porcentaje autorizado en efectivo/transferencia.',
      },
      {
        numero: 10,
        nombre: 'Constancia de Situación Fiscal (SAT)',
        descripcion: 'Constancia con código QR y fecha de emisión dentro de los últimos 30 días.',
        tipAsesor: 'Requerida obligatoriamente por la normativa fiscal vigente de Infonavit.',
      },
      {
        numero: 11,
        nombre: '3 Referencias Personales Verificadas',
        descripcion: 'Nombre completo, parentesco, teléfono y domicilio de tres personas cercanas.',
        tipAsesor: 'Infonavit puede realizar una llamada de cotejo; preparamos las referencias correctamente.',
      },
      {
        numero: 12,
        nombre: 'Expediente Fotográfico del Inmueble (5 Fotos)',
        descripcion: '3 fotografías de áreas interiores a mejorar (cocina, baño, recámara) y 2 exteriores (fachada/calle).',
        tipAsesor: 'Contamos con una herramienta para compilar y fechar las fotos en formato PDF profesional.',
      },
      {
        numero: 13,
        nombre: 'Cita Presencial en Centro de Servicio Infonavit (CESI)',
        descripcion: 'Asistencia y formalización de la firma en la oficina de Infonavit de tu localidad.',
        tipAsesor: 'Te entregamos el expediente impreso encuadernado y te acompañamos el día de tu cita.',
      },
    ],
    pasosGestion: [
      {
        fase: 'Paso 1',
        titulo: 'Precalificación y Monto de Crédito',
        descripcion: 'Evaluamos tu puntuación en Mi Cuenta Infonavit y determinamos tu capacidad máxima de crédito.',
      },
      {
        fase: 'Paso 2',
        titulo: 'Integración del Expediente Técnico',
        descripcion: 'Generamos tu INE al 200%, compilamos las 5 fotografías, referencias y constancias fiscales.',
      },
      {
        fase: 'Paso 3',
        titulo: 'Agendamiento y Acompañamiento a Cita CESI',
        descripcion: 'Programamos tu cita en el centro Infonavit más cercano con expediente 100% verificado sin riesgo de rechazo.',
      },
      {
        fase: 'Paso 4',
        titulo: 'Entrega de Tarjeta y Dispersión',
        descripcion: 'Recibes tu tarjeta Mejoravit y los recursos autorizados para comprar materiales o pagar mano de obra.',
      },
    ],
    preguntasFrecuentes: [
      {
        q: '¿Tengo que ser dueño de la casa para solicitar Mejoravit?',
        a: 'La vivienda puede estar a tu nombre, al de tu cónyuge, padres, hijos o abuelos. En caso de familiares, solo se requiere presentar el comprobante de parentesco (acta de matrimonio o nacimiento).',
      },
      {
        q: '¿Cómo me entregan el dinero de Mejoravit?',
        a: 'Una parte del crédito se asigna a una tarjeta física para adquisición de materiales en comercios autorizados y hasta un 20% puede transferirse a tu cuenta bancaria para pago de mano de obra.',
      },
      {
        q: '¿Puedo volver a tramitar Mejoravit si ya tuve uno antes?',
        a: '¡Sí! Puedes tramitar un nuevo Mejoravit una vez que hayas liquidado el anterior y cumplas con los bimestres de cotización requeridos.',
      },
    ],
  },
  {
    id: 'alta_medica_imss',
    badge: 'IMSS BIENESTAR / UMF',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    entidad: 'Instituto Mexicano del Seguro Social',
    titulo: 'Alta Médica y Asignación de Clínica (UMF)',
    subtitulo: 'Activa tus derechos médicos y asigna tu Unidad de Medicina Familiar',
    descripcionCorta: 'Registra y asigna tu clínica del IMSS correspondiente a tu domicilio, tramita tu Cartilla Nacional de Salud y selecciona tu turno médico.',
    descripcionCompleta: 'El Alta Médica ante el IMSS garantiza que tanto tú como tus beneficiarios directos (esposa/o, hijos o padres) cuenten con atención médica inmediata en la Unidad de Medicina Familiar (UMF) que les corresponde territorialmente. Gestionamos la acreditación patronal, validación de CURP, asignación de consultorio y turno (matutino o vespertino) para que acudas a consulta sin trámites burocráticos engorrosos.',
    imagen: '/card-desempleo.jpg',
    icono: '/tramite-imss.png',
    tiempoEstimado: '24 a 48 horas',
    beneficioPrincipal: 'Atención médica y farmacéutica inmediata para ti y tu familia',
    requisitosClave: [
      {
        titulo: 'Acreditación de Vigencia de Derechos',
        descripcion: 'Estar registrado como trabajador activo o bajo régimen voluntario (Modalidad 40, etc.).',
        obligatorio: true,
      },
      {
        titulo: 'Comprobante de Domicilio para Zonificación',
        descripcion: 'Determina cuál es la Unidad de Medicina Familiar más cercana a tu hogar.',
        obligatorio: true,
      },
      {
        titulo: 'Identificación Oficial y CURP',
        descripcion: 'Documentos vigentes para el registro del expediente médico en el sistema institucional.',
        obligatorio: true,
      },
      {
        titulo: 'Fotografía Infantil',
        descripcion: 'Para la confección de la Cartilla Nacional de Salud personal y familiar.',
        obligatorio: true,
      },
    ],
    requisitosDetallados: [
      {
        numero: 1,
        nombre: 'CURP Validada ante el IMSS',
        descripcion: 'Verificación en la base de datos nacional del seguro social para evitar homonimias.',
        tipAsesor: 'Garantizamos que tu CURP esté enlazada a tu Número de Seguridad Social (NSS).',
      },
      {
        numero: 2,
        nombre: 'Comprobante de Domicilio Reciente',
        descripcion: 'Recibo oficial que define el código postal y la demarcación geográfica de la clínica.',
        tipAsesor: 'El comprobante delimita el área médica exacta asignada por el IMSS.',
      },
      {
        numero: 3,
        nombre: 'Identificación Oficial Vigente',
        descripcion: 'INE o pasaporte oficial del titular y de los beneficiarios mayores de edad.',
        tipAsesor: 'Debe coincidir con los nombres registrados en el acta de nacimiento.',
      },
      {
        numero: 4,
        nombre: 'Fotografía Tamaño Infantil',
        descripcion: 'Fotografía reciente de frente en blanco y negro o color para el carnet.',
        tipAsesor: 'Indispensable para el sellado institucional de la libreta de salud.',
      },
      {
        numero: 5,
        nombre: 'Emisión de Cartilla Nacional de Salud',
        descripcion: 'Registro y activación de la cartilla en la oficina de Archivo Clínico de la UMF.',
        tipAsesor: 'Te entregamos el formato listo y confirmado con el número de consultorio asignado.',
      },
      {
        numero: 6,
        nombre: 'Acreditación de Alta Patronal Vigente',
        descripcion: 'Confirmación de la vigencia laboral reportada por el empleador al IMSS.',
        tipAsesor: 'Emitimos la Constancia de Vigencia de Derechos en PDF para presentarla en ventanilla.',
      },
    ],
    pasosGestion: [
      {
        fase: 'Paso 1',
        titulo: 'Validación de Vigencia de Derechos',
        descripcion: 'Comprobamos que tu patrón te haya dado de alta correctamente y tu NSS esté activo.',
      },
      {
        fase: 'Paso 2',
        titulo: 'Zonificación de la Clínica UMF',
        descripcion: 'Localizamos la clínica más cercana de acuerdo a tu código postal y horario disponible.',
      },
      {
        fase: 'Paso 3',
        titulo: 'Registro Digital y Asignación de Turno',
        descripcion: 'Registramos la asignación de consultorio y horario (matutino o vespertino).',
      },
      {
        fase: 'Paso 4',
        titulo: 'Emisión de Constancia y Carnet',
        descripcion: 'Descarga de carnet oficial para acudir directamente a consulta médica y medicina preventiva.',
      },
    ],
    preguntasFrecuentes: [
      {
        q: '¿Puedo dar de alta a mis hijos y cónyuge en la misma clínica?',
        a: 'Sí, como asegurado titular tienes el derecho de registrar a tus hijos, cónyuge o concubina(o) y a tus padres si dependen económicamente de ti.',
      },
      {
        q: '¿Qué hago si cambié de casa o ciudad?',
        a: 'Gestionamos tu cambio de clínica UMF presentando el nuevo comprobante de domicilio para reasignarte a la clínica más cercana a tu nueva vivienda.',
      },
      {
        q: '¿Cuánto tiempo tarda en activarse el servicio médico?',
        a: 'La vigencia ante el sistema es inmediata una vez emitida la Constancia de Vigencia y registro en la UMF.',
      },
    ],
  },
];

export const ESTADISTICAS_SANTINA = [
  {
    valor: '+98.8%',
    etiqueta: 'Trámites Aprobados',
    descripcion: 'Expedientes aceptados en la primera presentación sin observaciones',
  },
  {
    valor: '+3,500',
    etiqueta: 'Clientes Respaldados',
    descripcion: 'Trabajadores que han recuperado su dinero o mejorado su vivienda',
  },
  {
    valor: '32',
    etiqueta: 'Estados de la República',
    descripcion: 'Cobertura y asesoría digital en todo el territorio mexicano',
  },
  {
    valor: '72 hrs',
    etiqueta: 'Tiempo Promedio de Integración',
    descripcion: 'Desde el primer contacto hasta el expediente listo para ingreso',
  },
];

export const BENEFICIOS_CONSULTORIA = [
  {
    icono: 'ShieldCheck',
    titulo: 'Certeza Jurídica y Transparencia',
    descripcion: 'Operamos conforme a la Ley del Seguro Social y Ley del Infonavit. Sin cobros indebidos ni falsas promesas.',
  },
  {
    icono: 'Cpu',
    titulo: 'Digitalización Óptica Avanzada',
    descripcion: 'Cotejo documental de alta precisión, ampliación de INE al 200% y contratos con firma digital al instante.',
  },
  {
    icono: 'Clock',
    titulo: 'Seguimiento en Vivo 24/7',
    descripcion: 'Rastrea el estatus exacto de tu trámite en cualquier momento ingresando tu folio y tu NSS en nuestra plataforma.',
  },
  {
    icono: 'Users',
    titulo: 'Acompañamiento Personalizado',
    descripcion: 'Un asesor certificado te guía paso a paso desde el diagnóstico inicial hasta la conclusión exitosa.',
  },
  {
    icono: 'Award',
    titulo: 'Cero Riesgo de Rechazo',
    descripcion: 'Auditamos cada documento antes de presentarlo ante la ventanilla oficial de AFORE o Infonavit.',
  },
  {
    icono: 'Smartphone',
    titulo: '100% Remoto o Presencial',
    descripcion: 'Realiza tu trámite sin salir de casa o recibe acompañamiento en tu cita local si así lo prefieres.',
  },
];

export const PREGUNTAS_FRECUENTES_GENERALES = [
  {
    pregunta: '¿Qué es Santina Consultoría y cómo me ayuda?',
    respuesta: 'Santina Consultoría es una firma especializada en gestión integral de trámites ante el IMSS, AFORE e Infonavit. Nos encargamos de auditar, digitalizar, armar y acompañar tu expediente para que recibas tus recursos de desempleo o créditos de mejora sin vueltas innecesarias ni rechazos en ventanilla.',
  },
  {
    pregunta: '¿Cobran anticipos para iniciar mi trámite?',
    respuesta: 'No cobramos costos ocultos ni anticipos abusivos. Ofrecemos un diagnóstico inicial 100% gratuito donde te explicamos la viabilidad real de tu caso y acordamos un contrato formal de asesoría con honorarios transparentes.',
  },
  {
    pregunta: '¿Cómo puedo saber el avance de mi trámite en cualquier momento?',
    respuesta: 'Al registrar tu trámite con nosotros, se te asigna un número de Folio único. Puedes entrar en cualquier momento a nuestra sección de Seguimiento en esta página, ingresar tu Folio y tu NSS, y verás en tiempo real los pasos completados, documentos validados y fecha estimada de conclusión.',
  },
  {
    pregunta: '¿Por qué me piden una INE ampliada al 200% para Mejoravit?',
    respuesta: 'El Infonavit establece por norma institucional que toda identificación oficial en créditos de mejora debe estar ampliada al 200% de su tamaño natural y centrada en hoja limpia para archivo histórico. En Santina generamos este formato exacto de manera digital para evitar que tengas que gastar en fotocopias de prueba o vueltas innecesarias.',
  },
  {
    pregunta: '¿Cuánto tiempo tarda en depositarse el Retiro por Desempleo de la AFORE?',
    respuesta: 'Una vez validado el expediente y generado el anexo SINDO, el tiempo habitual de dispersión bancaria por parte de la AFORE es de 3 a 7 días hábiles directamente en tu cuenta bancaria personal.',
  },
  {
    pregunta: '¿Qué necesito para empezar hoy mismo?',
    respuesta: 'Únicamente tu identificación oficial (INE) y tu Número de Seguridad Social (NSS). Contáctanos por WhatsApp o utiliza nuestro precalificador en esta página y en menos de 15 minutos te diremos cuánto puedes retirar o qué monto de crédito tienes disponible.',
  },
];
