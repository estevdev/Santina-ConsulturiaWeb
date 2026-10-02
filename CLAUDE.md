# Santina Consultoría Web - Arquitectura y Guía de Desarrollo

## 1. Principio Fundamental: Arquitectura Basada en Componentes
- **Modularidad estricta**: No colocar lógica compleja ni interfaces completas en un solo archivo de ruta (`page.tsx`).
- **Separación de responsabilidades**:
  - `src/components/landing/`: Componentes modulares de la landing page pública (`LandingNavbar.tsx`, `LandingHero.tsx`, `LandingTramitesCatalog.tsx`, `LandingTramiteDetailModal.tsx`, `LandingQuickTracker.tsx`, `LandingSimulator.tsx`, `LandingProcessSteps.tsx`, `LandingWhyChooseUs.tsx`, `LandingFaq.tsx`, `LandingContact.tsx`, `LandingFooter.tsx`).
  - `src/components/layout/`: Barra lateral (`Sidebar.tsx`), encabezado (`Header.tsx`), layout unificado (`DashboardLayout.tsx`).
  - `src/components/auth/`: Formularios de autenticación (`LoginForm.tsx`), protectores de ruta.
  - `src/components/dashboard/`: Widgets y tarjetas (`StatCards.tsx`, `QuickActions.tsx`, `RecentPresets.tsx`, `SystemStatusCard.tsx`).
  - `src/components/pdf-preset-studio/`: Vistas y herramientas de edición de PDFs y presets (`PdfPresetStudioView.tsx`, `PresetBuilder.tsx`, `PdfProcessor.tsx`, `PresetList.tsx`).
  - `src/context/`: Estados globales (`AuthContext.tsx`).
  - `src/utils/`: Utilidades puras (`ocrExtractor.ts`, `pdfModifier.ts`, `richTextParser.ts`, `storage.ts`).

---

## 2. Estructura de Rutas
- `/`: Landing page oficial para clientes con catálogo completo de trámites (Retiro por Desempleo AFORE, Crédito Mejoravit Infonavit, Alta Médica IMSS y Expediente Digital PDF Studio), precalificador/simulador interactivo, rastreador de folio/NSS en vivo y accesos directos al panel/login.
- `/seguimiento`: Portal cliente para consulta detallada de avance de trámite con folio y NSS y notificaciones push.
- `/login`: Pantalla de inicio de sesión con selector rápido de usuarios de prueba.
- `/dashboard`: Panel principal con estadísticas, acciones rápidas, presets recientes y estado del sistema.
- `/dashboard/pdf-preset-studio`: Herramienta de edición, creación de plantillas/zonas y procesamiento de PDFs.
- `/pdf-preset-studio`: Redirección automática a `/dashboard/pdf-preset-studio`.

---

## 3. Usuarios de Prueba Preconfigurados
| Usuario / Email | Contraseña | Rol | Nombre |
|---|---|---|---|
| `admin@santina.com` (o `admin`) | `admin123` | Administrador | Carlos Santina (Admin) |
| `demo@santina.com` (o `demo`) | `demo123` | Editor | Usuario de Pruebas |

*Nota: La sesión se mantiene en `localStorage` con la clave `santina_auth_user`.*

---

## 4. Componente Sidebar / Sliderbar
- Ubicado en [Sidebar.tsx](file:///D:/PROYECTOS/7.%20Santina-ConsulturiaWeb/src/components/layout/Sidebar.tsx).
- Cuenta con modo colapsable / expandible (toggle dinámico entre ancho completo `w-64` y modo compacto `w-20`), navegación activa, accesos directos y compatibilidad responsive con menú móvil.
