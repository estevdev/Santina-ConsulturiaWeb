/**
 * Utilidad para interactuar con la WhatsApp Cloud API oficial de Meta.
 * Permite enviar notificaciones y actualizaciones de estado del trámite a clientes.
 */

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v22.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

/**
 * Formatea un número telefónico (enfocado en México) al formato internacional E.164 requerido por Meta.
 * @param phone Número crudo (ej: '55 1234 5678', '+52 55 1234 5678', '5512345678')
 * @returns Número en formato limpio (ej: '525512345678')
 */
export function formatWhatsAppPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Eliminar espacios, guiones, paréntesis y signos
  let cleaned = phone.replace(/\D/g, '');

  // Si tiene 10 dígitos (típico celular mexicano sin lada país), agregar prefijo México 52
  if (cleaned.length === 10) {
    cleaned = `52${cleaned}`;
  }

  // Si tiene 12 dígitos y empieza con 521 (antiguo formato móvil México), mantener o normalizar
  return cleaned;
}

/**
 * Normaliza y formatea cualquier identificador o folio a un código limpio de 8 caracteres en mayúsculas.
 * Protege contra arrays, cadenas concatenadas por comas (ej. "4682063D,4682063d-..."), y UUIDs completos.
 */
export function formatFolio(input?: any): string {
  if (!input) return '';
  if (Array.isArray(input)) {
    if (input.length === 0) return '';
    return formatFolio(input[0]);
  }
  let str = String(input).trim();
  if (!str) return '';

  // Si viene concatenado con coma (ej. de coerción involuntaria de arrays en plantillas)
  if (str.includes(',')) {
    const firstPart = str.split(',')[0].trim();
    if (firstPart) return formatFolio(firstPart);
  }

  // Si tiene formato de UUID estándar o largo con guiones (ej. 4682063d-3f38-4847-85d2-77c615e3bf37)
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/i.test(str)) {
    return str.substring(0, 8).toUpperCase();
  }

  // Si ya es un código alfanumérico corto (<= 8 caracteres)
  if (str.length <= 8) {
    return str.toUpperCase();
  }

  // Si es un hash o UUID sin guiones más largo que 8 caracteres
  return str.substring(0, 8).toUpperCase();
}

export interface WhatsAppApiResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  details?: any;
  metaErrorCode?: number;
}

/**
 * Interpreta errores comunes de Meta WhatsApp Cloud API y devuelve un mensaje explicativo en español.
 */
function interpretMetaError(errorObj: any): string {
  const code = errorObj?.code;
  const message = errorObj?.message || '';

  if (code === 131030) {
    return 'El número receptor no está agregado en la lista de números de prueba de Meta Developers. En modo Desarrollo/Sandbox, debes registrar el número del cliente en el panel de Meta.';
  }
  if (code === 131047) {
    return 'Ventana de 24 horas cerrada: Han pasado más de 24 horas desde que el cliente envió un mensaje. Meta exige usar una plantilla pre-aprobada (Template) para iniciar la conversación.';
  }
  if (code === 190) {
    return 'El Token de acceso de Meta ha expirado o no es válido. Genera un nuevo token o usa un Token de Usuario del Sistema permanente en Business Manager.';
  }
  if (code === 100) {
    return `Parámetros inválidos enviados a Meta: ${message}`;
  }

  return message || 'Error devuelto por la API de WhatsApp de Meta.';
}

export interface SendWhatsAppTextMessageParams {
  to: string; // Número del cliente
  message: string; // Texto del mensaje
  previewUrl?: boolean;
}

/**
 * Envía un mensaje de texto libre por WhatsApp Cloud API.
 */
export async function sendWhatsAppTextMessage({
  to,
  message,
  previewUrl = false,
}: SendWhatsAppTextMessageParams): Promise<WhatsAppApiResponse> {
  const recipient = formatWhatsAppPhoneNumber(to);

  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    console.error('[WhatsApp Cloud API] Faltan variables de entorno: WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN.');
    return {
      success: false,
      error: 'WhatsApp API no está configurada en las variables de entorno del servidor.',
    };
  }

  if (!recipient || recipient.length < 10) {
    return {
      success: false,
      error: 'El número de teléfono proporcionado no es válido o está incompleto.',
    };
  }

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: {
      preview_url: previewUrl,
      body: message,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Cloud API Error]:', data);
      const friendlyError = interpretMetaError(data.error);
      return {
        success: false,
        error: friendlyError,
        metaErrorCode: data.error?.code,
        details: data.error,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      details: data,
    };
  } catch (error: any) {
    console.error('[WhatsApp Cloud API Exception]:', error);
    return {
      success: false,
      error: error.message || 'Error de conexión al servidor de WhatsApp Meta',
    };
  }
}

export interface SendWhatsAppTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

/**
 * Envía un mensaje de plantilla pre-aprobada (útil para iniciar conversación fuera de la ventana de 24h o pruebas).
 */
export async function sendWhatsAppTemplateMessage({
  to,
  templateName,
  languageCode = 'en_US',
  components = [],
}: SendWhatsAppTemplateParams): Promise<WhatsAppApiResponse> {
  const recipient = formatWhatsAppPhoneNumber(to);

  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    return {
      success: false,
      error: 'Variables de WhatsApp no configuradas.',
    };
  }

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const payload: any = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: languageCode,
      },
    },
  };

  if (components.length > 0) {
    payload.template.components = components;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[WhatsApp Template Error]:', data);
      return {
        success: false,
        error: interpretMetaError(data.error),
        metaErrorCode: data.error?.code,
        details: data.error,
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      details: data,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error de conexión al enviar plantilla',
    };
  }
}

export interface SendStatusUpdateParams {
  telefono: string;
  nombreCliente: string;
  nuevoEstado: string;
  estadoLabel?: string;
  folio?: string;
  tipoTramite?: string;
  observaciones?: string;
}

/**
 * Notifica al cliente por WhatsApp sobre la actualización del estado de su trámite.
 */
export async function sendWhatsAppClienteStatusUpdate({
  telefono,
  nombreCliente,
  nuevoEstado,
  estadoLabel,
  folio,
  tipoTramite,
  observaciones,
}: SendStatusUpdateParams): Promise<WhatsAppApiResponse> {
  const label = estadoLabel || nuevoEstado;
  const primerNombre = (nombreCliente || 'Cliente').split(' ')[0];
  const cleanFolio = formatFolio(folio);

  let mensaje = `Hola *${primerNombre}*,\n\nTe informamos que tu trámite`;
  if (tipoTramite && tipoTramite !== 'Trámite') mensaje += ` (*${tipoTramite}*)`;
  if (cleanFolio) mensaje += ` con folio *${cleanFolio}*`;
  mensaje += ` ha actualizado su estado a:\n\n📌 *${label.toUpperCase()}*`;

  if (observaciones) {
    mensaje += `\n\n📝 *Observaciones:* ${observaciones}`;
  }

  mensaje += `\n\nPuedes consultar el avance en tiempo real desde nuestro portal de seguimiento.\n\n_Santina Consultoría Inmobiliaria & Financiera_`;

  return sendWhatsAppTextMessage({
    to: telefono,
    message: mensaje,
  });
}
