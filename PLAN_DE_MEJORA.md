# PactaCloud / MinuteFlow — Plan de Mejora

Objetivo: llevar la app de una demo single-player (localStorage) a una **aplicación
multi-tenant de producción con usuarios reales**, priorizando seguridad/tenancy,
robustez, sincronización cloud y devex.

Estado actual: React 19 + Vite + Tailwind 4, Gemini vía serverless `/api/enhance`,
Supabase opcional (write-only), Google Drive vía OAuth GIS + Apps Script webhook,
despliegue en Vercel.

---

## Resumen de hallazgos

### Críticos — Seguridad y tenancy
- **C1. RLS abierto.** `supabase/schema.sql` (el que usa el código) tiene
  `USING (true)` en todas las políticas. Con la anon key pública en el bundle,
  cualquiera lee/edita actas de todas las organizaciones.
- **C2. Dos esquemas contradictorios.** `database/schema.sql` (UUID, auth.users,
  RLS real, helpers, minute_attendees, auditoría) es el correcto pero está sin usar.
- **C3. Sin autenticación.** No hay login. El "multi-tenant" es un switcher de org
  en localStorage. Aislamiento inexistente.
- **C4. Sync cloud de solo escritura.** App.tsx carga todo desde localStorage y
  nunca llama a los getters de Supabase. Lecturas muertas; sin multi-dispositivo.
- **C5. Webhook Apps Script sin auth** (`Code.gs`, "Cualquier usuario"): quien tenga
  la URL /exec puede crear docs/carpetas en el Drive de la org.
- **C6. `/api/enhance` sin auth ni rate-limit:** consumo de Gemini abusable.
- **C7. OAuth mock** con emails hardcodeados (`rectoria@colegio.cl`) mostrado como "conectado".

### Calidad / robustez
- **R1. XSS** en `generateMinuteHTML`: campos interpolados crudos en HTML.
- **R2. `JSON.parse` sin try/catch** en varios getters de storageService.
- **R3. Lectura Supabase incompleta:** getMinutes devuelve actionItems/attendees vacíos
  y lee `key_decisions` inexistente.
- **R4. Prompt Gemini duplicado** (api/enhance.ts vs aiService.ts, 10000 vs 8000 chars).
- **R5. Sin tests, ESLint ni CI.** Solo `tsc --noEmit`.
- **R6. Identidad del proyecto:** README plantilla AI Studio, package.json "react-example" v0.0.0.

---

## Estrategia

Adoptar **`database/schema.sql` como única fuente de verdad** (RLS por usuario real),
**Supabase Auth** como identidad, y hacer que el cliente **lea y escriba** en la nube
con localStorage solo como caché/offline. Eliminar el esquema abierto y los caminos
mock en producción. Mantener el gateway serverless de Gemini como único acceso a IA.

Principio de fases: primero cerrar riesgos de seguridad sin romper la demo, luego
construir auth+tenancy real, después la sync bidireccional, y al final robustez y devex.

---

## Fase 0 — Contención inmediata (sin romper nada, 0.5–1 día)

Objetivo: cortar las exposiciones activas hoy, antes de la re-arquitectura.

1. **Rotar secretos comprometidos.** La anon key, la GEMINI_API_KEY del `.env` local
   y cualquier URL de Apps Script desplegada deben considerarse expuestas. Rotar:
   - GEMINI_API_KEY (usar solo `GEMINI_API_KEY` server-side, nunca `VITE_`).
   - Supabase: regenerar anon key si el esquema abierto estuvo activo.
   - Apps Script: re-desplegar con secreto compartido (ver item 4).
2. **Eliminar `VITE_GEMINI_API_KEY` del camino cliente.** En `aiService.ts`, borrar el
   `getGeminiClient()` directo (paso 2) y depender solo de `/api/enhance`. Así la key
   nunca llega al navegador.
3. **Quitar los emails/orgs mock hardcodeados** de `googleDriveOAuthService.ts`
   (`rectoria@colegio.cl`, `usuario@institucion.cl`, `mock_oauth_`). Si no hay OAuth
   real, devolver `connected:false` con mensaje claro, no una conexión falsa.
4. **Autenticar el webhook de Apps Script.** Agregar en `Code.gs` una validación de
   un `SHARED_SECRET` (comparar con `data.secret` o header) y rechazar si no coincide.
   Desplegar como acceso restringido si es posible.
5. **Proteger `/api/enhance`.** Validar origen, agregar rate-limit básico y exigir un
   token de sesión (cuando exista auth). Mientras tanto, limitar tamaño de entrada y
   registrar abusos.

Criterio de salida: ninguna key sensible en el bundle; webhook y endpoint de IA no
abusable por terceros anónimos.

---

## Fase 1 — Identidad y tenancy real (3–5 días)

Objetivo: que los datos estén aislados por organización y usuario autenticado en el
servidor, no por un switcher en el cliente.

1. **Unificar el esquema.** Adoptar `database/schema.sql` (RLS real, helpers
   `get_current_user_org_id()` / `is_org_admin()`, `minute_attendees`, auditoría).
   Eliminar `supabase/schema.sql` (abierto) o reemplazarlo por una migración inicial.
   Documentar el orden de aplicación en una sola carpeta `supabase/migrations/`.
2. **Supabase Auth.** Agregar flujo de registro/login (email+password y/o OAuth Google).
   Crear pantalla de auth y un `AuthProvider`/contexto. El `currentOrgId` debe derivar
   de la membresía del usuario (tabla `memberships`/`profiles.organization_id`), nunca
   de localStorage libre.
3. **Modelo de pertenencia.** Un usuario pertenece a una (o varias) organizaciones con
   un rol (admin/editor/reader). El switcher de org solo muestra orgs del usuario.
   El rol simulado de `handleChangeUserRole` pasa a ser el rol real de la BD.
4. **RLS basada en sesión.** Reescribir políticas para que usen `auth.uid()` y los
   helpers; probar con la anon key que un usuario A no puede leer datos de la org B.
5. **Onboarding de organización.** Al crear la primera org, asignar al usuario como
   admin; migrar `INITIAL_*` (mockData) a plantillas opcionales, no a estado global.

Criterio de salida: login funcional; RLS verifica aislamiento entre dos orgs de prueba
con dos usuarios distintos; el `org-redq` por defecto deja de ser el fallback global.

---

## Fase 2 — Sincronización cloud bidireccional (3–4 días)

Objetivo: que la nube sea la fuente de verdad y localStorage solo una caché offline.

1. **Cargar desde Supabase al iniciar.** App.tsx debe `await storageService.getMinutes()`
   / `getOrganizations()` / etc. tras el login, en vez de leer solo localStorage. Las
   lecturas actuales están muertas: hay que conectarlas.
2. **Relaciones completas.** `getMinutes` debe traer `action_items` y asistentes vía
   `minute_attendees` (no devolver arrays vacíos). Corregir el mapeo que lee
   `key_decisions` (columna inexistente) — decidir si se agrega la columna o se elimina.
3. **Escrituras incrementales.** Reemplazar el "upsert del array completo" por operaciones
   por registro (insert/update/delete) con manejo de conflictos y `updated_at`.
4. **Sync real, no simulada.** `handleTriggerSync` (hoy un setTimeout+toast) debe
   reflejar el estado de sincronización verdadero, con indicador de error.
5. **Modo offline.** Encolar cambios locales y reconciliar al reconectar (o, si se
   prefiere simple: exigir online para mutaciones y cachear solo lecturas).
6. **Tiempo real (opcional).** Supabase Realtime para que varios usuarios de la misma
   org vean cambios al instante.

Criterio de salida: dos dispositivos con el mismo usuario ven las mismas actas; crear/
editar/eliminar persiste en BD y se refleja tras recargar.

---

## Fase 3 — Robustez y calidad de código (2–3 días)

1. **Sanitizar HTML (XSS).** En `generateMinuteHTML` y en el export, escapar todos los
   campos interpolados (title, pointsTreated, nombres, emails, tareas). Usar una
   función `escapeHtml` centralizada.
2. **Parseo defensivo.** Envolver todo `JSON.parse` de localStorage en try/catch con
   fallback seguro (algunos getters ya lo tienen, otros no).
3. **DRY del prompt Gemini.** Extraer el prompt a un módulo compartido usado por
   `api/enhance.ts` (y por el cliente solo si vuelve a haber camino directo, que no debería).
4. **Manejo de errores visible.** Hoy muchos `catch` solo hacen `console.warn`. Mostrar
   toasts de error reales cuando falle Supabase/Drive/IA, sin bloquear la UI.
5. **Tipado estricto.** Revisar `any` en mapeos de Supabase (`o: any`, `m: any`) y en
   `api/enhance.ts` (req/res). Tipar respuestas con zod o interfaces.
6. **Limpieza de estados demo.** Separar `mockData`/`INITIAL_*` del runtime: usarlos solo
   como seed opcional o fixtures de test, nunca como estado inicial de producción.

Criterio de salida: `tsc --noEmit` limpio sin `any` nuevos; export a Drive/Docs no
inyecta HTML; ninguna acción de red falla en silencio.

---

## Fase 4 — Drive, devex y producto (2–3 días)

1. **Integración Drive coherente.** Hoy conviven dos caminos (OAuth REST directo y
   Apps Script webhook). Definir uno oficial (recomendado: OAuth `drive.file` con
   refresh token vía backend) y documentar el otro como alternativa. Eliminar el modo
   mock de la UI.
2. **Tests.** Vitest + React Testing Library para lógica crítica: storageService,
   aiService (fallback heurístico), escapeHtml, mapeos Supabase. Playwright opcional
   para el flujo login→crear acta→exportar.
3. **Lint y CI.** ESLint + Prettier; GitHub Actions con `lint` (tsc), `test` y `build`
   en cada PR. Bloquear merge si falla.
4. **Monitoreo de errores.** Sentry (frontend y serverless) para capturar fallos reales
   en vez de `console.warn`.
5. **Identidad del proyecto.** Corregir `package.json` (name `pactacloud`, versión real),
   reescribir `README.md` (hoy plantilla AI Studio) con setup, variables de entorno,
   migraciones y despliegue. Unificar `GUIA_DESPLIEGUE_ONLINE.md`.
6. **Variables de entorno.** `.env.example` actualizado: solo `GEMINI_API_KEY` (server),
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_CLIENT_ID`,
   `DRIVE_WEBHOOK_SECRET`. Confirmar que `.env*` sigue ignorado (ya lo está).

---

## Riesgos y notas

- **Migración de datos:** si ya hay datos reales en el esquema abierto, planear una
  migración (ids TEXT→UUID, organization_id por defecto) antes de cortar el viejo.
- **RLS mal configurada = fuga o bloqueo:** probar siempre con dos usuarios de orgs
  distintas; una política demasiado abierta filtra, una demasiado cerrada rompe la app.
- **Costos de Gemini:** el endpoint serverless debe autenticar y limitar para evitar
  abuso ahora que hay usuarios reales.
- **No mezclar fases 0 y 1 a medias:** la Fase 0 contiene el riesgo; la Fase 1 lo
  resuelve de raíz. No saltar la Fase 0 si la app está expuesta hoy.

## Orden sugerido

Fase 0 (contención) → Fase 1 (auth+tenancy) → Fase 2 (sync bidireccional) →
Fase 3 (robustez) → Fase 4 (Drive/tests/devex). Las fases 3 y 4 pueden solaparse con 2.
