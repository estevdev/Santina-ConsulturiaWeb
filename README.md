# Santina - Consultoría Web (PDF Preset Editor)

Aplicación web desarrollada con Next.js, React y Tailwind CSS, preparada para despliegue en entornos de producción con Docker y Docker Compose.

---

## 🚀 Despliegue con Docker

### Prerrequisitos
- [Docker](https://docs.docker.com/get-docker/) (versión 20.10 o superior)
- [Docker Compose](https://docs.docker.com/compose/) (versión v2 o superior)

---

### Opción 1: Con Docker Compose (Recomendado)

1. **Configurar variables de entorno (opcional):**
   ```bash
   cp .env.example .env
   ```
   *Puedes cambiar el puerto en `.env` (por defecto `3000`).*

2. **Construir y levantar en segundo plano:**
   ```bash
   docker compose up -d --build
   ```

3. **Verificar el estado del contenedor y su healthcheck:**
   ```bash
   docker compose ps
   ```

4. **Ver los logs:**
   ```bash
   docker compose logs -f
   ```

5. **Detener la aplicación:**
   ```bash
   docker compose down
   ```

---

### Opción 2: Con Docker CLI directamente

1. **Construir la imagen de producción:**
   ```bash
   docker build -t santina-consulturia:latest .
   ```

2. **Ejecutar el contenedor:**
   ```bash
   docker run -d \
     --name santina-consulturia \
     -p 3000:3000 \
     --restart unless-stopped \
     santina-consulturia:latest
   ```

3. **Acceder a la aplicación:**
   Abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Arquitectura de la imagen Docker

- **Multi-stage build**:
  - `base`: Imagen ligera basada en `node:22-alpine` con `libc6-compat`.
  - `deps`: Instalación limpia y reproducible con `npm ci`.
  - `builder`: Compilación optimizada con Next.js standalone output.
  - `runner`: Imagen mínima final, ejecutada bajo usuario sin privilegios de root (`nextjs:nodejs`), con `HEALTHCHECK` configurado.
