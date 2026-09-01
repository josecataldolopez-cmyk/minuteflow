# Guía Paso a Paso: Cómo Desplegar y Usar MinuteFlow Online

Esta guía te explica cómo publicar **MinuteFlow** en internet para que tú y tu equipo puedan acceder a la plataforma desde cualquier navegador, computadora, tablet o teléfono móvil.

---

## Opción 1: Despliegue en Vercel (Recomendado - 5 minutos)

Vercel ofrece hosting gratuito con HTTPS (candado de seguridad), CDN global ultrarrápido y actualizaciones automáticas cada vez que subes cambios.

### Paso 1: Subir el proyecto a GitHub
1. Si aún no tienes un repositorio de Git, inicialízalo en la carpeta del proyecto:
   ```bash
   git init
   git add .
   git commit -m "feat: MinuteFlow inicial con IA y soporte online"
   ```
2. Crea un repositorio privado en [GitHub](https://github.com/new).
3. Conéctalo y sube los archivos:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/MinuteFlow.git
   git branch -M main
   git push -u origin main
   ```

### Paso 2: Conectar en Vercel
1. Ve a [Vercel](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add New..."** → **"Project"**.
3. Selecciona tu repositorio `MinuteFlow` e importa el proyecto.
4. En la sección **Environment Variables**, añade:
   - `VITE_GEMINI_API_KEY`: Tu clave de Google AI Studio (obténla gratis en [aistudio.google.com](https://aistudio.google.com/)).
   - `VITE_SUPABASE_URL`: *(Opcional si usas Supabase)* La URL de tu proyecto.
   - `VITE_SUPABASE_ANON_KEY`: *(Opcional si usas Supabase)* Tu clave pública anónima.
5. Haz clic en **"Deploy"**. En 1 minuto tendrás tu enlace público `https://minuteflow.vercel.app`.

---

## Opción 2: Conectar Base de Datos en la Nube con Supabase

Si deseas que todas las actas, tareas y directorio corporativo se sincronicen en tiempo real entre múltiples dispositivos:

1. Ingresa a [Supabase](https://supabase.com) y crea un nuevo proyecto gratuito.
2. En el menú lateral, abre el **SQL Editor**.
3. Abre el archivo [`database/schema.sql`](./database/schema.sql) que creamos en este proyecto, copia todo su contenido y pégalo en el editor de Supabase.
4. Haz clic en **"Run"**. Se crearán automáticamente todas las tablas (`minutes`, `attendees`, `action_items`, `directories`), índices y políticas de seguridad.
5. Copia tu `Project URL` y `anon key` desde **Project Settings > API** y colócalas en tu archivo `.env` o en las variables de entorno de Vercel.

---

## Opción 3: Despliegue con Docker (Google Cloud Run / AWS / Servidor Propio)

Si prefieres tener la aplicación en tu propio servidor o nube corporativa privada:

1. **Construir la imagen de Docker**:
   ```bash
   docker build -t minuteflow:latest .
   ```
2. **Ejecutar el contenedor localmente o en el servidor**:
   ```bash
   docker run -d -p 80:80 --name minuteflow minuteflow:latest
   ```
3. Accede en tu navegador a `http://IP_DE_TU_SERVIDOR` o configura tu dominio con Nginx y Let's Encrypt.

---

## Características de la Plataforma Lista para Producción:
- ✨ **Asistente de IA (Gemini)**: Sintetiza notas de reunión y genera compromisos estructurados con 1 clic.
- 🎙️ **Grabador y Dictado de Voz en Vivo**: Captura audio de la sesión y lo transcribe al acta.
- 📅 **Calendario de Tareas**: Visualización mensual y semanal de compromisos por fecha límite.
- 👥 **Directorio Corporativo**: Edición, creación y eliminación completa de participantes.
- 🗂️ **Gestión de Carpetas**: Clasificación jerárquica de actas ejecutivas.
- 📄 **Exportación Multicanal**: Generación para PDF, Google Docs, correo y WhatsApp.
