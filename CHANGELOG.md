# Changelog

Todos los cambios importantes de OFINK serán registrados en este archivo.

## [Unreleased]

## [1.29.0] - 2026-07-29

### Added

- **Teléfono del cliente editable en "Editar cotización" y en "Cotización rápida"**: en el formulario de editar cotización ahora hay un campo de WhatsApp/Teléfono junto al nombre del cliente — al guardar, si cambió, actualiza la ficha del cliente (`updateClientAction`). En Cotización rápida, si el cliente ya estaba agregado (encontrado por búsqueda o ya creado en este mismo flujo) y se sigue editando el teléfono, también se actualiza su ficha antes de crear la cotización/proyecto.
- **Más de una foto de referencia**: tanto "Crear/Editar cotización" como "Cotización rápida" ahora permiten subir varias fotos de referencia (hasta 3, mismo tope que ya usaba el bot). En "Editar cotización" también se pueden quitar fotos ya guardadas. Reutiliza las columnas existentes `reference_photo_path` (primera foto) y `extra_photo_paths` (el resto), sin migración nueva.
- **Más de un estilo en Cotización rápida**: el selector de estilos ahora permite marcar varias tarjetas a la vez (antes era selección única) — se guardan unidas por coma en el mismo campo `style` de siempre.

## [1.28.0] - 2026-07-27

### Fixed

- **"Hoy es tu día de descanso" salía TODOS los días**: `RestDayGate` envolvía Inicio sin mirar si hoy en verdad estaba bloqueado (fecha especial o día no laboral) — se mostraba siempre al primer ingreso del día, sin importar el horario configurado, hasta tocar "Acceder" (que solo lo silencia para ese día en ese navegador/sesión). Ahora el gate solo se aplica cuando `isRestDay` es realmente `true`.
- **Recordatorios push llevaban fallando el 100% de las veces**: el secreto compartido que usa pg_cron para llamar a `session-reminders`, `payment-reminders` y `followup-reminders` no coincidía con el que tenían guardado las funciones — cada ejecución (recordatorio 1h antes, avisos de pago, seguimiento) devolvía `401` desde que se crearon. Se corrigió fijando el mismo secreto en ambos lados. Además, `session-reminders` exigía las llaves VAPID y fallaba con `500` (sin mandar ni la notificación in-app) si no estaban — ahora, igual que las otras dos funciones, el push nativo es opcional y la notificación in-app se manda siempre. Confirmado funcionando de punta a punta (el aviso de "Pagos del día" ya llegó a la campanita).
- **Reprogramar cita solo permitía horas en punto**: al tocar una franja del calendario (crear o reagendar), la hora quedaba fija en `:00` sin importar dónde tocaras dentro del bloque de la hora — no había forma de dejar una cita a, por ejemplo, las 14:30. Se agregó un campo "Hora exacta" en Reagendar: tocar el calendario elige el día (y una hora de partida), y ese campo permite ajustar a cualquier minuto antes de guardar.

## [1.27.0] - 2026-07-27

### Added

- **Confirmar cita por WhatsApp al tocar una cita del calendario**: tocar una cita ya agendada en el calendario ya no va directo a "Ver proyecto" — ahora abre un popup con dos botones: **"Confirmar cita"** (abre WhatsApp con la fecha, hora, lugar y tatuador ya redactados) y **"Ver proyecto"** (el comportamiento de antes). Nuevo `SessionConfirmDialog`.
- **Mensaje de confirmación automático al agendar**: al crear una cita nueva — desde el calendario (agendar en un hueco vacío), desde una cotización (elegir fecha/hora al convertirla en proyecto), o desde un proyecto (botón "Agendar sesión") — se abre automático WhatsApp con el mensaje de confirmación ya armado (fecha, hora, lugar, tatuador). Con varias sesiones de una sola vez (agenda múltiple) no se dispara, al no haber una sola cita puntual que confirmar.
- **Nueva plantilla "Confirmación de cita agendada"**: se agregó a Ajustes → Personalización → Plantillas de WhatsApp, editable igual que el resto. Placeholders: `{nombre_cliente}`, `{fecha}`, `{hora}`, `{lugar}` (dirección del estudio) y `{nombre_tatuador}`. Nueva columna `studios.booking_confirmation_template` (ya migrada en Supabase).
- Nueva acción central `getBookingConfirmationLinkAction` (reutilizada por los 4 puntos de entrada de arriba, sin duplicar la lógica de armar el mensaje) y helper `lib/whatsapp-client.ts` que abre la pestaña de WhatsApp de forma síncrona con el tap del usuario — evita que Safari/iOS bloquee el popup cuando el link real llega después de una respuesta del servidor.

## [1.26.0] - 2026-07-27

### Added

- **Visor de galería con swipe**: tocar la foto de portada de un proyecto (ficha completa) o cualquier foto de la grilla en "Galería" ahora abre un visor a pantalla completa (`GalleryLightbox`) que se desliza hacia los lados (scroll-snap nativo, misma sensación que el visor de fotos del sistema) para pasar a la siguiente/anterior foto del proyecto. Antes "Ampliar foto" solo abría la imagen sola en una pestaña nueva, sin forma de ver el resto.
- **Encuadre circular del logo/foto de perfil (estilo Instagram)**: al subir el logo del estudio en Ajustes → Perfil, ahora se abre primero un editor (`LogoCropDialog`) para arrastrar y hacer zoom (pellizco con dos dedos, rueda del mouse o control deslizante) dentro de una guía circular antes de subir — la imagen se recorta a 600×600 en el propio navegador (canvas) y solo entonces se sube. Antes se subía el archivo tal cual salía de la cámara/galería, así que la foto podía quedar descentrada en el círculo.
- **Seguimiento a cliente 15 días después del tatuaje**: nueva Edge Function en Supabase (`followup-reminders`, vía `pg_cron` una vez al día a las 9am) que revisa los proyectos marcados como completados hace exactamente 15 días y manda notificación in-app + push ("🔔 Seguimiento a cliente") al tatuador asignado (o a todo el estudio si no tiene asignado) recordando hacer seguimiento por el tatuaje realizado. Requirió nuevas columnas `projects.completed_at` (fecha real en que se completó, la usa el seguimiento) y `projects.followup_sent_at` (evita duplicar el aviso; se limpia sola si el proyecto se reabre y se vuelve a completar).

### Fixed

- **Caja mostraba cobros de citas que ni habían pasado**: "Cobros pendientes del día" filtraba por cualquier sesión de hoy que no estuviera cancelada — así que una cita agendada para la tarde ya aparecía como cobro pendiente aunque el cliente no hubiera llegado. Ahora solo entran sesiones con `status: 'completed'` (la cita ya se realizó).

## [1.25.0] - 2026-07-27

### Fixed

- **Se podía agendar en un día marcado como "no laboral"**: el horario semanal (Ajustes → Horario, días de atención) nunca se validaba al crear/mover una cita — solo se revisaban las "Fechas especiales" puntuales (Ajustes → Fechas especiales). Por eso se podía agendar, por ejemplo, un domingo aunque el estudio tuviera configurado no trabajar los domingos. Corregido en dos frentes:
  - **Validación real (servidor)**: `createSessionAction`, `createSessionsBulkAction` y `rescheduleSessionAction` ahora también rechazan la fecha si su día de la semana no está entre los días de atención configurados (nueva `isWeekdayClosed` en `lib/sessions/availability.ts`).
  - **Calendario visual**: los días de la semana cerrados ahora se pintan como bloqueados igual que las fechas puntuales, tanto en Inicio como en los pickers de fecha al agendar (`getAvailabilityAction`, `getCalendarPopupDataAction`) — nueva utilidad `expandClosedWeekdays` en `calendar/utils.ts`.

### Added

- **Aviso a la hora de cierre si no se registró ningún pago**: nueva Edge Function en Supabase (`payment-reminders`, vía `pg_cron` cada 15 min, mismo patrón que `session-reminders`) que revisa, por cada estudio, si ya pasó su hora de cierre (`Ajustes → Horario`) y hubo citas ese día sin ningún pago registrado — si es así, manda notificación in-app + push ("💰 Pagos del día") enlazando a Finanzas. Dispara una sola vez por día (ventana de 15 min desde el cierre). Ya incluye el saneo de llaves VAPID (mismo fix del `BadJwtToken`).

## [1.24.9] - 2026-07-27

### Fixed

- **Encontrado el error real**: gracias al logging de 1.24.8, los logs de Vercel mostraron `statusCode: 403, body: '{"reason":"BadJwtToken"}'` — Apple está rechazando la firma del token VAPID, no un problema de formato Base64 (eso ya estaba resuelto). Esto pasa cuando `VAPID_SUBJECT` trae basura pegada (mismo tipo de problema que ya afectaba a las llaves) o cuando la llave pública/privada en Vercel no forman un par válido. `VAPID_SUBJECT` ahora también se sanea (espacios/saltos de línea). Se agregó además un log seguro con el LARGO de cada llave ya saneada (nunca el contenido) para poder confirmar si llegaron completas a Vercel — una pública válida son 87 caracteres, una privada 43.

### Known Issues

- El "BadJwtToken" de Apple casi siempre significa que la llave pública y la privada en Vercel no son del mismo par (por ejemplo, se regeneró una sin regenerar la otra). **Recomendado**: generar un par nuevo con `npx web-push generate-vapid-keys` y reemplazar AMBAS variables en Vercel (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`) a la vez, sin mezclar con las anteriores. Después de guardar, hace falta un redeploy y que los tatuadores reactiven el push desde la campana (la suscripción vieja quedó atada a la llave pública anterior).

## [1.24.8] - 2026-07-27

### Fixed

- **Push seguía sin llegar, sin ninguna pista**: revisé los logs de Vercel en el deploy con el fix de la llave VAPID (1.24.7) — el error `Vapid public key must be a URL safe Base 64` ya NO aparece (la llave se está saneando bien) y sí se intenta mandar cada push (se ve el aviso interno de `web-push` al armar la petición). Pero si el envío en sí fallaba por cualquier motivo que no fuera "suscripción caducada" (404/410), el código lo ignoraba en silencio — no había forma de saber la razón real. Ahora cualquier otro código de error (400/401/403/etc.) queda registrado en los logs de Vercel con el detalle completo, para poder diagnosticar la próxima vez que se dispare un push.

### Known Issues

- Push sigue sin confirmarse que llegue al dispositivo — con este cambio, la próxima vez que se dispare (cotización nueva, consentimiento firmado, etc.) los logs de Vercel van a mostrar el motivo exacto si vuelve a fallar.

## [1.24.7] - 2026-07-27

### Fixed

- **Causa real de que nunca llegaran los push**: revisé los logs de Vercel y encontré el error exacto — `Vapid public key must be a URL safe Base 64 (without "=")`. La llave pública en Vercel está en Base64 estándar (con `=` de relleno), pero `web-push` exige Base64 *URL-safe sin padding*. `ensureConfigured()` ahora sanea ambas llaves (pública y privada) antes de pasarlas a `setVapidDetails` — mismo tipo de normalización que ya se hacía del lado del navegador en `lib/push/client.ts`, ahora también del lado del servidor. Con esto los push deberían empezar a salir sin tener que tocar nada en Vercel.
- **`ReferenceError: getStudioId is not defined`** en `bulkCreateClientsAction` (importar contactos del teléfono) y `findClientProjectsByPhoneAction` (popup "Agendar cita" del calendario, buscar cliente/proyecto por teléfono) — este archivo (`actions/clients.ts`) llamaba a una función que nunca se definió ni importó ahí (sí existe como helper local en otros archivos, pero no en este). Estaba rompiendo esas dos funciones en producción desde el 25 de julio. Corregido usando `getCurrentStudio()`, que este archivo ya importaba para lo demás.

### Known Issues

- Los logs de Vercel muestran también un error puntual `[db] 22P02 invalid input syntax for type uuid: "undefined"` en `/dashboard` (25-26 jul, 1 ocurrencia) — no identificado todavía, pendiente de investigar si vuelve a aparecer.
- Si el recordatorio de sesión (Edge Function `session-reminders` en Supabase, fuera de este repo) usa las mismas llaves VAPID sin la misma limpieza, podría tener el mismo problema — revisar si sus push tampoco están llegando.

## [1.24.6] - 2026-07-27

### Fixed

- **Consentimiento se quedaba "a medias" si el push fallaba**: `webpush.setVapidDetails` (llamado al mandar cualquier push) lanza una excepción SÍNCRONA si la llave VAPID está mal formada — y esa llamada vivía fuera del try/catch de `sendPushToSubscriptions`. Cuando eso pasaba durante la firma de un consentimiento, el link ya había quedado marcado `signed` (con la firma guardada) pero la excepción cortaba el código ANTES de crear el registro final en `consents` — el cliente veía "firma guardada" pero el estudio nunca tenía el consentimiento, y cualquier reintento chocaba con "Este enlace ya no está disponible" sin forma de arreglarlo. Corregido en dos frentes: `ensureConfigured()` ahora captura esa excepción (y recuerda el fallo para no reintentar), y en `submitSignedConsentAction` el registro de `consents` ahora se crea ANTES de mandar notificaciones/push (que además quedaron en su propio try/catch) — un fallo del push ya no puede tumbar el guardado del consentimiento.
- Reparado en base de datos un consentimiento que había quedado en ese estado a medias (firma real del cliente, sin registro creado) — no hizo falta pedir la firma de nuevo.

## [1.24.5] - 2026-07-26

### Added

- **Borrar consentimiento**: cada fila de Consentimientos ahora tiene un botón de basura (con confirmación) — borra el consentimiento firmado y el link asociado. El proyecto vuelve a quedar sin consentimiento firmado, así que "Iniciar sesión" se bloquea de nuevo y se puede generar uno nuevo (antes no había forma de deshacer una firma). Nueva `deleteConsentAction`; se agregó la política RLS de `DELETE` en `consent_links` que faltaba (solo existían INSERT/UPDATE).
- **Ver el documento completo desde Consentimientos**: tocar una fila en `/dashboard/consents` abre el PDF entero en una pestaña nueva (antes la lista solo mostraba nombre + badge "Firmado/Pendiente", sin forma de ver el contenido). La ruta `/api/consent-links/[id]/pdf` ahora sirve el PDF como `inline` en vez de forzar la descarga.
- **Check de "Consentimiento firmado" en Inicio**: en la tarjeta de "Próxima sesión"/"Sesión de hoy", si el proyecto ya tiene un consentimiento firmado, el botón "Consentimiento" se reemplaza por una insignia ✓ "Consentimiento firmado" — ya no deja abrir el popup para generar (y reenviar) un link nuevo por encima. `createConsentLinkAction` también lo bloquea del lado del servidor (no solo ocultando el botón).

## [1.24.4] - 2026-07-26

### Fixed

- **Firmar consentimiento no avisaba a nadie**: al firmar, ahora se genera una notificación (campana + push) **"✅ Consentimiento firmado"** para el tatuador asignado al proyecto (o para todo el estudio si el proyecto no tiene tatuador asignado). Antes no se generaba ningún aviso al firmar.
- **Alerta médica sin push**: si el cliente marcó "Sí" en alguna pregunta de salud, la alerta ⚕️ ya llegaba a la campana in-app del tatuador asignado pero nunca como push (llegaba solo si tenías OFINK abierto). Ahora también dispara `sendPushToArtist`, igual que el resto de notificaciones dirigidas.

## [1.24.3] - 2026-07-26

### Fixed

- **"The string contains invalid characters"** al activar push: la llave `NEXT_PUBLIC_VAPID_PUBLIC_KEY` traía algún espacio/salto de línea pegado (común al copiarla a Vercel), y `atob()` truena con eso. Ahora se limpia antes de decodificarla, y si aun así no queda del largo correcto (65 bytes), el aviso lo dice explícitamente en vez de un error críptico.

## [1.24.2] - 2026-07-26

### Fixed

- **"No se pudo activar el push" sin detalle**: `subscribeToPush` ahora limpia sola cualquier suscripción vieja del navegador que haya quedado con una llave VAPID distinta (típico de intentos anteriores a que las llaves quedaran configuradas) en vez de fallar contra ella, y cuando algo sí falla, el toast muestra el motivo real (antes era un mensaje genérico sin pistas).

## [1.24.1] - 2026-07-26

### Changed

- **Recordatorio de cita movido 100% a Supabase**: el cron ya no depende de Vercel (que en plan Hobby solo corre una vez al día) — ahora es `pg_cron` + `pg_net` llamando cada 10 min a una Edge Function propia (`session-reminders`, ya desplegada). Se quitó `vercel.json` y la ruta `/api/cron/session-reminders`. Requiere configurar los *secrets* de la Edge Function en el dashboard de Supabase (Edge Functions → session-reminders → Secrets): `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` y `CRON_SHARED_SECRET`.

## [1.24.0] - 2026-07-26

### Added

- **Recordatorio push 1 hora antes de la cita**: nuevo cron de Vercel (`vercel.json`, cada 10 min → `/api/cron/session-reminders`) que busca sesiones agendadas dentro de 55–65 min sin recordatorio enviado (`sessions.reminder_sent_at`, columna nueva) y manda un push + notificación in-app SOLO al tatuador asignado de esa cita. Requiere la variable de entorno `CRON_SECRET` en Vercel (protege el endpoint; sin ella, cualquiera podría llamarlo a mano). **Importante**: en el plan Hobby de Vercel los crons corren como máximo una vez al día — para que el recordatorio llegue de verdad cada 10 min hace falta plan Pro o superior.
- **"Iniciar sesión" ahora exige consentimiento firmado**: el botón ▶ (en "Próxima sesión" y en cada fila de "Sesiones de hoy") ya no abre el popup de materiales/insumos si el proyecto todavía no tiene un consentimiento firmado — avisa por toast y no deja avanzar, mismo criterio que ya existía para confirmar los insumos antes de arrancar el cronómetro. Nuevo `getProjectIdsWithSignedConsent` en `queries/consents.ts`.

## [1.23.0] - 2026-07-26

### Added

- **Selector visual de zona en el consentimiento**: si el proyecto ya trae zona de la cotización, se muestra fija (con botón "Cambiar zona"); si no hay ninguna, se abre directo el mismo explorador anatómico con fotos reales que usa el tatuador al cotizar (`BodyMapExplorer`), en vez de un campo de texto libre.

### Fixed

- **"Firmar y confirmar consentimiento" se quedaba cargando para siempre**: `handleSubmit` no tenía try/catch, así que cualquier excepción dejaba el botón en "Enviando…" sin resolver nunca. Ahora siempre libera el loading (`finally`) y avisa por toast si algo falla. Se agregó la misma red de seguridad en el servidor (`submitSignedConsentAction`): cualquier error inesperado ahora vuelve como un `Result` en vez de una excepción sin manejar.

## [1.22.1] - 2026-07-26

### Fixed

- **Push no llegaba**: `push_subscriptions` estaba vacía — el permiso de iOS se concedía, pero la suscripción real nunca se guardaba (típicamente porque `NEXT_PUBLIC_VAPID_PUBLIC_KEY` no estaba disponible en el navegador). Ahora, si `subscribeToPush` falla, la campana avisa con un toast en vez de fallar en silencio, para que sea obvio que falta configuración en vez de parecer que "ya quedó activado".

## [1.22.0] - 2026-07-26

### Added

- **Consentimiento informado rediseñado como wizard de 6 pasos** (Proyecto → Datos personales → Salud → Diseño → Declaraciones → Firma), con barra de progreso y check verde por paso completado. `public-consent-form.tsx` reescrito por completo.
- **Precarga real desde el cliente y el proyecto**: `getPublicConsentLink` ahora trae nombre, documento, fecha de nacimiento (con edad calculada sola), teléfono, correo y dirección del cliente si ya existen (editables); y del proyecto trae zona, descripción, tamaño, sesiones, duración, valor, foto principal, tatuador y próxima fecha/hora, con un check "Confirmo que este es el diseño que voy a tatuarme" antes de avanzar.
- **Salud dinámica**: cada pregunta con respuesta "Sí" despliega ahí mismo un campo obligatorio "Explícanos brevemente" (antes un único cuadro de texto compartido al final).
- **Alerta médica automática y privada**: si el cliente marca "Sí" en cualquier pregunta de salud, se guarda `has_medical_alert` en el consentimiento y se notifica *solo al tatuador asignado* (nunca al resto del equipo) — aparece en la campana, como banner rojo en el proyecto (con detalle desplegable, solo preguntas+explicación, nunca todo el formulario) y como ícono de alerta en cada fila de "Sesiones de hoy". `notifications` ahora soporta `artist_id` para notificaciones dirigidas a una sola persona.
- **Datos del cliente persistidos para la próxima vez**: al firmar, tipo/número de documento, fecha de nacimiento y dirección quedan guardados en el cliente (`clients.document_type/document_number/address`, columnas nuevas).
- PDF del consentimiento actualizado: detalle por pregunta de salud (ya no uno compartido) y línea de confirmación del diseño.

### Fixed

- **Seguridad**: la política RLS de `consent_links` permitía leer CUALQUIER consentimiento (incluidas las respuestas de salud) sin restricción alguna, de cualquier estudio. Reemplazada por una que solo deja verlo al tatuador asignado al proyecto o al dueño del estudio.

## [1.21.0] - 2026-07-26

### Changed

- **Inicio (móvil) rediseñado para caber en una sola pantalla, sin scroll**: encabezado, calendario, próxima sesión, indicadores, resumen del día (con Caja) y la primera sesión de hoy ahora entran completos en un iPhone estándar. Reducidos paddings/tipografías/gaps en `home-greeting`, `calendar-card` + `week-strip` (pastillas de día más chicas), `next-session-card` (foto, hora y botones más compactos, conservando toda la info y acciones), `today-cards` (ahora una sola tarjeta agrupada en vez de 3 sueltas) y `day-summary`. Ningún dato ni acción se quitó, solo se reorganizó el espacio.
- **Una sola campana de notificaciones**: el botón aparte de "Activar notificaciones push" se fusionó dentro de la campana — aparece como primer ítem del menú solo si el navegador soporta push y el dispositivo aún no está suscrito, y desaparece apenas se concede el permiso. Se eliminó `push-subscribe-button.tsx` (ya no hace falta).
- **Botón "Caja" integrado en "Resumen del día"**: ahora es una acción compacta al costado del anillo de progreso, en vez de una fila completa aparte.
- Ajustado el texto del paso "Inicio" del tutorial guiado para reflejar la nueva vista compacta.

## [1.20.0] - 2026-07-26

### Added

- **Arrastrar una cita para moverla**: en la vista Día del calendario (popup de Inicio), mantener presionada una cita y luego arrastrarla la reagenda directo, sin abrir ningún formulario — verticalmente cambia la hora (saltos de 15 min, con una etiqueta que muestra la hora de destino mientras se arrastra), y soltada sobre uno de los días de la franja de arriba la mueve a ese día (misma hora). Si solo se mantiene presionada sin moverla, sigue abriendo el menú Reagendar/Eliminar de siempre. Usa la misma validación que "Reagendar" (día bloqueado, choque de horario) — si falla, se avisa por toast y la cita no se mueve. `calendar-nav.tsx`: nueva prop `onMoveSession` en `CalendarNav`/`DayTimeline`; conectada en `home-calendar-dialog.tsx`.

## [1.19.0] - 2026-07-26

### Added

- **Notificaciones push nativas**: cada cotización nueva del bot ahora dispara, además de la campana in-app de siempre, un push real del navegador/teléfono (llega aunque OFINK esté cerrado). Al tocarla abre la cotización puntual (`/dashboard/quotes/{id}`, antes la campana enlazaba genérico a la lista). Nuevo: tabla `push_subscriptions` (RLS por estudio), `actions/push.ts`, `lib/push/send.ts` (server, usa `web-push`) y `lib/push/client.ts` (suscripción del navegador). Botón "Activar notificaciones" junto a la campana (aparece solo si el navegador soporta push y todavía no está suscrito); una vez concedido el permiso, `RegisterSW` lo re-sincroniza solo en cada visita, sin volver a preguntar. Requiere las variables de entorno `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` en Vercel (sin ellas, el push simplemente no se envía — nada se rompe).
- **Botón "Agenda" del menú-pulpo**: ahora abre un popup con el listado plano de todas las citas creadas, de la más próxima a la más lejana, cada una con enlace directo a su proyecto — antes abría el calendario en vista Mes. El calendario Día/Semana/Mes sigue disponible desde "Ver todo"/tocar un día en la tarjeta Calendario de Inicio, sin cambios. Nuevo `agenda-list-dialog.tsx`; el botón usa `?openAgenda=1` en vez de `?openCalendar=1`.

## [1.18.0] - 2026-07-26

### Added

- **Botón "Caja" en Inicio** (reemplaza a "Registrar pagos del día", justo debajo de "Resumen del día"): popup con dos entradas — cobros pendientes del día (proyectos con sesión hoy) y abono a cualquier otro proyecto activo con saldo pendiente (buscador por cliente/proyecto). Al elegir uno se abre un detalle: valor del proyecto, abonos realizados (fecha + monto + método), saldo pendiente, monto a recibir y selector de método de pago (usa los métodos configurados en Ajustes → Estudio → Pagos; si no hay ninguno, cae a la lista sugerida). Registrar un cobro sigue el mismo paso "¿cómo va el proyecto?" que ya existía. Componentes nuevos: `caja-dialog.tsx`, `caja-button.tsx`. `register-day-payments-dialog.tsx` (el flujo anterior) se eliminó — sin más usos.
- **`payments.payment_method`** (columna nueva, texto libre): se guarda en cada cobro registrado desde Caja; los pagos hechos desde el detalle de proyecto (`RegisterPaymentDialog`) siguen sin método, sin cambios ahí.
- **"Resumen de caja" en Finanzas**: cuenta y suma de los tickets del mes con método de pago (o sea, los de Caja), desglosados por método. Nueva `cajaTicketsSummary()` en `lib/finance/metrics.ts` y card `FinanceCajaCard`.

## [1.17.0] - 2026-07-26

### Added

- Autenticación (login, registro).
- Onboarding.
- Clientes.
- Cotizaciones (incluye wizard y API `api/quotes`).
- Proyectos.
- Calendario.
- Sesiones.
- Pagos.
- Consentimientos (incluye enlaces públicos vía `api/consent-links` y ruta `(public)/c/[token]`).
- Galería.
- Ajustes (settings).
- Bot/mensajería (ruta `(bot)/t`).
- PWA (manifest.webmanifest, service worker `sw.js`, página offline).
- **Botón "Finalizar" en Sesiones de hoy (Inicio)**: cada cita de la lista "Sesiones de hoy" (móvil y escritorio) ahora tiene un botón para marcarla como completada sin salir de Inicio. Si el proyecto de esa cita **ya tenía algún pago registrado de antes**, además pregunta "¿cómo va el proyecto?": completado (pide la foto del resultado final antes de guardar) o % de avance (con una barra deslizante, ya no un campo de texto). Si el proyecto todavía no tiene ningún pago, se finaliza la sesión sin preguntar nada más — ese paso se sigue resolviendo, como antes, desde "Registrar pagos del día" justo al registrar el pago.
  - Ese paso ("¿cómo va el proyecto?") se extrajo a un componente propio y compartido (`components/home/project-completion-step.tsx`), reutilizado ahora tanto por "Registrar pagos del día" como por el nuevo botón "Finalizar" — antes vivía duplicado sin exportar dentro de `register-day-payments-dialog.tsx`.
- **Tutorial de bienvenida interactivo (recorrido guiado con spotlight)**: se abre solo, una vez, cuando alguien crea una cuenta nueva (tatuador independiente, dueño de estudio o colaborador que se une) — nunca para cuentas que ya existían. Oscurece la pantalla, resalta con un aro verde el elemento real de la interfaz que está explicando (nunca una ilustración ni una clase CSS: todo apunta a atributos `data-tour` puestos sobre los componentes de siempre) y muestra una tarjeta con número de paso, título, descripción breve y los botones Atrás/Siguiente/Omitir. Navega solo entre pantallas cuando el paso lo requiere (por ejemplo, de Inicio a Cotizaciones) y guarda en qué paso va en Supabase (tabla nueva `tour_progress`), así que si cierra la app a medias, sigue exactamente donde quedó la próxima vez.
  - Dos recorridos distintos según el tipo de Home que esa cuenta ve (`src/lib/tour/tour-config.ts`, un solo archivo de configuración — agregar/quitar/reordenar pasos no toca el motor): **Tatuador** (16 pasos: Bienvenida, Inicio, Agenda del día, Temporizador de sesión, Barra de navegación, Inicio, Cotizaciones, Crear cotización, Lista de cotizaciones, Botón central del pulpo, Calendario, Crear cita, Perfil, Servicios, Ajustes, Finalización) y **Estudio** (9 pasos: Bienvenida, Dashboard, Agenda general, Lista de tatuadores, Añadir tatuador, Permisos, Finanzas, Configuración del estudio, Finalización) — los colaboradores (members) reciben el recorrido de Tatuador, porque ven ese mismo Home.
  - Cada paso admite varios `data-tour` candidatos en orden de preferencia (p. ej. `['quote-create-desktop', 'octopus-trigger']`): OFINK tiene versiones distintas de una misma función en móvil vs. escritorio (el pulpo central solo existe en móvil), así que el motor usa el primero que esté realmente visible en pantalla — **si ninguno existe, el paso se omite solo, sin bloquear jamás el recorrido**.
  - Motor nuevo `src/components/shared/guided-tour.tsx`: mide el elemento real con `getBoundingClientRect()`, recalcula la posición en scroll/resize (teclado de iOS, rotación de pantalla), hace scroll automático hasta el elemento antes de mostrar el spotlight, respeta `prefers-reduced-motion` (desactiva las transiciones), navegación completa por teclado (flechas para avanzar/retroceder, Esc para omitir) y foco accesible en cada paso. Reemplaza al modal simple anterior (`onboarding-tour.tsx`, sin spotlight ni persistencia — se retiró).
  - Ajustes → Cuenta → nueva sección **"Ayuda"**: botón "Repetir tutorial guiado" para volver a verlo completo cuando se quiera, desde el paso 0 (antes vivía sin agrupar, junto a "Cuentas OFINK").
  - Las ayudas contextuales por sección (banner que explica una pantalla la primera vez que se visita, `page-hint.tsx`) ya existían de antes y se mantienen tal cual — cumplen el pedido de "pequeñas ayudas contextuales que solo aparezcan una vez en funciones importantes" sin necesidad de duplicar ese mecanismo.
  - Tabla `tour_progress` (una fila por cuenta, `unique(artist_id)`): `status` (`pending`/`in_progress`/`completed`/`skipped`) y `current_step`. RLS: cada quien lee solo su fila; toda escritura pasa por server actions con el cliente admin (`src/actions/tour.ts`), mismo patrón que `artists`. Se inicializa en 'pending' desde `initTourProgress()` (`src/lib/tour/init-tour-progress.ts`), llamado en los 4 puntos donde se crea una cuenta nueva: `completeProfileStep` (tatuador), `createStudioOnboarding` (estudio), y las dos altas de colaborador (`collaborators.ts`, `team.ts`). Las cuentas que ya existían antes de esta migración se dejaron en 'completed' vía backfill, para que el tour no les aparezca solo.
- **Pantalla "Hoy es tu día de descanso"**: cuando la fecha de hoy está en Ajustes → Estudio → Fechas especiales (bloqueada), Inicio se tapa con una pantalla de cortesía (logo de OFINK + texto + motivo, si se registró uno) y un botón "Acceder" para entrar igual a la interfaz. Nuevo componente `src/components/home/rest-day-gate.tsx`, montado en `dashboard/page.tsx` (cubre tanto el Home normal como el de Estudio). No toca el bloqueo de agenda que ya existía (`findBlockedDay`, sigue impidiendo agendar sesiones ese día); "Acceder" solo esconde el gate para esa pestaña y ese día (`sessionStorage`), así que no interrumpe si se navega de vuelta a Inicio.

### Removed

- `src/components/shared/onboarding-tour.tsx` (el tutorial modal simple, sin spotlight ni persistencia) — reemplazado por el recorrido guiado de arriba. `src/lib/tutorial-content.ts` perdió `TOUR_STEPS`/`OPEN_TUTORIAL_EVENT` (movidos y ampliados en `src/lib/tour/tour-config.ts`); conserva `PAGE_HINTS` tal cual, sin cambios, para las ayudas contextuales.

### Changed

- **Transición al deslizar entre citas en "Próxima sesión" (Inicio)**: ahora es la tarjeta ENTERA la que cambia (contador, foto, hora, cliente, botones y puntos de posición se mueven juntos como una sola pieza) — antes solo se deslizaba el contenido interno unos pocos píxeles y no se sentía como pasar a otra tarjeta. La saliente se encoge y desliza hacia el lado por el que "se fue"; la entrante llega completa desde el lado contrario, con `motion/react` (la misma librería del FAB del pulpo, sin dependencias nuevas).
- **Rediseño completo de Cotización Rápida** (`/dashboard/quotes/quick`), a partir de un mockup de referencia — misma lógica y las mismas server actions de siempre (`createClientAction`, `createQuoteAction`, `convertQuoteToProjectAction`, `transcribeAudioAction`, etc.), interfaz completamente nueva tipo panel de escritorio (Apple/Linear/Stripe): fondo negro profundo, tarjetas grandes con número de sección, y **dos columnas visibles sin scroll en escritorio/iPad** (una sola columna en móvil, con la misma identidad).
  - Barra superior nueva con **"Paso X de 8" + barra de progreso animada**, que avanza sola según cuántas de las 8 secciones ya tienen algo cargado — no es un wizard secuencial, todo sigue visible a la vez.
  - **Cliente**: los dos botones (nuevo/existente) ahora son tarjetas grandes con ícono, con escala y sombra verde al seleccionar.
  - **Foto de referencia**: tarjeta con soporte real de arrastrar-y-soltar (antes solo `<input type="file">` disfrazado); al cargar una, aparece con miniatura, nombre, peso en MB y una insignia "aprobado" animada con fade.
  - **Idea del tatuaje**: se quitó el botón flotante de dictado — el micrófono ahora vive integrado dentro del propio textarea (esquina inferior derecha), con un consejo (`✨ Sé específico…`) debajo.
  - **Estilo**: nuevo selector en grilla de fotografías grandes y selección única (`StyleGridPicker`, `quick-quote-extras.tsx`) — reemplaza al carrusel horizontal multi-selección en esta pantalla; incluye tarjeta "Ver más" que abre el resto de los estilos del estudio en un popup. Sigue guardando el mismo `style: string | null` de siempre.
  - **Número de sesiones**: el input numérico se reemplazó por chips grandes (1/2/3/4/5+) — "5+" guarda `5`, exactamente lo que ya aceptaba `session_count` antes.
  - **Precios preestablecidos**: los chips simples se convirtieron en tarjetas con checkbox, subtítulo y precio alineado a la derecha; se ilumina y el precio se pone verde al activarse.
  - **Precio total**: tarjeta protagonista con el número en grande y **conteo animado** cada vez que cambia (presets marcados o precio ajustado a mano), usando los primitivos de animación de `motion/react` que ya trae el proyecto — sin librerías nuevas.
  - **Barra de resumen inferior fija** (`QuickQuoteSummaryBar`) con estilo/zona/sesiones/precio en tiempo real y el CTA principal "Continuar" (dispara "Crear proyecto", la misma acción de siempre). El botón "Crear cotización y enviar por WhatsApp" se conservó, ahora como acción secundaria de texto arriba de la barra — ninguna de las dos funciones se eliminó.
  - **Zona y tamaño exactos**: sigue abriendo el mismo `BodySizeCards`/`BodyMapExplorer` del bot (cero cambios ahí), pero el botón que lo abre ahora es una tarjeta visual con ícono y, una vez elegida la zona, muestra "Zona seleccionada" y el tamaño igual que en la referencia. *Nota honesta: la referencia sugiere un mapa de cuerpo frontal/posterior en miniatura embebido directo en la tarjeta — ese asset (silueta con la zona resaltada) no existe todavía en el proyecto (ver "Body zone SVG assets" en Known Issues, requiere ilustrador); se optimizó la tarjeta que abre el selector real en vez de simular uno que no existe.*
  - Componentes nuevos y reutilizables: `quick-quote-parts.tsx` (badge numerado, tarjeta de sección, tarjeta de opción grande, chip, tarjeta de preset), `quick-quote-extras.tsx` (precio animado, selector de estilo en grilla, barra de resumen) y `quick-quote-topbar.tsx` (barra superior + progreso).

### Fixed

- **"Próxima sesión" mostraba siempre la segunda cita del día, no la primera**: bug real de zona horaria. `scheduled_at` se guarda con la hora de Bogotá escrita directo en los componentes UTC del timestamp (convención de OFINK, ver `calendar/utils.ts`), pero el cálculo de "cuál cita mostrar primero" comparaba contra `Date.now()` (el instante UTC de verdad) — como Bogotá es UTC-5, esa comparación traía un corrimiento constante de 5 horas: una cita de las 9:00a que en la vida real todavía no había empezado ya se veía "pasada" desde las 9:00a **UTC** (4:00a en Bogotá), así que "Próxima sesión" se saltaba la primera cita del día y mostraba la segunda. Se agregó `nowAsWallClock()` (mismo instante actual, pero expresado en la misma convención que `scheduled_at`) y se corrigió esta comparación en `dashboard/page.tsx`. De paso se corrigieron los mismos síntomas en otros lugares que comparaban `scheduled_at` contra la hora real: el estado "en curso"/"próxima cita" de tatuadores en el Home de Estudio (`studio-home.ts`), la grilla de agenda del Estudio (`agenda-grid.tsx` — que además tenía un segundo bug aparte: `hourOf` usaba `.getHours()` en vez de `.getUTCHours()`, corriendo cada cita 5 filas hacia arriba en la grilla), "próxima sesión" de un proyecto (`projects/metrics.ts`), próximas/pasadas citas de un cliente (`clients/dossier.ts`) y el estado "vencido/próximo" de pagos pendientes (`finance/metrics.ts`).
- **Barra "Guardar"/"Continuar" tapando el campo que se está editando**: reportado en Ajustes → Mensajes (plantillas de WhatsApp) — al tocar el textarea de la última plantilla para escribir, el teclado de iOS aparecía y la barra "Guardar" terminaba flotando encima del propio campo, sin dejar verlo ni escribir con comodidad. Causa: esas barras usaban `position: sticky`, que Safari sigue calculando contra el alto "de layout" de la página (sin descontar el teclado) en vez del viewport visible más chico que queda cuando el teclado está abierto — a diferencia de `position: fixed`, que sí se recalcula bien (por eso la navegación inferior, el FAB del pulpo y el footer del wizard de cotización, todos `fixed`, nunca tuvieron este problema). Se cambiaron a `fixed` las 3 barras que compartían el mismo patrón `sticky bottom-0`: la barra "Guardar" de Ajustes (`settings-subpage.tsx`), y el CTA "Continuar" del onboarding de tatuador y del onboarding de estudio (`step-shell.tsx`, `estudio-step-shell.tsx`). Se agregó el padding inferior equivalente en cada pantalla para que, ahora que esas barras ya no reservan espacio en el flujo normal, el contenido no quede escondido detrás.

## [1.16.0] - 2026-07-26

### Changed

- **Rediseño completo de Ajustes** (panel de control): cápsula "TATUADOR/ESTUDIO" arriba, héroe con foto/nombre/insignia PRO/ciudad/link público/anillo de progreso, fila de métricas reales (clientes, citas del mes, ingresos del mes, tasa de cierre — reemplaza a los checks verdes de antes), cuadrícula de 2 columnas con tarjetas compactas (Estudio, Clientes, Bot, Cotizaciones, Personalización, Cuenta y Equipo si aplica), fila de Accesos rápidos (WhatsApp/Link público/Código QR nuevo/Compartir) y Ayuda reducida a 3 líneas + Cerrar sesión discreto al final.
- **Ninguna opción se eliminó**: las listas largas de antes (Perfil, Horario, Finanzas, Gastos, Inventario, Fechas, Galería, Consentimientos, Mensajes, Abono, Pagos, Precios, Políticas, Carta, Metas, tema/colores/logo, Plantillas de WhatsApp, Perfil de artista, Cuentas OFINK) siguen existiendo tal cual, ahora organizadas en 5 páginas-hub nuevas (una por tarjeta: `/dashboard/settings/estudio`, `/clientes`, `/cotizaciones`, `/personalizacion`, `/cuenta`) a las que se entra tocando la tarjeta correspondiente — nada de lógica ni rutas cambió, solo dónde vive cada lista.
- Métricas del héroe (`queries/settings-metrics.ts`) calculadas con las mismas queries/helpers de Inicio y Estadísticas (`monthMetrics`, `getClients`, `getQuotes`, `getSessions`, `getProjects`) — nada inventado; "tasa de cierre" = cotizaciones aprobadas / total de cotizaciones creadas este mes.
- Nuevo Código QR del link público (`api.qrserver.com`, sin librería nueva) en Accesos rápidos.

## [1.15.0] - 2026-07-26

### Changed

- **Paso 1**: solo Nombre, Nombre artístico y WhatsApp (se quitó Ciudad).
- **Paso 2**: sin límite de especialidades — se puede elegir todas las que quieras (antes tope de 5).
- **Paso 3**: se quitó "¿Tatúas a tiempo completo?" — queda solo años tatuando y cómo trabajas.
- **Paso 4**: se quitó "¿Cuántos artistas trabajan?"; se agregó enlace de Google Maps (mismo patrón "Buscar → pega el link" que ya usa Ajustes → Perfil).
- **Paso 5**: iconos de redes más grandes; recuadro nuevo explicando que el enlace `t/slug` es su página pública tipo Linktree y que más adelante podrá reunir ahí todos sus enlaces personalizados.
- **Pantalla de finalización**: dura más (ritmo de ~0.55s por ítem en vez de ~0.32s) y ya NO avanza sola al terminar el checklist — aparece un botón "Entrar a OFINK" y solo pasa a la bienvenida cuando se toca.

### Added

- **Bloqueo automático de días no laborales**: al terminar el onboarding, los días de la semana que el estudio NO marcó como de atención en el paso 4 se bloquean solos en el calendario (90 días hacia adelante), reutilizando la tabla `blocked_days` ya existente — se pueden desbloquear en cualquier momento desde Ajustes → Fechas, igual que cualquier otro día.
- **Días bloqueados con estilo propio en el calendario** (mes, semana y día): ahora se ven gris con rayas diagonales, antes eran indistinguibles de un día con citas (mismo color verde tenue para ambos).
- Migración: constraint único `(studio_id, date)` en `blocked_days` (evita duplicados del bloqueo automático).
- Columna `maps_url` del paso 4 ahora viaja en el schema/acciones del onboarding (antes solo existía en Ajustes).

## [1.14.0] - 2026-07-26

### Added

- **Pantalla de finalización del onboarding de tatuador**: al pulsar "Finalizar registro" ya no se entra directo al dashboard — primero se ve "Configurando tu estudio digital…" con un checklist de 7 ítems que se van marcando solos (Perfil, Agenda, Especialidades, Políticas, Mi Link, Calendario, "¡Todo preparado!"), el último solo se marca cuando `finishOnboarding()` de verdad respondió con éxito (nunca miente que algo está listo antes de tiempo). Después sigue exactamente la pantalla de bienvenida que ya existía (`/onboarding/listo`) — sin tocar esa lógica.
- **Paso 2 (Especialidad)**: máximo 5 estilos con contador "X/5 seleccionadas" (antes sin límite), tarjetas más grandes (2 por fila) con animación de escala al seleccionar.
- **Paso 6 (Abono)**: insignia "Recomendado" en la card de 20%.
- **Paso 7 (Políticas)**: las reglas del estudio pasaron de tarjetas grandes a **switches modernos** (interruptor real a la derecha); "Otras reglas" ahora es un botón aparte "+ Nueva regla personalizada" en vez de vivir mezclado en la grilla de switches.
- **Paso 8 (Resumen)**: filas nuevas para Especialidades y Experiencia (antes no aparecían en el resumen); cada fila ahora dice "Editar" explícito en vez de solo una flecha.
- **Paso 1 (Perfil)**: ejemplo breve debajo de Nombre, Nombre artístico y Ciudad (el campo WhatsApp ya tenía uno).
- Pasos 3 y 4 (Experiencia/Estudio): espaciado vertical reducido para acercarse a "una sola pantalla sin scroll".

### Notes

- El paso 5 (Redes sociales) ya tenía la vista previa del perfil público pedida — no requirió cambios.
- No se tocó `canContinue`, `saveStep`, los schemas de validación, ni los flags `required` de `ONBOARDING_STEPS` (Perfil y Estudio siguen siendo los únicos 2 pasos obligatorios, sin "Saltar por ahora") — el mockup muestra ese botón en los 8 pasos, pero cambiar esos flags altera qué se puede saltar, y la instrucción explícita fue no tocar la lógica existente.

## [1.13.0] - 2026-07-26

### Fixed

- **Bug real de actualización de OFINK** (`version-info.tsx`, botón "Buscar actualizaciones"): llamaba `reg.update()` y, en el mismo tick síncrono, leía `reg.waiting` para activarlo — pero instalar el Service Worker nuevo es asíncrono, así que `reg.waiting` todavía era `undefined` en ese instante. El mensaje nunca llegaba a nadie y el `setTimeout(reload, 400)` recargaba igual, con el worker VIEJO todavía en control: el botón decía "Actualizando…" pero la app se quedaba en la misma versión siempre. Ahora espera de verdad a que el worker nuevo termine de instalar (`statechange` → 'installed') antes de mandar `SKIP_WAITING`, y deja que el reload lo dispare el listener global de `controllerchange` (`register-sw.tsx`), no un `setTimeout` a ciegas.
- **Vista previa de "Personalizar Mi Link" en móvil**: la X para cerrar ahora tiene z-index por encima de cualquier otra capa de la app (tutorial guiado, FAB, etc.), botón más grande y `stopPropagation` explícito — antes podía quedar tapada o sin registrar el toque en ciertos casos.

### Changed

- **Tutorial guiado (spotlight)**: el elemento que explica cada paso se ve exactamente como lo muestra la app de verdad (nada lo tapa ni lo oscurece); el resto de la pantalla ahora tiene **desenfoque real** (`backdrop-blur`, técnica de 4 franjas alrededor del recorte) en vez del oscurecido plano de antes.

### Added

- **Eliminar cuenta** (Ajustes → Cuentas OFINK, sección "Zona de peligro"): requiere escribir "ELIMINAR" para confirmar. Si eres dueño de estudio, borra el estudio completo (todo cascada de verdad, revisado contra el esquema real). Si eres miembro de un estudio ajeno, borra solo tu cuenta — si ya generaste clientes/proyectos/cotizaciones ahí, avisa que debe hacerlo el dueño desde Equipo (para no perder el trabajo del estudio). Si te quedas sin ninguna cuenta OFINK, también se borra tu usuario de Supabase Auth por completo.

## [1.12.0] - 2026-07-26

### Added

- **"Personalizar Mi Link"** (`/dashboard/settings/enlace/personalizar`, botón nuevo desde Ajustes → Enlace): editor completo de la página pública tipo Linktree (`/l/[slug]`), con autoguardado (debounce 800ms) y vista previa en tiempo real (panel fijo en escritorio, hoja de pantalla completa en móvil).
  - **Perfil**: foto de perfil y de portada (bucket nuevo `link-page-photos`, mismo patrón que logo/portada del estudio), nombre a mostrar, insignia, frase corta, bio y ubicación.
  - **Fondo**: color sólido, degradado (2 colores + ángulo), imagen o video (URL).
  - **Colores** (7, con HEX + selector nativo): texto, fondo/texto de botones, iconos, bordes, tarjetas, acento.
  - **Tipografía**: familia (Inter/Poppins/Anton/Caveat/Georgia/Sistema), tamaño y peso.
  - **Efectos**: bordes redondeados (slider), sombra (ninguna/sm/md/lg), efecto glass (blur real de navegador, no Satori), animaciones suaves de aparición (`motion/react`, stagger por enlace).
  - **7 plantillas** (Minimal, Premium, Dark, Luxury, Neon, Apple, Glass): aplican un `theme` completo de partida, 100% editable después.
  - **Enlaces**: reordenar por **drag & drop** real (reemplaza a las flechas arriba/abajo, que se conservan en el panel simple de `/enlace`), ícono (14 opciones) y color por enlace, subtítulo opcional, ocultar/mostrar, eliminar — todo en un editor nuevo (`links-editor.tsx`), sin tocar el panel simple existente.
  - Página pública: si quien la ve es el dueño del estudio, aparecen (solo para él) los botones flotantes "Compartir" y "Personalizar" — un visitante normal nunca los ve.
  - **El logo de OFINK al pie es fijo, blanco (#FFFFFF) siempre, centrado** — no es parte del `theme`, no tiene ninguna prop de color/posición/visibilidad; el customizer no puede tocarlo bajo ninguna circunstancia.
  - Tablas nuevas: `studio_link_page` (una fila por estudio, RLS igual a `studio_links`) y columnas `subtitle`/`color` en `studio_links`.

### Known Issues

- Al quitar una foto de perfil/portada desde el customizer, el archivo anterior queda en Storage (se sobrescribe recién en la próxima subida a esa misma ruta) — sin impacto funcional, solo espacio de Storage.

## [1.11.0] - 2026-07-26

### Added

- **Rate limiting anti fuerza bruta** en login/registro por usuario+contraseña: tabla `auth_attempts`, 8 intentos fallidos en 15 minutos bloquean ese usuario+IP (Google no lo necesita, la contraseña la valida Google). Contraseña mínima subida de 6 a 8 caracteres.
- **Headers de seguridad globales** (`next.config.ts`): `Strict-Transport-Security` (HSTS), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy` y `Permissions-Policy` (cámara/micrófono/ubicación solo para el propio origen — el micrófono lo sigue usando Deepgram sin problema).
- `/admin` ahora manda `robots: noindex` — no debe aparecer en buscadores.

### Verified

- Las 5 funciones `SECURITY DEFINER` marcadas por el linter (`list_my_accounts`, `set_active_account`, `current_artist_id`, `current_studio_id`, `is_studio_owner`) se revisaron a mano: todas filtran internamente por `auth.uid()` y tienen `search_path` fijo — el aviso del linter es esperado (necesitan ser invocables por cualquier usuario autenticado), no es una falla real.

### Known Issues / Pendiente manual (fuera del alcance de este delivery)

- **Conectar `ofink.co` en Vercel**: agregar el dominio desde el dashboard de Vercel (Project → Settings → Domains) en el proyecto `codigo-ofink-master` y apuntar los DNS del registrador con los valores exactos que Vercel muestre ahí (A/CNAME, o cambiar a los nameservers de Vercel — lo más simple).
- **Supabase Auth → URL Configuration**: una vez el dominio responda, agregar `https://ofink.co` como Site URL y `https://ofink.co/auth/callback` a Redirect URLs (si no, Google OAuth seguirá mandando de vuelta al `.vercel.app`).
- **Google Cloud Console (OAuth)**: agregar `https://ofink.co` a "Authorized JavaScript origins" y `https://ofink.co/auth/callback` a "Authorized redirect URIs" del client ID usado por Supabase.
- **Supabase Auth → Password Security**: activar "Leaked password protection" (HaveIBeenPwned) — no es controlable por migración SQL, es un toggle en el dashboard.
- Ninguno de estos 4 pasos requiere tocar código: el proyecto ya arma todas sus URLs (login, `/auth/callback`, enlaces públicos) a partir del dominio real de la petición, nunca hardcodeadas.

## [1.10.0] - 2026-07-25

### Added

- **Módulos por cuenta, configurables desde `/admin`**: sección nueva "Módulos por cuenta" — el admin de OFINK elige un estudio y prende/apaga con switches on/off 7 módulos (Inventario, Finanzas, Bot de WhatsApp, Página pública, Equipo, Consentimientos, Galería). Tabla `studio_features` (RLS: cada estudio solo lee sus propias filas; solo admins escriben). Sin fila = encendido por defecto, así que ningún estudio existente se ve afectado hasta que un admin apague algo a mano.
- Si el tatuador toca un módulo apagado en el Centro de control del estudio (Ajustes), en vez de navegar ve un popup: **"Disponible más adelante por medio de suscripción"** (`FeatureLockedRow` reemplaza al `StatusRow` normal para esa fila).

### Known Issues

- El bloqueo es solo en la UI de entrada (Centro de control): si alguien ya tenía la URL de esa subpágina guardada, todavía puede abrirla directo. Falta bloqueo a nivel de ruta/servidor si se quiere hacer cumplir de verdad.
- El sidebar de escritorio (Consentimientos/Galería en la nav lateral) todavía no respeta el apagado — solo el Centro de control (Ajustes) lo hace por ahora.

## [1.9.0] - 2026-07-25

### Added

- **Login/registro con usuario y contraseña**, como segunda puerta de entrada además de Google. Por dentro crea una cuenta de Supabase Auth con correo sintético `usuario@user.ofink.app` (nunca se envía nada ahí), creada ya confirmada con el service role — el username hace de identificador único real. Formulario nuevo (`username-auth-form.tsx`) en `/login` y `/register`, sobre el botón de Google. Sigue el mismo camino de siempre después de autenticar (cuentas existentes, invitaciones, onboarding) vía `resolvePostAuthPath()`, ahora compartida entre `/auth/callback` (Google) y las nuevas acciones (`signUpWithUsername`/`loginWithUsername`).
- **Historial de cuentas creadas ("Clientes de OFINK") en `/admin`**: tabla nueva `platform_signups` (correo/usuario, método de entrada, dispositivo móvil/escritorio por user-agent, fecha), solo legible por administradores de plataforma vía RLS. Se registra una sola vez por cuenta (`upsert` con `user_id` único), tanto para altas por Google como por usuario+contraseña.
- Aislamiento de datos entre cuentas: ya garantizado de fábrica por el RLS existente (`studio_id` en todas las tablas del estudio, ver `authz.ts`) — toda cuenta nueva, sea por Google o por usuario+contraseña, pasa por el mismo onboarding y queda igual de aislada, sin cambios adicionales necesarios.

## [1.8.0] - 2026-07-22

### Added

- **Añadir colaborador por correo (cuentas de Estudio)**: el botón del pulpo ahora incluye "Colaborador" por defecto para dueños de estudio (reemplaza "Formal" — cotizar formalmente es tarea de tatuador, no de administrador; sigue disponible para cualquiera desde Ajustes → Personalización → Menú del pulpo). Lleva a Ajustes → Equipo, que ahora tiene una sección "Invitar colaborador": se escribe el correo y:
  - Si ese correo **ya tiene cuenta de OFINK** (como tatuador independiente, por ejemplo), la invitación queda vinculada a su cuenta de una vez. La próxima vez que entre (o si ya tiene sesión abierta) ve un mensaje "¿Quieres unirte a [Estudio]?" — en Ajustes si ya usa la app, o como primera pantalla si es su primer login. Si acepta, se crea su cuenta de colaborador (`member`) en ese estudio automáticamente y ese pasa a ser su segundo perfil OFINK (respeta el mismo tope de 2 cuentas / 1 cuenta 'estudio' del resto del sistema).
  - Si el correo **no tiene cuenta todavía**, la invitación queda pendiente por correo — se resuelve sola apenas esa persona se registre con Google usando ese mismo correo.
  - El dueño ve el estado de cada invitación (pendiente/aceptada/rechazada/cancelada) y puede cancelar las que sigan pendientes, todo desde Ajustes → Equipo.
  - Tabla nueva `studio_invitations` con RLS (el dueño ve las de su estudio, el invitado ve las suyas; toda escritura pasa por server actions).

### Known limitations

- No hay envío real de correo (mismo límite ya documentado del código de invitación por WhatsApp/correo): la invitación queda registrada y visible dentro de la app para quien tenga o cree una cuenta con ese correo, pero no se dispara un email real todavía.

## [1.7.1] - 2026-07-22

### Changed

- **Capturas reales en la calificación**: se reemplazaron varias ilustraciones genéricas por las capturas reales de la app que nos compartió el equipo (`public/feedback/*.png`) — Inicio, Calendario, Agendar cita, Nueva cotización, Cotizaciones, Proyectos, Métodos de pago, Plantillas del bot, Equipo, Precios/calendario. Las funciones sin captura real (galería, consentimientos, página pública, etc.) siguen con la ilustración genérica mientras tanto.
- **Retroalimentación siempre visible**: el campo de comentario de cada función ya no está oculto detrás de "+ Agregar comentario" — aparece abierto desde el inicio en cada tarjeta, para que se pueda escribir feedback en cualquier pregunta sin pasos extra.
- Se agregaron 3 funciones nuevas al catálogo que sí tenían captura disponible: "Métodos de pago", "Lista de cotizaciones" y "Precios y calendario".

## [1.7.0] - 2026-07-22

### Added

- **Calificación de la app por función**: en Ajustes aparece un mensaje "de parte de OFINK" (arriba de todo, tanto en Ajustes como en Cuentas OFINK) invitando al tatuador/estudio a calificar cada función de la app — desaparece solo cuando ya calificó todas.
  - Nueva página `Ajustes → Mensaje de OFINK` (`/dashboard/settings/feedback`): todas las funciones agrupadas por sección (Inicio, Agenda, Clientes, Cotizaciones, Proyectos, Consentimientos, Pagos, Inventario, Bot, Ajustes), cada una con una vista previa ilustrativa, 1-5 estrellas y un comentario opcional. Se guarda solo, sin botón "enviar".
  - **Nota importante**: las "vistas previas" de cada función son ilustraciones con el lenguaje visual de OFINK (ícono + líneas), no capturas reales de la app — no hay forma de tomar screenshots reales de la app corriendo desde este entorno. Si más adelante nos pasas capturas reales, se pueden reemplazar directamente en `src/components/feedback/feature-preview.tsx`.
  - Tabla nueva `feature_feedback` (una fila por usuario + función, con RLS: cada quien solo ve/edita la suya).
- **Panel de administración general de OFINK** (`/admin`, fuera del dashboard de tatuadores/estudios — sin bottom nav ni pulpo): promedio de calificación por función (para ver qué mejorar primero), lista de comentarios con el estudio/tatuador que los dejó, y gestión de administradores (agregar por correo, quitar).
  - Acceso controlado por una tabla nueva `platform_admins` (sin policies para el cliente — solo se lee/escribe desde el servidor). La PRIMERA persona que entre a `/admin` puede "reclamar" el acceso de administrador; después de eso, agregar a alguien más se hace desde la propia pantalla de `/admin` con su correo.

## [1.6.0] - 2026-07-22

### Added

- **Dashboard "Inicio" completamente nuevo para cuentas de Estudio** (solo cuando `accountKind === 'estudio' && role === 'owner'` — el Home del Tatuador Independiente, y el de members del estudio, quedan exactamente igual que antes).
  - `src/queries/studio-home.ts`: agrega en una sola consulta todo lo que necesita la pantalla — agenda de hoy por tatuador, estado en vivo de cada uno (en sesión / disponible / próxima cita / descanso), alertas (consentimiento sin firmar, pago pendiente, cita en menos de 15 min), actividad reciente y resumen de ingresos del día. Reutiliza las queries/actions existentes (`getStudioSessions`, `getProjects`, `listTeam`, `getConsents`, `getClients`, `getUnreadNotificationCount`) sin tocar su lógica.
  - `src/components/home/estudio/*` (nuevos, no reemplazan nada del Home del tatuador): encabezado con nombre del estudio + alertas, accesos rápidos (Nueva cita / Bloquear horario / Nuevo cliente / Registrar pago), fila "Hoy trabajan", **Agenda general** (grilla hora × tatuador con selector de vista — no es una lista, es el reemplazo real de "abrir otra pantalla para ver todo"), resumen del día, alertas importantes (solo si existen), estado de tatuadores, actividad reciente, e ingresos del día con donut pequeño de apoyo.
  - El estado de cada cita (🟢 confirmada / 🟡 pendiente / 🔵 en sesión / ⚪ finalizada / 🔴 cancelada) se deriva del `status` real de `sessions` (`scheduled`/`rescheduled`/`completed`/`cancelled`) + si la hora actual cae dentro de la sesión — no se agregaron columnas nuevas a la base de datos.
  - Mantiene el calendario horizontal de siempre (`CalendarCard`), el botón central del pulpo y el bottom nav sin ningún cambio.

### Known limitations

- Los 4 accesos rápidos enlazan a pantallas ya existentes (calendario del equipo, fechas bloqueadas, proyectos) en vez de abrir diálogos nuevos genéricos — "Nuevo cliente" sí abre el diálogo de siempre in-place.
- La "actividad reciente" es derivada (sesiones agendadas hoy + clientes nuevos + pagos, ordenados por fecha) porque OFINK no tiene todavía una tabla de eventos/auditoría dedicada.

## [1.5.0] - 2026-07-22

### Added

- **Login/registro 100% Google**: se eliminó el registro/login por usuario+teléfono y por correo+contraseña (`EmailAuthForm`, `phone-credentials.ts`, `register`/`login`/`registerWithEmail`/`loginWithEmail`). Las pantallas `/login` y `/register` ahora solo muestran el botón "Continuar con Google".
- **Hasta 2 cuentas OFINK por login de Google**: una cuenta 'tatuador' (independiente o member de un estudio) y otra 'estudio' (dueño), con el mismo usuario de Google — spec pedida por el dueño del producto.
  - Base de datos: tabla nueva `user_active_account` (cuál de las 2 cuentas está activa) + RPCs `set_active_account()` y `list_my_accounts()`. `current_artist_id()`/`current_studio_id()`/`is_studio_owner()` (usadas en casi todas las políticas RLS) se reescribieron para resolver la cuenta activa en vez de un `limit 1` no determinístico; la policy de `SELECT` de `artists` pasó de "todas mis filas" a "mi cuenta activa", así que las ~15 consultas existentes de `.from('artists').select(...).single()` sin filtrar siguen funcionando igual con 2 cuentas, sin tocarlas.
  - `/auth/callback`: 0 cuentas → onboarding de siempre; 1 cuenta → se activa sola y entra directo; 2 cuentas → pantalla nueva `/onboarding/select-account` para elegir con cuál entrar (se pregunta en cada login, según lo pedido).
  - Ajustes → **Cuentas OFINK** (`/dashboard/settings/cuentas`, enlazada desde la sección "Cuenta" de Ajustes y también para members no-dueños): lista las cuentas, botón "Usar esta" para cambiar de cuenta activa, y botones **"Crear cuenta de Estudio"** / **"Crear cuenta de Tatuador"** para la que le falte (crea la segunda cuenta sin perder la primera, en cualquiera de los dos sentidos).
  - `createStudioOnboarding`/`getStudioOnboardingState`/`updateStudioOnboarding` (flujo "Tengo un estudio") y `completeProfileStep`/`getOnboardingState`/`saveOnboardingStep`/`finishOnboarding` (wizard de tatuador) ahora resuelven siempre la cuenta específica por `account_kind` ('estudio' o 'tatuador' respectivamente), no la cuenta activa — así crear/editar una cuenta nunca pisa los datos de la otra.

### Known limitations

- El selector de cuenta (`/onboarding/select-account`) se muestra en cada login con Google si el usuario tiene sus 2 cuentas — no hay opción de "recordar la última" (así se pidió).

## [1.4.0] - 2026-07-22

### Added

- **"¿Cómo trabajas?" simplificado**: ahora solo 2 tarjetas grandes (Independiente / Trabajo en un estudio) — "propietario de estudio" ya vivía en la Pantalla 0 ("Tengo un estudio"), estaba duplicado. Tarjetas más grandes, con glow e ícono, cero campos de texto.
- **Imágenes reales en "Tu estilo"** (paso 2 del registro de tatuador): usa las mismas fotos de referencia por estilo que ya usa el bot (`/public/styles/style-*.webp`, `styleRender()`), reemplazando el placeholder de inicial tenue.
- **Ajustes dice "Estudio" o "Tatuador" según la cuenta**: columna nueva `studios.account_kind` (`'tatuador'` por defecto, `'estudio'` si se creó desde el flujo "Tengo un estudio"). Aplicado en Ajustes, Equipo, Dashboard del estudio y Calendario general.
- **Ubicación en Google Maps** (Ajustes → Perfil): botón "Buscar" abre el buscador público de Maps con la dirección/ciudad ya escritas; el enlace resultante se pega y se guarda (`studios.maps_url`).
- **Página pública de enlaces personalizable, estilo Linktree** (`/l/[slug]`, nueva tabla `studio_links`): logo, descripción, redes sociales y una lista de enlaces 100% editable desde Ajustes → Enlace (agregar, ocultar/mostrar, reordenar con flechas arriba/abajo, eliminar) — mismo patrón de RLS y de cliente admin para la ruta pública que ya usa `/t/[slug]`.

### Fixed

- **Bug de onboarding "en progreso"**: al elegir "Trabajo en un estudio" desde el registro de tatuador, se borra el estudio-stub que el paso 1 ya había creado (si no, `/onboarding/join` rebotaba al dashboard por ya "tener" un estudio). Al terminar cualquiera de los dos flujos derivados, el wizard de tatuador queda marcado como terminado — ya no se vuelve a quedar atascado en el paso 3 cada vez que se reingresa a `/onboarding`.

### Known limitations

- El botón de Maps abre el buscador público (sin API key configurada) — no hay selector interactivo de pin en el mapa; el enlace final lo copia y pega el usuario desde la app de Maps. Para un picker real hace falta una API key de Google Maps/Places con facturación habilitada.

## [1.3.0] - 2026-07-22

### Added

- **Nuevo sistema de registro con dos flujos completamente separados** (spec "NUEVO SISTEMA DE REGISTRO OFINK"), sin romper ninguno de los flujos existentes.
  - **Pantalla 0 rediseñada** (`/onboarding/choose`): de 3 tarjetas a **2**, estilo selector de perfil (Netflix/PlayStation) — "Soy tatuador" y "Tengo un estudio". No es un formulario.
  - **Flujo tatuador**: se mantiene el wizard de 8 pasos de siempre, sin tocar su lógica de guardado. El paso 3 (Experiencia) ahora incluye la pregunta **"¿Cómo trabajas?"** con 3 opciones: Independiente (sigue el wizard igual que siempre), Trabajo en un estudio (sale a `/onboarding/join`, flujo existente) y Soy propietario de un estudio (sale al flujo nuevo de abajo). Al terminar, pantalla de **celebración** nueva (`/onboarding/listo`) antes de entrar al dashboard.
  - **Flujo estudio, 100% nuevo** (`/onboarding/estudio`, 7 pasos): Tu estudio (logo, nombre, ciudad, WhatsApp, Instagram — sin pedir datos del propietario) → Conozcamos tu estudio (tipo, cuántos artistas, acepta residentes) → Configura tu espacio (días, horario, intervalo, cabinas, estaciones — columnas nuevas `studios.cabins`/`stations`/`accepts_residents`/`description`) → Políticas generales → Personaliza tu estudio (portada, color, descripción, web) → **Invita a tus artistas** (código `OFK-XXXXXX`, QR generado al vuelo, copiar código, compartir por WhatsApp, invitar por correo vía `mailto:`) → Resumen. Termina en pantalla de celebración **"¡Estudio creado!"** (`/onboarding/estudio/listo`).
  - Ajustes → Equipo: botones de compartir el código por WhatsApp/correo, mismo patrón que el paso de invitación del wizard.
  - Reutiliza al máximo lo ya construido: `createStudioAndArtist`, `uploadStudioLogo`/`uploadStudioCover`, `STUDIO_TYPES`/`ARTIST_COUNTS`/`WEEK_DAYS`, la paleta de colores de cotizaciones, y el flujo de unirse a un estudio (`/onboarding/join`) tal cual ya existía.

### Known limitations

- "Invitar por correo" no envía un correo real (no hay proveedor de email configurado en el proyecto, ej. Resend/SendGrid) — abre el cliente de correo del dueño con el mensaje prellenado (`mailto:`), igual que WhatsApp. Conectar un proveedor real es la siguiente pieza si se necesita.
- El QR se genera con una API pública externa (`api.qrserver.com`) vía `<img>`, no con una librería local — funciona pero depende de un tercero.
- Las tarjetas de "Soy tatuador" / "Tengo un estudio" usan gradientes + ícono grande en vez de fotografías reales (no había assets de fotografía en el proyecto para "un tatuador trabajando" / "un estudio premium").
- El paso "¿Cómo trabajas?" quedó dentro del paso 3 del wizard existente (Experiencia) en vez de ser un paso propio, para no alterar la máquina de 8 pasos ya construida (`ONBOARDING_STEPS`) y evitar romper el reingreso a mitad de camino.

## [1.2.0] - 2026-07-21

### Added

- **Soporte para estudios con varios tatuadores**, sobre el modelo de datos existente (`studios` ya era el tenant, `artists` ya tenía `role` — antes solo `'owner'`). Sin romper el modo tatuador independiente actual.
  - Pantalla nueva tras el registro: **"¿Cómo quieres usar OFINK?"** (`/onboarding/choose`, 3 tarjetas) — "Independiente" y "Crear un estudio" van al wizard de perfil de siempre (mismo `completeProfileStep`); "Trabajo en un estudio" va al flujo nuevo de abajo.
  - **Unirse a un estudio** (`/onboarding/join`): buscar por código (`studios.join_code`, formato `OFK-XXXXXX`, generado para todos los estudios existentes), ver tarjeta del estudio, solicitar acceso (`studio_join_requests`) y pantalla de espera (`/onboarding/pending`, sondea cada 10s).
  - **Aprobación y permisos** (`src/actions/team.ts` + pantalla **Ajustes → Equipo**, `/dashboard/settings/equipo`): el dueño ve solicitudes pendientes (aprobar/rechazar), la lista de tatuadores, el código de invitación (copiar/regenerar) y, por cada tatuador, 16 permisos booleanos editables (`artist_permissions`) y un botón de desactivar. Al aprobar se crea la fila `artists` (`role='member'`) + permisos por defecto. Tope de 20 tatuadores activos por estudio.
  - `getCurrentPermissions()` (`src/queries/permissions.ts`): el owner siempre tiene todo (sin consultar tabla); un member lee su fila de `artist_permissions`. Aplicado a clientes, proyectos, sesiones/agenda, inventario y cotizaciones — cada acción de escritura valida el permiso correspondiente antes de tocar la base.
  - Visibilidad por tatuador: un member solo ve **sus** clientes, proyectos, cotizaciones y sesiones (`clients.artist_id` nuevo, nullable — `null` = compartido, comportamiento de siempre para el tatuador independiente). El owner sigue viendo todo el estudio en sus pantallas de siempre, sin cambios.
  - **Dashboard del estudio** (`/dashboard/estudio`, solo owner): facturación del mes, pendiente por cobrar, tatuadores activos, sesiones de hoy, proyectos activos y ranking de tatuadores por facturación — calculado sobre las mismas queries de `projects`/`sessions`, sin tablas nuevas.
  - **Calendario general** (`/dashboard/estudio/calendario`, solo owner): agenda de los próximos 21 días de todo el equipo, cada tatuador con su color, con chips para activar/desactivar quién se ve.
  - DB: funciones `current_artist_id()` / `current_studio_id()` / `is_studio_owner()` (`SECURITY DEFINER`, sin recursión de RLS, solo ejecutables por `authenticated`) + policy para que el owner vea a su equipo en `artists` (antes cada quien solo veía su propia fila).

### Known limitations

- Galería no está filtrada por tatuador (se mantiene visible a nivel de estudio para todos los members — no estaba en el alcance explícito del spec).
- El Calendario general es una lista por día, no el grid mensual de la Agenda personal (`calendar-card.tsx`) — reutilizarlo tal cual habría significado tocar un componente compartido con el modo independiente.
- Sin tests automatizados para el flujo de aprobación/permisos — verificado manualmente contra el schema en Supabase.

## [1.1.0] - 2026-07-21

### Added

- **Iniciar/crear cuenta con Google**, y **con correo y contraseña reales** (antes solo existía teléfono + nombre de usuario). Un solo botón de Google sirve para registro Y login a la vez: `/auth/callback` revisa si el usuario ya tiene estudio creado (fila en `artists`) y manda a `/dashboard` directo, o a `/onboarding` si es la primera vez — igual que el flujo de teléfono de siempre. El de correo/contraseña queda colapsado detrás de "o con correo y contraseña" para no competir con Google.
- Sin confirmación de correo: se usa el mismo mecanismo que ya tenía el flujo de teléfono (`signUp` seguido de `signInWithPassword` de inmediato) — si esto funciona sin errores es justamente porque el proyecto de Supabase ya tiene "Confirm email" desactivado.

### ⚠️ Acción tuya requerida antes de que Google funcione

Este cambio es solo código — Google como proveedor de login se configura en el dashboard de Supabase, no por SQL, y necesita credenciales que solo tú puedes generar:

1. En **Google Cloud Console** → crea un proyecto (o usa uno existente) → **APIs & Services → Credentials** → crea un **OAuth Client ID** de tipo "Web application".
2. Como **Authorized redirect URI** pon: `https://ywxlaqyouuouutoqpinl.supabase.co/auth/v1/callback` (la URL de tu proyecto de Supabase, no la de OFINK).
3. Copia el **Client ID** y **Client Secret** que te da Google.
4. En el **dashboard de Supabase** → **Authentication → Providers → Google** → actívalo y pega ahí esas dos credenciales.
5. Confirma también en **Authentication → Providers → Email** que "Confirm email" esté desactivado (para que el registro con correo funcione sin esperar ningún clic de confirmación).

Sin esos pasos, el botón de Google va a redirigir a una pantalla de error de Supabase — el registro con correo y contraseña sí funciona ya mismo, sin nada más que hacer.

## [1.0.2] - 2026-07-21

### Fixed

- **BUG CRÍTICO, causa real: el build llevaba tiempo fallando en Vercel.** El log de build que mandaste mostró el error real: `Module not found: Can't resolve '@/components/settings/inventario-panel'` — ese archivo, aunque su lógica (acciones, consultas, validaciones, hasta la tabla `inventory_categories` para categorías personalizadas con ícono/color) estaba completa y correcta, el propio componente de interfaz nunca llegó a este proyecto. Cualquier build con ese import roto falla COMPLETO — lo que probablemente explica por qué versiones anteriores parecían "no actualizar" pase lo que pase: el build nunca llegaba a terminar, así que Vercel seguía sirviendo el último build bueno de antes. Se hizo un barrido de los ~200 archivos del proyecto buscando cualquier otro import roto — no apareció ninguno más.

### Added

- **Rediseño completo de Inventario**, sobre el mockup — portada con degradado y halo verde, formulario en una sola tarjeta premium (cada campo con ícono + label), selector de cantidad con `−`/`+` animado, selector de unidades, alerta de stock, tarjeta de tip profesional, estado vacío con ilustración minimalista, y tarjetas de insumo con ícono de categoría, barra de stock y estado (Disponible/Stock bajo/Agotado). Categorías personalizadas con ícono y color propio (elige entre sugeridas o crea la tuya), reutilizables en todo OFINK. Cero cambios de lógica: mismas acciones, mismas tablas de siempre.

## [1.0.1] - 2026-07-21

### Fixed

- **BUG CRÍTICO: ningún proyecto abría ("Algo no cargó bien")** — al agregar la herencia de duración cotizada en v0.99.1, `projects/[id]/page.tsx` (un Server Component) importaba `parseDurationLabel` desde `step-price.tsx`, que tiene `'use client'`. Ese cruce de límite server/client rompía el render de la página para TODOS los proyectos por igual — confirmado que no era un problema de datos ni de la consulta (probé la query exacta contra Supabase con los mismos permisos de un tatuador real y trajo todo bien). Se movieron `formatDuration`/`parseDurationLabel` a un módulo plano nuevo (`lib/quote-wizard/duration.ts`, sin `'use client'`), importable por igual desde Server y Client Components — `step-price.tsx` ahora solo las re-exporta para no romper a nadie más que ya las usaba.

## [1.0.0] - 2026-07-21

### Auditoría completa del proyecto (base de datos + código)

Se pidió un análisis de todo el proyecto para encontrar piezas mal conectadas y ordenar Supabase antes de seguir avanzando. Resultado:

**Supabase — seguridad:**
- 4 buckets públicos (`gallery`, `quote-photos`, `studio-covers`, `studio-logos`) tenían una política SELECT sin ningún scope que permitía **listar/enumerar todos los archivos de todos los estudios** vía la API de Storage — el código de la app nunca usa `.list()` (siempre construye la URL directo), así que se eliminaron esas políticas sin romper nada. Los archivos se siguen viendo igual (eso lo maneja el flag "público" del bucket, no la política RLS).
- Queda un aviso que **no se puede arreglar por SQL**: protección contra contraseñas filtradas (HaveIBeenPwned) desactivada — se activa desde el dashboard de Supabase, en Authentication → Policies.

**Supabase — rendimiento:**
- ~23 políticas RLS en casi todas las tablas llamaban a `auth.uid()` sin envolver en `(select ...)`, lo que Postgres re-evalúa fila por fila en vez de una sola vez por consulta — reescritas todas con `ALTER POLICY` (mismo nombre, mismo comportamiento, solo más rápido a medida que crecen los datos).
- ~30 llaves foráneas sin índice de cobertura (`studio_id`, `client_id`, `project_id`, etc. en prácticamente todas las tablas) — en una app multi-tenant como esta, es la consulta más común de todas. Se agregaron todos los índices faltantes.

**Código — piezas desconectadas encontradas:**
- `bubbles.tsx`: un `BotBubble`/`EditableUserBubble`/`TypingDots` completo, **nunca importado por nadie** — quedó de un intento anterior de rediseño de chat que nunca se conectó. Se rescataron sus dos mejores ideas (ícono de lápiz en respuestas editables, respeto a `prefers-reduced-motion` en los puntitos) hacia las burbujas que sí están en uso (`intake-chat.tsx`, v0.98.0) y se borró el archivo huérfano.
- `BodyZoneCards`/`BodySubzoneCards` (en `body-cards.tsx`) y `body-zone-picker.tsx`: reemplazados hace tiempo por `BodyMapExplorer`, pero nunca se borraron — eliminados.
- `month-summary.tsx` y `mini-bar-chart.tsx`: de una versión anterior del Home/Estadísticas, antes de que existiera la página de Estadísticas actual (`stats-hero`, `stats-funnel`, `stats-trend-chart`, etc. — esa sí está completa y conectada). Eliminados por redundantes.
- `arm-size-icon.tsx` y `date-time-picker.tsx`: reemplazados por `BodySizeCards` (fotos reales) y por el flujo `CalendarNav` + dial de duración. Eliminados.
- **Para tu decisión, no lo toqué**: `module-accordion.tsx` (77 líneas) es una mejora ya construida para el Centro de control de Ajustes — en vez de que la flecha navegue a otra página, DESPLIEGA el formulario completo ahí mismo. Está terminado pero `studio-control-center.tsx` nunca se cambió para usarlo (sigue con links simples). Si quieres, en el próximo paso lo conecto.

Ningún cambio de este análisis toca lógica de negocio ni comportamiento visible — solo limpieza y afinado, para que el siguiente paso arranque sobre una base más sólida.

## [0.99.1] - 2026-07-21

### Added

- **Duración cotizada heredada al agendar cita**: si el tatuador eligió, por ejemplo, "5h" o "6h" al cotizar (`avg_session_duration`), esa duración ahora precarga el dial de "Agendar cita" en vez de quedar siempre en 60 min por default — en el botón de la página del proyecto y en el de "Duración estimada" del detalle de cotización. Nuevo helper `parseDurationLabel` (inverso de `formatDuration`).
- **Tiempo ejecutado sumado al proyecto**: al cerrar el cronómetro de una cita puntual (botón ▶/■), el tiempo realmente transcurrido se suma a `projects.worked_minutes` — se ve como una 4ª estadística ("Tatuado") en la página del proyecto, aparte de la duración estimada de cada sesión agendada.

### Changed

- **Bot: pregunta activa siempre legible**: cada pregunta nueva se posiciona cerca del tope visible del hilo (no todo abajo), para que se lea completa con su selector/foto/campo ocupando el resto de la pantalla debajo.
- **Bot: reconocimiento de cliente visible en la conversación**: cuando el teléfono coincide con un cliente ya registrado (nombre/edad/email ya se precargaban), ahora también se lo dice explícitamente en el chat: "¡Qué bueno verte de nuevo, [Nombre]! Ya tengo tus datos guardados."

## [0.99.0] - 2026-07-21

### Changed

- **El bot "escribe" antes de cada pregunta nueva**: tras responder, aparece una burbuja de puntitos animados (~750ms) antes de que salga la siguiente pregunta del bot — da la sensación de que hay alguien del otro lado, en vez de que el siguiente paso salte instantáneo.
- **Botones de "Continuar" quitados** en todo lo que se puede auto-avanzar sin ellos:
  - Fecha de nacimiento: avanza sola apenas la fecha es válida.
  - Días disponibles sin configurar (estudio sin horario cargado): avanza sola, sin botón.
  - Nombre / WhatsApp / email / idea del tatuaje: el botón grande de "Continuar" se reemplazó por un ícono de enviar compacto (con spinner mientras busca el cliente por WhatsApp), y Enter también envía.
  - Estilos (selección múltiple) y días disponibles (hasta 3): donde sí hace falta un confirm explícito (por ser selección múltiple), se cambió la barra ancha de "Continuar" por un botón chico "Listo" flotante, menos protagonismo visual.
  - Fotos de referencia: mismo criterio — "Listo" si ya subiste alguna, o el link discreto de "No tengo imágenes" si no.

## [0.98.0] - 2026-07-21

### Changed

- **El bot vuelve a ser una conversación de chat**, en vez de una pantalla completa por cada paso (eso era el rediseño de v0.76.0). Ahora todo lo ya respondido se ve como una tira de burbujas — el bot a la izquierda con su pregunta, el cliente a la derecha con su respuesta — que crece hacia abajo como cualquier chat, y la pregunta activa aparece como la última burbuja del bot con su selector/campo justo debajo (fotos, tarjetas, mapa de cuerpo, lo que sea — mismo componente de siempre, solo cambia dónde se monta). Tocar cualquier respuesta ya dada la reabre en edición, igual que antes.
  - Mismo modelo de datos de siempre (`history`/`applyEdit`) — por dentro ya guardaba pregunta+respuesta como un historial de conversación, esto solo cambia cómo se ve.
  - Auto-scroll al fondo del hilo con cada pregunta nueva, usando `scrollTop` directo (no `scrollIntoView` — evita de raíz el bug de página corrida que ya vimos y arreglamos en el Home).
  - Nota: en el paso final ("Casi terminamos") el resumen de la cotización sigue mostrando su propia lista de respuestas para revisar antes de enviar — ahora queda un poco repetido con las burbujas de arriba (que ya muestran lo mismo). Si prefieres que ese resumen final se simplifique a solo un botón de confirmar/enviar (sin repetir la lista), avísame y lo ajusto.

## [0.97.1] - 2026-07-21

### Changed

- **Botón ▶/■ de "Próxima sesión" reubicado**: antes flotaba encima de la foto del proyecto, arriba de la tarjeta. Ahora vive abajo, alineado a la derecha en la misma fila de "Contactar cliente"/"Consentimiento" — justo debajo de la foto, como se pidió.

## [0.97.0] - 2026-07-21

### Added

- **Cronómetro por CITA (no solo jornada del día) + registro de materiales gastados por sesión.** Antes "Iniciar sesión" era un único botón para todo el día, en el hero del Home de escritorio. Ahora:
  - **Móvil**: ícono ▶ en la tarjeta "Próxima sesión" — se convierte en ■ con el tiempo corriendo una vez iniciada esa cita puntual.
  - **Escritorio**: el mismo ▶/■ en cada fila de "Sesiones de hoy" (una por cita) y en la tarjeta destacada de próxima sesión; la jornada general del hero sigue existiendo aparte, sin atarse a ninguna cita.
  - Antes de arrancar el cronómetro, un popup pide confirmar los materiales que se van a gastar en ESA sesión — cada insumo precarga el "mínimo por sesión" que configures en Ajustes → Inventario (botón de engranaje en cada fila, junto con el costo por unidad opcional), editable ahí mismo para el caso puntual. Al confirmar: se calcula el valor total en materiales (si hay costo unitario cargado), se descuenta esa cantidad del stock, y recién ahí arranca el cronómetro.
  - Nuevas columnas en Supabase: `work_shifts.session_id` (liga el cronómetro a una cita), `inventory_items.default_qty_per_session` / `.unit_cost`. Tabla nueva `session_materials` (con RLS) para el historial de qué se gastó en cada sesión.

## [0.96.1] - 2026-07-21

### Fixed

- **"¿Qué lado?" (y "¿Cuello o cara?", "¿Externa o interna?") seguían sin fotos** tras el arreglo de altura de v0.96.0 — la causa era otra, en el propio `body-map-explorer.tsx`: `RegionScreen` (Cabeza/Brazos/Torso/Piernas, que ya funcionaba) tiene `grid-rows-2` explícito, pero `GroupPicker`, `LadoPicker` y `ProfundidadPicker` (una sola fila de 2 botones) no tenían ninguna fila definida — sin eso, CSS Grid no estira esa fila para llenar el alto disponible (queda en `auto`, del tamaño de su contenido), así que el área de la foto de cada botón colapsaba a cero y solo quedaba el texto. Se agregó `grid-rows-1` a los tres.
- **Footer (Atrás/Continuar) del cotizador, ahora sí pegado al borde real de la pantalla**: era `sticky bottom-0`, lo que depende de que su contenedor padre alcance exactamente el alto del viewport — con cualquier desajuste en esa cadena (como el de v0.96.0) quedaba flotando con un hueco negro debajo en vez de pegado abajo. Cambiado a `fixed inset-x-0 bottom-0`, que no depende de nada de esa cadena de alturas. Sigue subiendo con el teclado gracias al `interactiveWidget: resizes-content` que ya estaba configurado en `layout.tsx`.

## [0.96.0] - 2026-07-21

### Fixed

- **"Zona del cuerpo" del cotizador (paso 2/5): fotos que desaparecían (colapsaban a pastillas de solo texto, sin imagen) y la grilla de zonas cortada abajo.** No faltaban fotos: `step-zone.tsx` calcula su alto disponible con `100dvh - 15rem - insets` (un número fijo, no relativo al layout real). Después de v0.92.0, el header del wizard pasó a `sticky` y el cuerpo del wizard sumó `pb-32` (8rem extra de aire para el footer sticky) — ese 8rem nunca se reflejó en el "15rem" de `StepZone`, así que el alto calculado quedaba sobrestimado en esa misma medida: la grilla de fotos (`BodyMapExplorer`) terminaba colapsando hacia una altura casi nula (de ahí las pastillas de "Derecho/Izquierdo" sin imagen, con solo el texto visible) o cortándose contra el footer. Se corrigió el número (15rem → 23rem) para que coincida con el padding real de hoy.

## [0.95.9] - 2026-07-21

### Fixed

- **LA CAUSA REAL del bug de Inicio** (encontrada comparando contra el v0.92.0 que subiste, la última versión sin fallas): no estaba en el calendario. `app-shell.tsx` pasó a tener sidebar colapsable (después de v0.92.0) y el contenedor de todo el contenido de la app quedó como `flex-1` dentro de un `flex` — **sin `min-w-0`**. Sin eso, un flex item por defecto no se encoge más allá del ancho intrínseco de su contenido más ancho (`min-width: auto`): con la tira de días cubriendo el mes completo, ese contenedor entero crecía de más y arrastraba TODA la página hacia el lado — no solo el calendario, absolutamente cualquier página con contenido ancho en cualquier parte se habría visto afectada igual. Se agregó `min-w-0` al contenedor — con esto el contenido siempre se ajusta al ancho real del viewport, cualquier desborde interno queda contenido/scrolleable donde debe, y ninguno de los parches anteriores (v0.95.6 a v0.95.8, todos dentro de `week-strip.tsx`) tenía forma de arreglar esto porque el problema estaba un nivel más arriba, en la cáscara de toda la app, no en el calendario. Se dejan esos cambios igual (son mejoras válidas por su cuenta), pero esta es la corrección que debería cerrar el tema de una vez.

## [0.95.8] - 2026-07-21

### Fixed

- **Calendario de Inicio, tercer intento de centrado en "hoy"** — confirmaste que v0.95.7 (con build ya actualizado) seguía sin centrar ni deslizar. El cálculo con `el.offsetLeft` dependía de que el layout de los hijos ya estuviera asentado en el momento exacto del efecto (fuentes, reflow) — en producción ese timing puede fallar. Reescrito para NO medir nada del DOM de los días: el ancho de cada pastilla es fijo por Tailwind (48px normal, 64px "hoy"), así que la posición se calcula por aritmética pura a partir del índice de "hoy" en la lista — no puede desincronizarse con el layout real. También se envuelve en `requestAnimationFrame` (un frame de margen tras el mount) y se agrega `-webkit-overflow-scrolling: touch` por si el `overflow-x: hidden` del body (v0.95.6) estaba interfiriendo con el swipe manual dentro de la tira en alguna PWA de iOS.

## [0.95.7] - 2026-07-21

### Fixed

- **El corrimiento de toda la página de v0.95.6 ya no pasa** (confirmado), pero el reemplazo de `scrollIntoView` quedó con un bug propio: el cálculo de `el.offsetLeft` se mide relativo al ancestro posicionado más cercano — como la tira (`week-strip.tsx`) no tenía `position: relative`, ese ancestro terminaba siendo otro más arriba en el árbol, el cálculo salía mal (casi siempre negativo → se recortaba a 0) y el calendario abría mostrando el día 1 del mes en vez de centrarse en hoy. Se agregó `relative` al contenedor de la tira para que sea su propio `offsetParent` — con eso el cálculo de centrado queda correcto sin importar qué haya más arriba.

## [0.95.6] - 2026-07-21

### Fixed

- **Bug real: toda la pantalla de Inicio corrida hacia la izquierda** (foto: saludo, contador, calendario y tarjeta de próxima sesión todos cortados por el mismo borde). Causa: en `week-strip.tsx`, `todayRef.current.scrollIntoView({ inline: 'center' })` para centrar el día de hoy al abrir — en iOS Safari/PWA esa llamada puede no quedarse solo con el scroll interno de la tira y termina moviendo la página COMPLETA horizontalmente. Reemplazado por calcular y fijar `scrollLeft` directamente sobre el contenedor scrolleable de la tira (nunca puede afectar a un ancestro). Además, `overflow-x: hidden` en `html`/`body` como segunda capa de seguridad: la página en sí ya no puede desplazarse horizontalmente pase lo que pase en cualquier componente, sin afectar a los scrolls internos (como esta misma tira) que siguen funcionando igual.

## [0.95.5] - 2026-07-21

### Changed

- **Tira de "Calendario" en Inicio, difuminado en los bordes** (`week-strip.tsx`): la lógica de deslizar por todo el mes (no solo la semana) y centrar automáticamente el día de hoy ya existía; el problema reportado era que, al llenar el ancho exacto de la tarjeta sin ningún día "cortado" en el borde, no había ninguna pista visual de que se podía seguir deslizando — se veía como una fila fija/completa aunque no lo fuera. Se agregó un fade (mask-image) en ambos bordes de la tira para dejar claro que hay más días para cada lado.

## [0.95.4] - 2026-07-21

### Changed

- **Splash de apertura DESHABILITADO temporalmente**: reportaste Inicio en negro al abrir (foto: nav e íconos "fantasma", calendario asomando, resto en negro) — coincide exactamente con capturar la pantalla a mitad del splash de 1.4s (`splash-screen.tsx`) desvaneciéndose, la misma hipótesis de v0.95.2. Para descartarlo de una vez, saqué el `<SplashScreen />` de `layout.tsx` (el componente sigue intacto, solo hay que volver a importarlo/renderizarlo para restaurarlo). Con este cambio, si el negro seguía siendo el splash, ya no debería aparecer nunca más — si lo sigues viendo con este deploy, el problema es otro y necesito el mensaje exacto de la consola del navegador (F12 → Console) para ubicarlo.

## [0.95.3] - 2026-07-21

### Fixed

- **Endurecí el Home contra cualquier falla en los datos nuevos de escritorio**: las consultas agregadas para `HomeDesktop` (`getActiveWorkShift`, `getQuotes`, `getConsents` para "Pendientes importantes") ahora están envueltas en try/catch — si cualquiera de ellas llegara a lanzar una excepción sin manejar (algo que hasta ahora podía tumbar TODA la página de Inicio, tanto en móvil como en escritorio, no solo la parte de escritorio), ahora se ignora el fallo puntual y el resto de Inicio se sigue mostrando con normalidad.
- **Nuevo `error.tsx` para todo `/dashboard/*`**: si alguna página del panel llegara a fallar de verdad, ahora se ve una pantalla con mensaje y botón "Reintentar" en vez de una pantalla en blanco o rota sin ninguna salida — esto es la causa más probable de "el error" reportado de forma persistente incluso en incógnito/otro navegador: sin este boundary, cualquier excepción no controlada dejaba la pantalla sin ningún mensaje de recuperación.

### Known Issues

- No pude reproducir el error exacto que describes (no tengo acceso al navegador donde ocurre). Si después de este deploy lo sigues viendo, con el nuevo `error.tsx` al menos deberías ver un mensaje concreto ("Algo no cargó bien" + botón Reintentar) en vez de la pantalla en blanco — eso ya sería información valiosa: si aparece ese mensaje, revisa la consola del navegador (F12 → Console) y compárteme el texto exacto del error ahí, así lo ubico con precisión.

## [0.95.2] - 2026-07-21

### Fixed

- **Header del wizard ahora es sticky**: antes se iba con el scroll, así que en pasos largos (Detalles, Zona) al scrollear el contenido terminaba asomando por encima, mezclándose visualmente con la barra de estado del sistema (se veían checks de selección pegados al reloj/batería). Ahora el header (con su padding de isla/notch) se queda fijo arriba siempre.
- Subí el colchón inferior del cuerpo del wizard de `pb-24` a `pb-32` para que el footer sticky (Atrás/Continuar) nunca tape el último campo de ningún paso.

### Investigated

- La "pantalla en negro" reportada en Inicio: revisé el splash screen (`splash-screen.tsx`, ~1.4s al abrir la PWA en frío) y todo indica que las capturas se tomaron durante esa transición (FAB y calendario, que tienen prioridad visual más alta, se alcanzan a ver sobre el fondo casi negro del splash desvaneciéndose) — no encontré evidencia de que el Home en sí falle al renderizar (los logs de Supabase muestran 100% de respuestas exitosas para esas sesiones). Pendiente de confirmar con el usuario si prefiere acortar/quitar el splash.

## [0.95.1] - 2026-07-21

### Fixed

- **Cotización formal: header pegado a la barra de estado** — el header ("Nueva cotización · Paso N de 5") no reservaba el espacio de la isla dinámica/notch (`env(safe-area-inset-top)`), así que en varios iPhones quedaba tapado detrás de la barra de estado del sistema (se veían los círculos de progreso pegados arriba del todo, sin el título encima). Ahora el header suma ese inset.
- **Cotización formal: la última fila de "Zona del cuerpo" quedaba tapada por el botón Atrás/Continuar** — el paso Zona usaba una altura fija calculada a mano (`100dvh - 15rem`) que no restaba el alto real de la isla/notch ni el home indicator, así que en esos dispositivos el contenido (p. ej. Torso/Piernas en la grilla de región) se desbordaba detrás del footer sticky. El cálculo ahora también resta `env(safe-area-inset-top)`/`bottom`, y además la caja del explorador de zonas ahora hace scroll interno propio como red de seguridad — aunque el cálculo se quede corto en algún equipo, el contenido se desliza dentro de su caja en vez de escaparse detrás del footer.
- Agregué un colchón de aire (`pb-24`) al cuerpo del wizard para que el footer sticky nunca tape la última fila de contenido de ningún paso, no solo el de Zona.
- Sobre el Home móvil en negro (botón "Iniciar sesión"): confirmé que ese botón (parte de la jornada de trabajo) SOLO existe en la versión de escritorio (`HomeDesktop`, montada por `HomeDesktopGate` — nunca en un teléfono, ver v0.95.0). Si las capturas siguen mostrando la pantalla en negro, es porque todavía no se desplegó la v0.95.0 con ese fix — este zip ya la incluye.

## [0.95.0] - 2026-07-21

### Fixed

- **Home móvil roto, de nuevo** — el fix de v0.94.1 (`HomeResponsive`) seguía gateando los DOS layouts detrás de `isDesktop === null → return null`: en el primer render (antes de que `matchMedia` resolviera en el cliente) no se montaba nada, ni siquiera el móvil — pantalla en negro con solo el calendario/FAB asomando, como se reportó. Ahora `dashboard/page.tsx` renderiza el móvil (`mobileHome`) directo y siempre, sin pasar por ningún componente cliente ni depender de JS — exactamente como antes de que existiera la versión de escritorio (`md:hidden` es solo CSS). El nuevo `HomeDesktopGate` (`home-responsive.tsx`, antes `HomeResponsive`) solo decide si monta `HomeDesktop` ENCIMA de eso — nunca toca el móvil.
- **Carrusel de estilos cortado/gigante**: las tarjetas ocupaban ~76% del ancho (una sola visible, viéndose cropeada) — ahora son exactamente **3 por pantalla** (`w-[calc((100%-1.25rem)/3)]`, `aspect-square`) en los 3 lugares (bot, cotización formal, cotización rápida).
- **La pantalla se corría por el carrusel** (cotización rápida y, en general, cualquier lugar con contenido más ancho que el viewport): el carrusel y su contenedor en `quick-quote-form.tsx` usaban márgenes negativos (`-mx-4`/`-mx-5`) para sangrar a los bordes — dentro de un diálogo de ancho fijo eso empujaba el contenido más allá de su borde y corría toda la pantalla. Se quitó el sangrado: el carrusel ahora siempre cabe DENTRO del ancho de su contenedor (bot, wizard formal y cotización rápida), nada se escapa del viewport.
- Revisé "no cargan fotos en zona del cuerpo" en cotización formal: las rutas de imagen de `body-map-assets.ts` (`/body-map/...`) y `body-render-assets.ts` (`/body/...`) coinciden con los archivos reales en `public/`, no encontré una ruta rota en el código. Si el problema sigue después de este deploy, necesito una captura del paso exacto (Zona del cuerpo) para ubicarlo.

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis/paréntesis/llaves, imports/exports cruzados) en todos los archivos tocados.
- "Datos inválidos" al enviar la cotización rápida: no pude reproducirlo con certeza — el candidato más probable era el mismo desborde horizontal del carrusel (que ya se corrigió); si sigue pasando después de este deploy, dime en qué momento exacto aparece (¿con o sin foto adjunta? ¿cliente nuevo o existente?) para acotarlo.

## [0.94.1] - 2026-07-21

### Fixed

- **Home móvil roto**: `dashboard/page.tsx` montaba SIEMPRE los dos layouts (móvil y de iPad/escritorio) a la vez, ocultando uno con clases `md:hidden`/`hidden md:block` — visualmente parecía correcto, pero los dos árboles quedaban montados al mismo tiempo (dos `CalendarCard`, dos `NextSessionCard`, cada uno con sus propios diálogos/estado/FAB), y eso rompía el móvil. Nuevo `components/home/home-responsive.tsx`: decide en el cliente (`matchMedia`) cuál de los dos layouts MONTAR — nunca los dos — así el móvil vuelve a comportarse exactamente como antes de la versión de escritorio.
- **Carrusel de estilos**: ahora se ven **3 tarjetas completas por pantalla** (antes una tarjeta grande con un pedazo cortado de la siguiente asomando). Tarjetas más chicas (`calc((100%-1.25rem)/3)`) con `snap-start` para que el swipe siempre alinee grupos completos de 3, sin ninguna tarjeta cortada por el borde.
- **"Datos inválidos" al enviar la cotización del bot**: el schema de validación (`validations/intake.ts`) todavía exigía que `style` fuera exactamente UNO de los estilos conocidos (`z.enum`), pero el carrusel nuevo permite elegir varios y los guarda unidos por coma ("Realismo, Blackwork") — ese valor ya no calzaba con el enum y tumbaba el envío. Ahora `style` valida como texto libre, igual que ya hacía la validación de cotizaciones manuales.

## [0.94.0] - 2026-07-21

### Added

- **Barra de navegación desplegable** (sidebar de escritorio): botón para contraer/expandir (flecha en el borde), estado guardado en `localStorage` — persiste entre sesiones. Colapsada muestra solo íconos (con tooltip); el margen del contenido (`AppShell`) reacciona automáticamente al ancho real del sidebar.
- **Carrusel de estilos con selección múltiple, a pantalla/ancho completo** — nuevo `components/shared/style-carousel.tsx` (fotos grandes, scroll-snap horizontal, check por tarjeta), reemplaza la grilla de selección única en los 3 lugares que mostraban estilos:
  - Bot de solicitudes (`intake-chat.tsx`): ahora se eligen todos los estilos que apliquen y se confirma con "Continuar" (antes, tocar una tarjeta avanzaba de inmediato).
  - Cotización formal (`step-details.tsx`, paso Detalles).
  - Cotización rápida (`quick-quote-form.tsx`).
  - Cero cambios de esquema: varias selecciones se guardan en el mismo campo de texto de siempre (`style`), separadas por coma (p. ej. "Realismo, Blackwork") — todo lo que ya lee ese campo (resúmenes, PDF, landing) sigue funcionando igual.

### Fixed

- **El bot ya no vuelve a preguntar la fecha de nacimiento** si el cliente ya la tenía guardada: nueva columna real `clients.birthdate` (antes no existía en ningún lado — por eso se preguntaba siempre). Al resolver el teléfono contra un cliente existente, si tiene `birthdate` guardado el bot calcula la edad automáticamente y salta ese paso; si no lo tenía, se guarda la respuesta para la próxima vez.

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis/paréntesis/llaves, imports/exports cruzados) en todos los archivos tocados; migración de Supabase (`clients.birthdate`) aplicada.
- El estado colapsado/expandido del sidebar se sincroniza entre `Sidebar` y `AppShell` vía un evento de `window` (`ofink:sidebar-collapsed`) más `localStorage`, no vía contexto de React — es intencional (son dos componentes hermanos sin un padre client común más arriba), pero vale la pena migrarlo a contexto si en el futuro hay más consumidores de ese estado.

## [0.93.0] - 2026-07-21

### Added

- **Home exclusivo para iPad/escritorio** (`hidden md:block` en `dashboard/page.tsx`; el móvil sigue exactamente igual, `md:hidden`, cero cambios de lógica/datos): nuevo `components/home/home-desktop.tsx` que reorganiza los MISMOS datos que ya calculaba `DashboardPage` en un layout premium — portada + jornada, próxima sesión, y dos columnas (70/30: Calendario + Sesiones de hoy | Resumen del día + Pendientes importantes). Se sacan del Home (quedan solo en `/dashboard/stats`, sin tocarlas) las tarjetas de métricas/objetivo del mes — el Home ahora es 100% sobre HOY.
  - **Foto de portada configurable** (Ajustes → Perfil del estudio → Foto de portada): subir/cambiar/quitar, mismo patrón exacto que el logo (`uploadStudioCover`/`removeStudioCover`, bucket real `studio-covers` en Supabase con las mismas políticas RLS que `studio-logos`). Columnas nuevas `cover_photo_url`/`cover_photo_path` en `studios`. Sin portada: fondo oscuro con textura sutil (radial-gradient), nunca un espacio vacío.
  - **Tarjeta "Iniciar sesión" / jornada** (`work-shift-card.tsx`): reloj HH:MM:SS en vivo desde que se inicia hasta que se finaliza. Tabla nueva `work_shifts` (RLS por artista) + acciones `startWorkShift`/`endWorkShift` (`actions/work-shifts.ts`) + `getActiveWorkShift` — el contador sobrevive a un refresh porque `started_at` vive en la base, no en el estado del cliente.
  - **Pendientes importantes** (`pending-important-card.tsx`): cotizaciones sin revisar (`quotes.status = 'new'`), proyectos aprobados sin agendar (`projects.status = 'approval'`) y consentimientos sin firmar — los 3 ya existían como datos, ninguno se inventó.
- **2 plantillas de WhatsApp más** (Ajustes → Personalización → Plantillas de WhatsApp, ahora son 6 en total):
  - **Solicitud del bot** (`bot_contact_template`): el mensaje que el cliente le manda al estudio al terminar el bot de solicitudes (antes texto fijo en `lib/intake/message.ts`, ahora editable con placeholders `{nombre_estudio}`, `{nombre_cliente}`, `{genero}`, `{edad}`, `{zona}`, `{tamano}`, `{color}`, `{idea}`, `{cierre}`).
  - **Confirmar cotización desde la landing** (`quote_confirm_template`): el mensaje de "Reservar mi proyecto" / "¿Tienes dudas?" en la landing pública de una cotización (antes texto fijo en `lib/pdf/quote-template-data.ts`, ahora editable con `{id_cotizacion}`). Conectado también en la consulta pública por token (`queries/quote-links.ts`, sin sesión).

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis/paréntesis/llaves, imports/exports cruzados) en todos los archivos tocados; migraciones de Supabase aplicadas y verificadas con `get_advisors` (mismas alertas preexistentes de buckets públicos, ningún hallazgo nuevo).
- El breakpoint del nuevo Home (`md:`, 768px) no coincide con el de la barra lateral de escritorio (`lg:`, 1024px, en `AppShell`/`Sidebar`) — en iPad portrait (768–1023px) se ve el contenido nuevo dentro del chrome móvil (topbar + barra inferior), ya que ese cambio de shell no estaba pedido. Si se quiere unificar, hay que decidir un único breakpoint para ambos.
- La frase motivacional del hero es texto fijo (rota por día del mes entre 5 opciones), no es un dato configurable por el tatuador — no se pidió explícitamente que lo fuera.

## [0.92.0] - 2026-07-20

### Added

- **Plantillas de WhatsApp editables** (Ajustes → Personalización → Plantillas de WhatsApp, misma ruta `/dashboard/settings/mensajes` de siempre, ahora con más contenido): además del mensaje de cotización que ya existía (`quote_message_template`), ahora también son editables el **recordatorio de saldo pendiente** (Finanzas → Pendientes por cobrar), el **recordatorio de sesión** (tarjeta de próxima sesión en Inicio) y el **contacto general de proyecto** (ficha/popup de un proyecto). Nuevas columnas reales en `studios` (`reminder_balance_template`, `reminder_session_template`, `contact_client_template`, migración aplicada en Supabase, cada una con su texto de ejemplo por defecto). Cada plantilla en `mensajes-form.tsx` muestra dónde se usa, sus placeholders válidos (`{nombre_cliente}`, `{saldo}`, `{fecha}`, `{hora}`, etc.) y un botón "Usar ejemplo" que restaura el texto sugerido — el tatuador parte de una guía, no de un campo en blanco. Nuevo `lib/messages/templates.ts` (reutiliza `buildMessage` de `lib/quotes/message.ts`, sin duplicar lógica) y acción `updateMessageTemplates` (reemplaza a `updateQuoteTemplate` en el formulario; se deja la anterior intacta por compatibilidad).
- Enlace directo a "Plantillas de WhatsApp" agregado dentro de la tarjeta **Personalización** del Centro de control de Ajustes (antes solo aparecía bajo Clientes/Bot).

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis/paréntesis/llaves, imports/exports cruzados) en todos los archivos tocados; migración de Supabase aplicada y verificada con `get_advisors` sin nuevas alertas de seguridad.
- El bug de tarjetas de estilo comprimidas (`(bot)/t` → "Definamos el estilo de tu tatuaje") ya está corregido desde v0.91.0 en este código; si en producción se sigue viendo comprimido, es porque ese build todavía no se desplegó.

## [0.91.0] - 2026-07-20

### Fixed

- **Bug de tarjetas de estilo comprimidas**: `aspect-square` estaba en el `<button>`, que era a la vez ítem de grid y contenedor flex — esa combinación colapsaba la altura a franjas delgadas. Se movió `aspect-square` a la imagen (`<span>`) directamente; el botón ahora es un bloque normal (imagen + etiqueta apiladas en flujo), patrón mucho más robusto y predecible entre navegadores.

### Added

- **Nota de voz con transcripción automática en "Tu idea"** (`TextEntry`, prop `allowVoice`): mismo patrón ya probado de `quick-quote-form.tsx` (Deepgram vía `actions/transcribe.ts`, que ya existía pero no estaba conectado al bot) — mantener presionado para grabar, transcribe al soltar y agrega el texto a lo ya escrito. Sin cambios en `actions/transcribe.ts`.
- **Toggle para apagar la pregunta de disponibilidad** (Ajustes → Bot): nueva columna real `studios.bot_ask_availability` (migración aplicada en Supabase, default `true`). Si el tatuador lo apaga, el bot salta directo de la descripción/contacto al resumen — `flow.ts` (`nextStepId`) ahora recibe este flag opcional (default `true`, no rompe los tests existentes ni otros llamados).
- **Pregunta de disponibilidad rediseñada**: "¿Qué días te quedan mejor?" → **"¿Qué día se acomoda mejor a tu tiempo?"**. Antes calculaba 8 fechas específicas futuras (`nextOpenDays`, ventana de 60 días); ahora ofrece los días de la semana (Lunes..Domingo) que el estudio ya tiene habilitados en Ajustes → Horario (`open_days`, que ya guardaba exactamente LUN/MAR/MIE/JUE/VIE/SAB/DOM) — una preferencia general de día, no una fecha puntual; el estudio coordina la fecha exacta después. Simplifica bastante `(bot)/t/[slug]/page.tsx` (ya no necesita consultar `blocked_days` para este paso).

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis/paréntesis/llaves, imports/exports cruzados) en todos los archivos tocados; migración de Supabase aplicada y columna verificada.

## [0.90.0] - 2026-07-20

### Fixed

- **Campos del bot tapados por el teclado**: el contenido de cada paso (`intake-chat.tsx`) se centraba verticalmente (`justify-center`), así que en pasos con poco contenido (nombre, edad, teléfono, email, descripción) el campo quedaba a mitad de pantalla — justo donde el teclado lo tapa. Ahora el contenido se alinea arriba (`justify-start`), pegado al título de la pregunta, siempre visible sobre el teclado. Complementa el `interactiveWidget: resizes-content` de v0.88.0. Los pasos con grillas (tamaños, zona, estilos) no cambian de aspecto porque ya llenan todo el espacio disponible.
- **Estilos del bot comprimidos**: la grilla de 16 estilos + "Otro" volvía las fotos muy chicas al forzarlas a caber en 6 filas sin scroll. Ahora son tarjetas cuadradas más grandes en 2 columnas, con scroll vertical propio — a diferencia de tamaños/zona (que si calzan bien sin scroll), acá se prioriza ver la foto completa y nítida sobre que quepa todo en una pantalla.

## [0.89.0] - 2026-07-20

### Added

- **Módulo de Gastos y costos** (Ajustes → Estudio → Gastos y costos, `/dashboard/settings/gastos`): el tatuador registra gastos con la **categoría que quiera** — sin catálogo fijo que mantener, texto libre. Nueva tabla `expenses` (migración real vía Supabase, RLS por estudio igual que el resto de tablas: `studio_id in (select artists.studio_id from artists where artists.user_id = auth.uid())`), `queries/expenses.ts`, `actions/expenses.ts` (crear/eliminar), `gastos-panel.tsx`.
- **Módulo de Inventario de insumos** (Ajustes → Estudio → Inventario, `/dashboard/settings/inventario`): alta de insumos con nombre/categoría/unidad libres, +/- de cantidad desde la lista, alerta visual de "stock bajo" opcional (`min_stock` por insumo). Nueva tabla `inventory_items` (misma política RLS), `queries/inventory.ts`, `actions/inventory.ts`, `inventario-panel.tsx`.
- **Botón "Contactar por WhatsApp"** en Proyectos: nuevo `contact-client-whatsapp.tsx` (reutiliza `waLink`, mismo criterio que el resto de la app — no aparece si el cliente no tiene teléfono). Agregado en el popup rápido de proyecto (`project-detail-dialog.tsx`) y en la ficha completa (`projects/[id]/page.tsx`). Para esto se agregó `phone` al `select` de `clients` en `queries/projects.ts` (dato que ya existía en la tabla, solo faltaba pedirlo).
- **Finanzas ahora usa los gastos reales**: con el módulo de Gastos ya existiendo, se pudieron sumar las secciones que en v0.88.0 se habían dejado fuera a propósito por falta de esa fuente:
  - **Utilidad estimada** en el Hero (cobrado − gastos del mes; no se dibuja si todavía no hay gastos registrados).
  - **Ingresos vs. gastos** (`finance-expenses.tsx`, `FinanceIncomeVsExpensesCard`) y **Gastos del estudio** en dona por categoría (`FinanceExpensesDonut`, conic-gradient, sin librería nueva).
  - Sigue sin estar "Rentabilidad por proyecto" con costo de materiales: los gastos son del estudio en general, no se asignan a un proyecto puntual todavía.

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis/paréntesis/llaves, imports/exports cruzados, y las migraciones de Supabase se aplicaron y verificaron con `get_advisors` sin nuevas alertas de seguridad).

## [0.88.0] - 2026-07-20

### Added

- **Nueva sección Finanzas** (Ajustes → Estudio → Finanzas, `/dashboard/settings/finanzas`): dashboard financiero premium (tarjetas grandes, negro profundo, verde OFINK, sin tablas) — todo consumido dinámicamente de datos ya existentes, cero cambios de lógica ni de esquema de base de datos:
  - **Hero**: facturación del mes, cobrado, pendiente + anillo circular de % cobrado (`finance-hero.tsx`).
  - **Salud financiera**: lectura automática 🟢/🟡/🔴 a partir del % cobrado y el avance hacia la meta (`finance-health.tsx`, `financeHealth()`).
  - **Meta del mes**: barra de progreso + micro-celebración al 100%, usando `monthly_goal_quoted_value` (Ajustes → Metas, ya existía) (`finance-goal.tsx`).
  - **Flujo de caja**: próximos ingresos estimados a partir de las sesiones agendadas de proyectos con saldo pendiente (`finance-cashflow.tsx`, `cashflowByDay()`).
  - **Pendientes por cobrar**: lista con estado (al día/próximo a vencer/vencido, inferido de la próxima sesión agendada) y botón "Recordar por WhatsApp" (`finance-pending.tsx`, reutiliza `waLink`).
  - **Producción**: horas tatuadas, sesiones realizadas, clientes nuevos, ticket promedio, valor por hora (`finance-production.tsx`, reutiliza `hoursTattooed`/`clientsBreakdown`/`averageTicket` de `period-metrics.ts`, ya usados en `/dashboard/stats`).
  - **Servicios más rentables** y **Clientes más importantes**: rankings por facturación real, no por cantidad (`finance-rankings.tsx`, `topServicesByRevenue()`/`topClientsByRevenue()`).
  - Nuevo `src/lib/finance/metrics.ts`: todas las funciones puras de la sección.
  - **Deliberadamente NO incluido** (no existe esa fuente de datos en la BD y no se debía cambiar el esquema): Utilidad estimada, Ingresos vs. Gastos, Rentabilidad por proyecto (costo de materiales), Gastos del estudio, Calendario financiero como grilla. Se puede sumar el día que exista un módulo de costos/gastos real.
- **Paso "¿Qué quieres llevar en tu piel?" del bot rediseñado** (`intake-chat.tsx`, `ServiceCards`): tarjetas fotográficas en blanco y negro (reutilizan las fotos de estilos ya existentes en `public/styles/`, no se generó fotografía nueva — no hay herramienta de generación de imágenes en este entorno) con overlay degradado, bordes de 28px, hero con título/descripción + ilustración de máquina de tatuar con halo verde. Selección con micro-animación (~180ms: borde + check) antes de disparar el mismo `onPick(service)` de siempre — cero cambios de lógica/flujo.

### Changed

- **Teclado nunca tapa los campos**: `interactiveWidget: "resizes-content"` en el viewport global (`layout.tsx`) — el visual viewport se encoge cuando aparece el teclado en vez de quedar tapado por él, así cualquier campo o botón fijo/sticky (bot, formularios, FormSheet) queda siempre visible arriba. Aplica a toda la app, sin tocar ningún formulario individual.

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis/paréntesis/llaves, imports/exports cruzados) en todos los archivos tocados o creados.
- `interactiveWidget: "resizes-content"` es un estándar relativamente nuevo (mejor soporte en Chrome/Android); en iOS Safari el comportamiento depende de la versión — como la app ya usa unidades `dvh` de forma consistente, la mejora debería notarse igual en la mayoría de dispositivos, pero vale la pena probarlo en un iPhone real.

## [0.87.0] - 2026-07-20

### Fixed

- **Cotización formal: no aparecía botón para crear la cotización al llegar al Resumen.** El botón "Guardar cotización" existía, pero vivía suelto al final del contenido scrolleable del paso 5 (decisión original: el footer sticky del wizard solo mostraba "Atrás" en ese paso) — en pantallas donde el resumen no dejaba claro que había que bajar más, quedaba fuera de vista y parecía no existir. Ahora el botón vive en el footer sticky (igual que "Continuar" en los demás pasos), siempre visible sin depender de scroll.
  - `step-summary.tsx`: mismo `handleSave`/estado `saving` de siempre — ahora se lo pasa al footer del wizard vía `onRegisterSave`/`onSavingChange` (props nuevas, opcionales) en vez de renderizar su propio botón al final.
  - `quote-wizard.tsx`: el footer sticky, en el último paso, muestra "Atrás" + "Guardar cotización" (antes solo "Atrás"). El botón dispara la closure más reciente de `handleSave` vía un ref.
  - Cero cambios en la lógica de guardado (creación de cliente nuevo si aplica, creación de la cotización, pantalla de éxito con WhatsApp).

## [0.86.0] - 2026-07-20

### Fixed

- **Explorador de zona corporal (`body-map-explorer.tsx`) sin scroll y con nombre siempre visible**: `RegionScreen` (Cabeza/Brazos/Torso/Piernas), `GroupPicker` (Cuello/Cara), `LadoPicker` (Derecho/Izquierdo) y `ProfundidadPicker` (Externa/Interna) pasaban por el mismo problema que ya se había corregido en `ItemGrid` — filas de altura "auto" que dependían del contenido en vez de una altura fija, así que en pantallas chicas el nombre de la categoría quedaba empujado fuera de la pantalla (o directo no calzaba) y el usuario tenía que hacer scroll para verlo. Mismo arreglo que ya se aplicó a tamaños/subzonas/estilos: grilla de altura fija (`h-full` + filas explícitas), foto arriba + nombre siempre visible debajo, sin scroll.
- **Fotos del cuerpo completas, sin recortar**: todas las fotos de referencia corporal del bot (región, cuello/cara, lado, profundidad, subzona, tamaño, género) pasan de `object-cover` (recortaba cabeza/pies para llenar el marco) a `object-contain` (se ve la persona completa, con el fondo negro de la tarjeta rellenando el resto). Aplica en `body-map-explorer.tsx` y `body-cards.tsx` — no se tocaron las fotos de estilos de tatuaje (`StyleCards`, `bot-intake-summary.tsx`, `step-details.tsx`), que son acercamientos de piezas reales y sí deben recortarse tipo mosaico.
- Como `BodyMapExplorer`/`BodySizeCards` son los mismos componentes que reutilizan la cotización formal (`step-zone.tsx`, `step-details.tsx`) y la cotización rápida (`quick-quote-form.tsx`), ambos arreglos aplican automáticamente ahí también — sin tocar esos archivos.

## [0.85.0] - 2026-07-20

### Added

- **Rediseño completo del modal "Editar cotización"** (`quote-form.tsx`, rama exclusiva para `isEdit`, el modal "Nueva cotización" no se tocó): tarjetas independientes con ícono + tipografía grande (Cliente, Zona corporal, Estilo, Descripción, Precio, Sesiones, Abono, Notas), tema oscuro `#0D0D0D`/`#171717`/`#2B2B2B`, acento verde lima, radios de 24px. Mismos `name`/`control`/`onSubmit` de siempre — solo cambió JSX y clases.
  - **`duration-accordion.tsx`** (nuevo): reemplaza el input de texto libre de "Duración aproximada por sesión" por un acordeón — cerrado muestra ícono + valor actual; expandido, chips de selección rápida (30 min a +4 horas) y el mismo reloj circular arrastrable del selector de citas del calendario (`duration-dial.tsx`), ahora embebido en línea. Chips y reloj sincronizados en ambos sentidos. Sigue siendo el mismo campo de texto (`avg_session_duration`) por debajo — nada cambia en cómo se guarda.
  - **`tattoo-machine-icon.tsx`** (nuevo): ilustración outline en verde para el header del modal (no había asset propio en `public/` para esto).
  - **`form-sheet.tsx`**: se agregaron props opcionales `header`, `popupClassName`, `closeButtonClassName` para permitir un header 100% custom en este modal puntual, sin afectar el resto de formularios de la app (clientes, proyectos, cotización nueva) que no las usan.
  - **`delete-quote-button.tsx`**: prop opcional `label` (default `'Eliminar'`, sin cambio de comportamiento) para poder mostrar "Eliminar cotización" en el footer del modal rediseñado, reutilizando el mismo componente/lógica de siempre (con su confirmación).
- **Botón circular "agregar cita"** junto a "Duración estimada" en el detalle de cotización — visible solo si la cotización ya se convirtió en proyecto (`projects.quote_id`). Abre el mismo diálogo de agendamiento (`schedule-session-button.tsx`, nuevo) que ya usa cotización rápida. Nuevas `getProjectIdByQuoteId`/`getProjectIdsByQuoteIds` en `queries/projects.ts`.
- **Abono requerido en el detalle de cotización** ahora refleja lo configurado en Ajustes → "Abono para reservar" (monto fijo o %), con el `deposit_percentage` propio de la cotización como respaldo si el estudio todavía no configuró nada. Encadenado desde `quotes/page.tsx` y `quotes/[id]/page.tsx` hasta `quote-detail-content.tsx`.
- **Resumen del bot en Cotizaciones**: la respuesta de estilo ahora muestra la miniatura real del estilo elegido (mismo catálogo de `public/styles/`), no solo el texto.
- **Landing pública del proyecto**: nuevo badge "Proyecto en marcha" + copy del hero que cambia una vez la cotización se convirtió en proyecto (`isProject` en `getPublicQuoteProject`). La sesión agendada y el botón "Agregar a mi calendario" (Google/ICS) ya existían desde v0.84.0.

### Changed

- **Botón "Editar" → "Agregar precio"** (`edit-quote-button.tsx`): mientras la cotización no tiene precio (ni es cortesía) el botón invita a "Agregar precio"; con precio ya asignado vuelve a decir "Editar". Mismo formulario en ambos casos.
- **Grillas del bot sin scroll** (`body-cards.tsx`, `body-map-explorer.tsx`, `intake-chat.tsx`): tamaños, subzonas del explorador anatómico y los 16 estilos + "Otro" pasan de listas/grillas que desbordaban la pantalla (o de un scroll interno permitido para estilos) a grillas de filas fijas que calzan completas, siempre con el mismo patrón "foto arriba, nombre debajo".
- **Idioma del bot**: se corrigió voseo rioplatense que se había colado en 3 textos ("tenés", "querés", "podés") a tuteo — español colombiano — en `copy.ts`, `intake-chat.tsx` y `body-map-explorer.tsx`.

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis/paréntesis/llaves, imports/exports cruzados) en los archivos tocados o creados en esta sesión.

## [0.84.0] - 2026-07-20

### Added

- **Teléfono como primer dato del bot** (`phone`, nuevo `StepId` antes de `name`): al escribirlo, se busca si ya existe como cliente del estudio (`lookupClientByPhoneForBot`, solo lectura). Si existe, se precargan nombre y email y el bot salta esas preguntas más adelante (`nextStepId` ahora depende de `answers.name`/`answers.email` para decidir si pregunta o no). Si no existe, el flujo sigue exactamente igual que antes.
- **Disponibilidad real en vez del balde genérico**: se eliminó `INTAKE_AVAILABILITY` (mañanas/tardes/noches) del schema — ahora `availability` es texto libre con los días reales que el cliente elige (hasta 3) de una lista calculada en `page.tsx` a partir del horario del estudio (`open_days`/`open_time`/`close_time`, reutilizando `isOpenDay()` de `month-metrics.ts`, sin duplicar esa lógica) y los días bloqueados (`blocked_days`). Si el estudio no tiene horario configurado, se avisa y se ofrece coordinar por WhatsApp en vez de romper el paso.
- **Calendario de edad ya no se abre solo**: se quitó el `autoFocus` del input de fecha de nacimiento (v0.82.0) — ahora el selector nativo solo aparece al tocar.
- **Botón final renombrado**: "Enviar por WhatsApp" → "Enviar solicitud de tatuaje".
- **Selector de tamaño/zona unificado entre bot, cotización formal y cotización rápida** — "una sola base de datos", como se pidió:
  - **Cotización formal** (`quote-wizard/step-zone.tsx`, `step-details.tsx`): la silueta ilustrativa + chips de zona (`BodySilhouette`, `FRONT_ZONES`/`BACK_ZONES`) y los tamaños con `ArmSizeIcon` (`WIZARD_SIZES`, con rangos en cm que ni siquiera coincidían con los del bot) se reemplazaron por el mismo `BodyMapExplorer` y `BodySizeCards` del bot — mismas fotos reales, mismo vocabulario exacto en `quotes.body_zone`/`quotes.size`. `WizardDraft` ganó un campo `gender` (solo para elegir qué fotos mostrar, no se guarda) y perdió `view` (ya no hace falta, el explorador maneja frente/espaldas internamente para Torso).
  - **Cotización rápida** (`quotes/quick-quote-form.tsx`): agregada una sección opcional "Zona y tamaño exactos" (no rompe el diseño de "una sola pantalla" — sigue siendo opcional, con los presets de precio intactos) que abre un diálogo con los mismos componentes.
  - `BodySizeCards` ganó un `initialValue` opcional (para poder reabrir el wizard/diálogo con un tamaño ya elegido sin perderlo).
  - De paso, las fotos reales de estilo (`public/styles/`, v0.83.0) ahora también se ven en `step-details.tsx` — antes mostraba un placeholder de inicial. Nuevo `STYLE_SLUG`/`styleRender()` centralizados en `lib/body-render-assets.ts` (antes vivía duplicado dentro de `intake-chat.tsx`).
- **12 fotos de tamaño integradas** en `public/body/` (las que mandaste — 6 tamaños × 2 géneros).
- **Resumen del bot en Cotizaciones** (`bot-intake-summary.tsx`): se agregaron las filas de género y edad, que faltaban desde que esos campos se guardan (v0.80.0).
- **Botón "Agregar a mi calendario"** en la landing pública del proyecto (`/proyecto/[token]`): si la cotización ya se convirtió en proyecto y tiene una sesión futura agendada, aparece una tarjeta con la fecha y un botón que ofrece Google Calendar o descarga `.ics` (Apple Calendar/Outlook) — todo generado en el navegador, sin necesitar ningún servicio de email. Nueva `getPublicQuoteProject` ahora también trae `nextSession` (consulta a `projects`/`sessions` vinculados a la cotización).
- **Confirmación con lo que escribieron, en pantalla**: la pantalla de éxito del bot ahora tiene un desplegable "Ver lo que enviaste" con el resumen completo de sus respuestas. No hay email ni WhatsApp Business API integrados todavía (ver Known Issues), así que esto es lo más parecido a una "confirmación" que se puede ofrecer sin esos servicios — el cliente puede hacer captura de pantalla.

### Changed

- `intake-chat.tsx`: `ContactEntry` (email+teléfono juntos) se separó en `PhoneEntry` (primer paso, con la búsqueda de cliente) y `EmailEntry` (paso `contact`, ahora solo email). Nuevo `AvailabilityDaysPicker` reemplaza los `Chips` de disponibilidad genérica.
- Resumen del bot (`summary.tsx`): la fila "Contacto" (email · teléfono combinados) se separó en "Teléfono" y "Email", cada una editable por separado — antes tocar esa fila solo permitía editar el email aunque mostrara ambos datos.

### Known Issues

- **Sin email todavía** (decisión explícita: se dejó para más adelante). La confirmación de fin de bot y el aviso de sesión agendada quedan resueltos por pantalla/landing pública en vez de por correo — cuando se agregue Resend, se puede sumar sin tocar lo que ya existe.
- El explorador de zona (`BodyMapExplorer`) reusado en el wizard formal no recuerda la ruta exacta si el tatuador vuelve atrás y adelante entre pasos (sí recuerda el tamaño, gracias a `initialValue`) — reabre desde "Región". Queda el valor final guardado en `draft.zone`, solo se pierde el camino visual recorrido.
- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual exhaustiva (balance de sintaxis + imports/exports cruzados) en los 18 archivos tocados/creados en esta sesión.

## [0.83.0] - 2026-07-20

### Added

- **16 fotos reales de estilos de tatuaje** (`public/styles/`, convertidas de PNG a WEBP) reemplazan los degradados de color (`STYLE_VISUALS`) que se usaban desde v0.75.0.
- **`INTAKE_STYLES` ampliado** de 8 a 16 estilos con foto + "Otro" + "No lo sé": se agregaron Microrealismo, Tradicional, Chicano, Lettering, Anime, Dotwork, Tribal, Surrealismo. **Se quitó "Japonés"** (no llegó foto de ese estilo) y se reemplazó por **"Oriental"** (si llega una foto de Japonés más adelante, se puede volver a separar).
  - Como `INTAKE_STYLES` es la única fuente de verdad para estilos en todo el proyecto, este cambio se propagó automáticamente a los otros 4 lugares que ya lo usaban sin tocarlos: el selector de especialidad en onboarding (`step-specialty.tsx`), el perfil de artista en Ajustes (`artista-form.tsx` — esto era lo que pediste para "cuando los tatuadores escogen qué estilos trabajan"), el wizard de cotización manual (`step-details.tsx`) y el formulario rápido de cotización (`quick-quote-form.tsx`).
  - `lib/pdf/style-theme.ts` (ajusta el look de la cotización en PDF según el estilo): se agregó `oriental` como alias del tema que ya tenía `japones`/`irezumi`, y `microrealismo` (una r) como alias de `microrrealismo` (dos r, ya existía) — cosmético, no cambia lógica.
- **Tarjeta especial para "Otro"** (`OtroCard`, dentro de `intake-chat.tsx`): ícono circular, título grande, línea de acento, descripción, tira de fotos de referencia (recortada de la pieza de marca que compartió el estudio) y CTA "¿Tienes algo único en mente? Hagámoslo realidad." — inspirada directamente en la imagen de referencia enviada en el chat, en vez de una fila más de la lista.

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis, imports/exports, chequeo de que los 16 slugs de `STYLE_SLUG` tengan su archivo correspondiente en `public/styles/`).

## [0.82.0] - 2026-07-20

### Changed

- **Se eliminó "Vista" como primer paso del explorador de zonas.** Ahora el bot va directo a Región (Cabeza/Brazos/Torso/Piernas). "Frente/Espaldas" solo se pregunta *dentro* de Torso — es la única región cuyo contenido cambia según el lado (pecho/abdomen vs. paletas/espalda), tal como se aclaró en el chat.
- **Orden espejado en todas las opciones izquierda/derecha del explorador** (`body-map-explorer.tsx`): el lado derecho ahora aparece siempre primero (columna izquierda de la grilla), igual a como se ve una persona de frente — antes el orden seguía el texto ("izquierdo" antes que "derecho"), que no correspondía a la imagen. Aplica a brazo, pierna, cuello y los pares de torso (pectoral, costilla). Nueva función `mirrorPairs()` que reordena automáticamente cualquier par consecutivo izq/der detectado por nombre de archivo.
- **Nombre visible debajo de cada imagen del explorador**: se movió de un bloque de texto separado (que en algunos casos no se distinguía bien) a una etiqueta superpuesta sobre la propia foto, con degradado oscuro detrás para que siempre se lea bien sin importar el contenido de la imagen.
- **Paso de edad rediseñado por completo**: en vez de un input numérico (que en iOS/Android tapaba el botón "Continuar" con el teclado), ahora es un selector de **fecha de nacimiento** (`<input type="date">`) que abre el selector nativo del teléfono. La edad se calcula automáticamente a partir de la fecha y se sigue guardando igual que antes (`answers.age`, mismo campo, mismo `intakeSchema`, sin cambios de base de datos). El layout ahora se alinea arriba de la pantalla (no centrado), así el botón nunca queda tapado por el selector nativo.
- Se eliminaron los 2 renders espejados temporales (`male-pierna-izquierda-externa`, `male-torso-costilla-der`) — confirmado que esas fotos no van a llegar. En su lugar, `body-map-assets.ts` reutiliza directamente la foto real del lado opuesto para esos dos casos puntuales (sin inventar un espejo).

### Known Issues

- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis, imports/exports).
- El próximo lote de imágenes (botones de estilo de tatuaje) está definido pero no integrado — 10 archivos, ver conversación (`style-realismo.png` ... `style-no-lo-se.png`, 720×1000).

## [0.81.0] - 2026-07-20

### Added

- **Explorador anatómico completo con fotos reales** (`body-map-explorer.tsx`) — reemplaza el carrusel de zonas (`BodyZoneCards`/`BodySubzoneCards` de v0.76.0/v0.79.0, procedurales) por el árbol de navegación que se armó en el chat: **Vista (Frente/Espaldas) → Región (Cabeza/Brazos/Torso/Piernas) → subzona específica**, con 134 fotos reales enviadas por el estudio (`public/body-map/`, convertidas de PNG a WEBP).
  - Cabeza: Cuello (lateral izq/der, centro, completo) o Cara (orejas, frente, pómulos).
  - Brazos: lado (izq/der) → externa/interna → 4 o 3 subzonas específicas.
  - Torso: el contenido cambia según la vista elegida — Frente muestra pecho/abdomen/costillas (8 opciones), Espaldas muestra paletas/espalda alta-media-baja (6 opciones). Misma región, contenido distinto — tal como se definió en el chat.
  - Piernas: lado (izq/der) → externa/interna → subzonas (glúteo/muslo/rodilla/gemelo/pie en externa; muslo/canilla/gemelo en interna).
  - Breadcrumb navegable arriba de cada pantalla (tocar un nivel anterior vuelve ahí), transición fade entre niveles, y una salida rápida "No estoy seguro todavía" desde el primer nivel.
  - El resultado final (p. ej. *"Brazo — Derecho — Externa — Codo"*) se guarda en `answers.zone` tal cual — `buildBodyZone()` no se tocó, ya sabía manejar un string armado así.
  - `GenderCards` (paso de género) ahora usa las fotos reales `sexo-hombre.webp`/`sexo-mujer.webp` en vez de un ícono genérico.
  - `flow.ts`: el paso `zone` ahora va siempre directo a `color` (antes se desviaba a `subzone` solo para Brazo/Pierna) — la subzona quedó embebida dentro del explorador. El `StepId` `subzone` se dejó en el tipo por compatibilidad, pero ya no se enruta ahí.

### Changed — sobre las imágenes recibidas

Se subieron 140 archivos; se integraron 136 (los que pide el árbol) más 4 bonus (`ext-gemelo` en piernas, no estaba en el plan original pero se sumó como opción extra tanto en externa como en interna). Se descartaron 4 archivos sueltos sin relación (capturas de pantalla / exports fallidos) y se corrigieron nombres con typos (extensiones dobles, espacios, "gemelos"→"gemelo", "frente-region-"→"region-").

### Known Issues

- **Faltan 4 fotos reales todavía**: `male-vista-frente`, `male-vista-espaldas`, `female-vista-frente`, `female-vista-espaldas` nunca llegaron. Mientras tanto, el paso "Vista" no usa foto — son dos botones simples (íconos de ojo abierto/cerrado). Si las mandan más adelante, se pueden agregar como fondo de esos dos botones sin tocar el resto del explorador.
- **2 fotos son temporales (espejadas)**: `male-pierna-izquierda-externa.webp` y `male-torso-costilla-der.webp` no llegaron — se generaron reflejando horizontalmente `male-pierna-derecha-externa` y `male-torso-costilla-izq` respectivamente (mismo criterio: mejor un placeholder honesto y documentado que bloquear el flujo). Reemplazar por las reales apenas estén listas, mismo nombre de archivo.
- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis, imports/exports, diff programático de los 136 nombres de archivo contra lo recibido — no a ojo).

## [0.80.0] - 2026-07-20

### Added

- **Género y edad ahora se guardan en la cotización** (`quotes.gender`, `quotes.age` — migración aplicada directamente en Supabase, `ofink-maqueta`; advisors de seguridad revisados, sin hallazgos nuevos). Antes de esta versión el género elegido en el bot solo se usaba para mostrar la librería de renders correcta y se perdía al enviar la solicitud.
  - Nuevo paso **"¿Cuántos años tenés?"** (`age`, nuevo `StepId`) justo después de género — input numérico grande, valida 10–100.
  - `intakeSchema` ahora exige `gender` (`z.enum(INTAKE_GENDERS)`) y `age` (`z.coerce.number().int().min(10).max(100)`) — cualquier solicitud nueva del bot los incluye.
  - El mensaje de WhatsApp que recibe el tatuador (`buildIntakeMessage`) ahora dice *"Soy Andrés (Hombre, 27 años)"* — antes no incluía esto. Test actualizado (`message.test.ts`).
  - Resumen del bot (pantalla "Casi terminamos"): dos filas nuevas, Género y Edad, tocables para editar como el resto.
- **Nueva tarjeta "Tu público" en Estadísticas** (`stats-audience-card.tsx`): split hombres/mujeres con barras + porcentaje, edad promedio del mes, y distribución por franja etaria (10–17, 18–25, 26–35, 36–45, 46+). Todo sobre `quotes.gender`/`quotes.age` reales — si una cotización no tiene esos datos (por ejemplo, cotizaciones cargadas a mano por el tatuador, no por el bot, donde estos campos quedan en `null`), simplemente no cuenta para el promedio ni el split; no se inventa nada. Nuevas funciones puras en `lib/stats/period-metrics.ts`: `genderBreakdown()`, `ageStats()`.

### Known Issues

- Las cotizaciones creadas manualmente por el tatuador (no por el bot) no tienen género/edad — quedan fuera de "Tu público" hasta que ese flujo también los pida (no se tocó el flujo manual en esta versión, no se pidió).
- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual (balance de sintaxis, imports/exports) — en este release encontré y corregí a mano un error real durante la propia verificación (una edición había dejado la función `ContactEntry` sin su firma), lo cual confirma que vale la pena seguir haciendo este chequeo en cada entrega.

## [0.79.0] - 2026-07-20

### Added

- **Paso "¿Sos hombre o mujer?"** en el bot, justo después del nombre (`gender`, nuevo `StepId` en `flow.ts`) — dos tarjetas grandes, selección instantánea. Solo define qué librería de renders (masculina/femenina) se muestra en tamaño/zona/subzona; **no se agregó a `intakeSchema` ni se guarda en la cotización** — no hay columna de género en `quotes` y no quise inventar una sin que lo pidieran explícitamente para eso. Si en algún momento quieren guardarlo como dato del negocio (no solo para elegir imagen), es un cambio aparte.
- **Librería de renders duplicada por género** (80 archivos en `public/body/`, antes 40): cada tamaño/zona/subzona ahora tiene versión `male-*` y `female-*`. Mismo pipeline de antes (Playwright + template propio), extendido con:
  - Ropa deportiva superpuesta (top + short/calza) en ambas versiones — **sin desnudez en ningún caso**, a partir de las referencias con ropa que se compartieron en el chat (las primeras referencias tenían desnudo frontal completo incluyendo genitales; no se usaron — ver conversación).
  - Silueta femenina con una diferenciación sutil (busto, línea de cintura) sobre la misma base vectorial, para que ambas versiones se sientan parte de la misma familia visual.
  - Verificado por muestreo de píxeles (color de la ropa vs. piel vs. fondo, en ambas versiones) antes de integrarlas, mismo criterio que en v0.78.0.

### Changed

- `body-render-assets.ts` pasó de mapas fijos (`SIZE_RENDER`, `ZONE_RENDER`, etc.) a funciones (`sizeRender(gender, size)`, `zoneRender(gender, zone)`, `armSubzoneRender`, `legSubzoneRender`) que arman la ruta según el género elegido. Si el usuario no llegó a elegir género (o el bot se prueba saltándose ese paso), cae a la versión masculina por defecto — no rompe nada, solo es la base neutra.
- `BodySizeCards`, `BodyZoneCards` y `BodySubzoneCards` (`body-cards.tsx`) ahora reciben `gender` y lo propagan a los renders. Nueva `GenderCards` en el mismo archivo.
- Primer dato del bot sigue siendo nombre y apellido (v0.78.0); ahora el segundo es género.
- Service worker a `ofink-v40`.

### Known Issues

- El género no se persiste en la base de datos (ver arriba) — es puramente una preferencia de sesión para elegir la imagen correcta.
- Seguimos sin poder correr `npm install`/`next build`/`eslint` en este entorno. Verificación manual + muestreo de píxeles en los 80 renders (no los 80 uno por uno a mano, pero sí una muestra representativa de cada categoría).

## [0.78.0] - 2026-07-20

### Added

- **Biblioteca de renders corporales** en `public/body/` (40 archivos `.webp`): silueta gris tipo escultura sobre fondo negro con glow verde OFINK (#B8F400) resaltando la zona/tamaño correspondiente — mismo ángulo, zoom y encuadre en todos, solo cambia lo resaltado, tal como se pidió. **Nota importante**: no son renders 3D fotorrealistas de una persona (no tengo herramienta de generación de imágenes en este entorno, y una figura humana sin ropa —aunque no sea sexual— no es algo que pueda producir por política de contenido). Son renders **procedurales**: la misma silueta vectorial del proyecto (`lib/body-zones.tsx`, ya usada en el bot y en Estadísticas), rasterizada con Playwright/Chromium con degradados e iluminación simulada. Generados con un pipeline propio (`manifest.py` + `render.py` + `template.html`, no versionado en el repo, solo el resultado final en `public/body/`), verificado por muestreo de píxeles (color del glow vs. color del cuerpo vs. fondo) antes de integrarlos — no a ojo.
  - 6 tamaños (`body-size-*`), 19 zonas (`body-*`), 9 subzonas de brazo (`body-arm-*`) y 6 subzonas de pierna (`body-leg-*`). Mapeo completo en `lib/body-render-assets.ts`.
  - Convención de carpeta adaptada a Next.js: `public/body/` en vez de `/assets/body/` (en Next, todo lo servido como archivo estático vive en `public/`) — mismos nombres de archivo pedidos, solo cambia el prefijo de ruta.

### Changed

- **Reemplazo completo de la selección de tamaño y zona** en el bot (`intake-chat.tsx`) por tarjetas visuales con los renders de arriba — cero cambios en `flow.ts`, `applyEdit`, `submitIntakeAction` ni en cómo se guardan las respuestas (`answers.size`/`answers.zone`/`answers.subzone` siguen siendo los mismos strings de siempre).
  - **Tamaño** (`BodySizeCards`, en `body-cards.tsx`): grid de 2 columnas con el render, nombre corto y rango en cm, check al seleccionar. Reemplaza los cuadrados de color de `SizeCards` (que queda sin usar, no se borró).
  - **Zona** (`BodyZoneCards`): carrusel horizontal de tarjetas con el render de cada zona, aviso de que la subzona se afina después, botón Continuar. Reemplaza `BodyZonePicker` (silueta con puntos tocables de la v0.76.0, que queda sin usar, no se borró — mismo criterio que `bubbles.tsx`).
  - **Subzona** (`BodySubzoneCards`): lista con miniatura + nombre + descripción + radio, para brazo y pierna. Reemplaza los `Chips` de texto plano de este paso (el resto de pasos que usan `Chips` — disponibilidad — no se tocó).
  - Título dinámico del paso subzona: ahora muestra el nombre real de la zona elegida como título grande (p. ej. "Brazo"), igual al mockup, en vez de un texto genérico.
- **`INTAKE_ZONES` ampliado** de 11 a 19 zonas + "No lo sé" (agrega Antebrazo, Muñeca, Costillas, Abdomen, Cintura, Muslo, Pantorrilla, Tobillo, Ingle) — autorizado explícitamente. Sigue siendo texto libre en la base de datos (`quotes.body_zone` es `string`, no un enum en Postgres), así que **no hizo falta ninguna migración**. `lib/body-zones.tsx` (silueta compartida con el bot y con Estadísticas) ganó coordenadas para las 9 zonas nuevas — el mapa de calor de Estadísticas las va a mostrar automáticamente si algún cliente las elige, sin tocar ese componente.
- **Primer dato del bot: nombre y apellido.** El paso `name` (que ya era el primero del flujo) ahora pide explícitamente "nombre y apellido" — placeholder actualizado y una validación liviana nueva (`requireTwoWords` en `TextEntry`) que exige al menos dos palabras antes de dejar continuar, con un aviso ("Incluye tu apellido") si falta. El campo sigue siendo el mismo `answers.name` de siempre, sin cambios en `submitIntakeAction` ni en la base de datos.
- Service worker a `ofink-v39`.

### Known Issues

- Los renders de `public/body/` son procedurales (silueta + glow), no fotografías ni renders 3D reales de una persona. Si más adelante quieren reemplazarlos por renders fotorrealistas reales, el mapeo (`body-render-assets.ts`) y la convención de nombres ya están listos — alcanza con reemplazar los archivos `.webp` en `public/body/` uno por uno, sin tocar ningún componente.
- Seguimos sin poder correr `npm install` / `next build` / `eslint` en este entorno (sin red). Verificación manual de los archivos nuevos/tocados (balance de sintaxis, imports/exports cruzados) + verificación real de los renders por muestreo de píxeles con PIL. No reemplaza un build real de Next — revisar en el próximo deploy de Vercel.
- Las coordenadas de las 9 zonas nuevas en `lib/body-zones.tsx` son aproximaciones visuales sobre una silueta genérica (mismo criterio ya documentado en v0.76.0 para las zonas originales), no un mapa anatómico preciso.

## [0.77.0] - 2026-07-20

### Added

- **Metas mensuales** (Ajustes → Estudio → Metas, `/dashboard/settings/metas`): el tatuador puede definir tres metas recurrentes — valor a cotizar, proyectos a aprobar, sesiones a agendar — usadas por el nuevo dashboard de Estadísticas. Campo vacío = sin meta (no se dibuja esa barra, no se inventa ningún número). Nuevo schema (`updateMonthlyGoalsSchema`), acción (`updateMonthlyGoals`) y formulario (`metas-form.tsx`), mismo patrón que "Carta y negociación".
  - **Migración aplicada directamente en Supabase** (`ofink-maqueta`) con el conector: `alter table studios add column monthly_goal_quoted_value numeric, add column monthly_goal_approved_projects integer, add column monthly_goal_scheduled_sessions integer;`. Revisados los advisors de seguridad tras aplicarla — sin hallazgos nuevos (los 4 warnings existentes son de buckets de storage y auth, no relacionados).

### Changed

- **Rediseño total de Estadísticas** (`/dashboard/stats`), a partir del mockup de referencia — CERO cambios en cálculos existentes (`month-metrics.ts` intacto) ni en la base de datos más allá de las metas de arriba. Todo lo demás es reorganización visual + nuevas lecturas derivadas de datos ya reales.
  - **Hero superior** (`stats-hero.tsx`): foto del estudio (reutiliza `studio.logoUrl`, mismo campo que ya usa el bot), selector de mes, título "Tu estudio va [tono]" — el tono ("muy bien"/"estable"/"en pausa") se elige según el signo real del delta de cotizaciones vs. el mes anterior, nunca un texto fijo. Barra de "Meta mensual" — solo se dibuja si el estudio definió `monthlyGoalQuotedValue`.
  - **Resumen principal** (`stats-summary-strip.tsx`): valor cotizado, proyectos aprobados, sesiones agendadas (`metrics.scheduledSessions`, sin tocar) y ocupación (`metrics.occupancyPct`/`daysWithSessionOpen`/`workableDays`, sin tocar), cada uno con su delta real vs. mes anterior (`deltaPct`, sin tocar).
  - **Tarjetas secundarias** (`stats-secondary-grid.tsx`): sesiones próximas, ingresos confirmados, pendiente por aprobar, ocupación.
  - **Embudo de ventas** (`stats-funnel.tsx`) y **ranking de estilos/zonas** (`stats-styles-ranking.tsx`, `stats-zones-map.tsx`), **conversión, ingresos esperados, clientes, ticket promedio** (`stats-insight-cards.tsx`), **horas tatuadas** (`stats-hours-card.tsx`), **mini calendario de ocupación** (`stats-occupancy-calendar.tsx`, sobre `monthHeatmap()` ya existente) y **objetivos del mes** (`stats-objectives.tsx`): toda la lógica de derivación nueva vive en `src/lib/stats/period-metrics.ts` (funciones puras sobre `quotes`/`projects`/`sessions`/`clients` ya cargados — ninguna consulta nueva salvo `getClients()`, que ya existía).
  - **Gráfica combinada barras + línea** (`stats-trend-chart.tsx`): SVG hecho a mano, mismo criterio que `mini-bar-chart.tsx` (sin librería nueva) — barras de cantidad de cotizaciones por día, línea de valor cotizado por día.
  - **Mapa de zonas** (`stats-zones-map.tsx`) reutiliza la silueta corporal creada para el bot: se extrajo a `src/lib/body-zones.tsx` (`ZONE_POINTS`, `BodySilhouette`) para no duplicar el SVG entre `body-zone-picker.tsx` (bot) y el nuevo mapa de calor (Estadísticas) — cero cambio visual en el bot.
  - `PageHeader`/`MonthSummary` dejaron de usarse en esta pantalla (reemplazados por el Hero) — no se borraron, `MonthSummary` sigue export­ado por si se necesita en otro lado.
- **`getProjects`/`getProject`/`getProjectsByClient`**: se agregó `paid_at` al `select()` de `payments` (autorizado explícitamente) — permite calcular "Ingresos confirmados" exacto por mes (pagos cuyo `paid_at` cae en el mes), sin proxies. Se actualizó el mock de `dossier.test.ts` que construía pagos sin ese campo.
- Nuevo helper compartido `capitalize()` en `lib/calendar/utils.ts` (antes duplicado localmente en `month-summary.tsx`; ahora también lo usan `stats-hero.tsx` y `stats-trend-chart.tsx`).
- Service worker a `ofink-v38`.

### Known Issues

- Seguimos sin poder correr `npm install` / `next build` / `eslint` en este entorno (sin red). Verificación manual: balance de llaves/paréntesis en los 17 archivos nuevos/tocados, chequeo cruzado de que cada export/import usado existe con el nombre correcto, y búsqueda de imports sin uso. La migración de Supabase sí se aplicó y verificó de verdad (advisors revisados). No reemplaza un build real de Next — revisar en el próximo deploy de Vercel.
- `database.types.ts` (tipos generados) ya estaba desactualizado antes de este cambio (no incluía `quote_template_color` ni otros campos agregados en versiones anteriores) — los 3 campos de metas nuevos tampoco se agregaron ahí, seguimos el mismo patrón ya establecido en el proyecto (`studio.ts` castea manualmente).
- "Ingresos confirmados" sí es ahora 100% real (gracias a `paid_at`), pero sigue siendo un cálculo hecho en la página a partir de proyectos ya cargados, no una consulta agregada en base de datos — con muchos proyectos podría valer la pena moverlo a una vista/RPC en el futuro.

## [0.76.0] - 2026-07-20

### Changed

- **Rediseño total del bot de solicitudes** (`(bot)/t/[slug]`), a partir del mockup de referencia — CERO cambios de lógica: `flow.ts` (pasos, `nextStepId`, `applyEdit`, `buildBodyZone`), `submitIntakeAction`, validaciones (`lib/validations/intake.ts`), rutas y base de datos quedan intactos.
  - **De chat a pantallas completas**: `intake-chat.tsx` se reescribió por completo. Ya no hay un historial de burbujas apilándose — cada paso ocupa una pantalla propia a alto completo (`h-dvh`, sin scroll de página), con transición fade entre pasos. El mecanismo de "tocar para editar una respuesta anterior" (`applyEdit`/`startEdit`, sin tocar) ahora se dispara con una **flecha "Volver"** en el header (reabre en edición el último paso respondido; en el primer paso, vuelve a la portada) o tocando una fila del resumen — misma función, presentación nueva.
  - **Progreso en 5 fases** (antes 6): "Tamaño" se fusionó dentro de "Idea" (`intake-progress.tsx`) para calzar con el mockup — Idea · Ubicación · Estilo · Detalles · Listo. Círculos con check animado, glow en el paso activo, barra de progreso segmentada.
  - **Selector de zona corporal nuevo** (`body-zone-picker.tsx`): silueta SVG genérica con puntos tocables por zona (`INTAKE_ZONES` sin cambios), reemplaza los chips de texto de antes. Zonas no representables de frente (Espalda, Glúteo) tienen un punto aproximado igual — es una silueta genérica, no anatómicamente literal.
  - **Tarjetas rediseñadas** (`visual-inputs.tsx`, `intake-chat.tsx`): `ColorCards` ahora es una lista apilada con swatch + subtítulo + check (igual al mockup "¿Cómo te lo imaginas?" — Black & Grey / A color / No estoy seguro, mismos valores `INTAKE_COLORS` enviados, solo cambia la etiqueta visible); `SizeCards` pasó de grid de 3 a 2 columnas para que el texto largo de cada tamaño no se apriete; `SkinSwatches` con bordes y tap-scale consistentes; `PhotoPicker` ahora es un grid de 2 columnas con tile de "Agregar más" en vez de fila horizontal; `StyleCards` (dentro de `intake-chat.tsx`) pasó de franjas anchas a lista con thumbnail + nombre + check, scrolleable internamente (10 estilos no calzan siempre en una pantalla chica).
  - **Resumen (`summary.tsx`) como dashboard**: filas con ícono + etiqueta + valor, tocables para editar ese paso directamente (nuevo prop `onEditStep`, opcional — usa el mismo `startEdit` de siempre). Overlay de envío con checklist animado (Analizando referencias / Estimando sesiones / Calculando tamaño / Preparando propuesta) en vez de un spinner genérico. La pantalla de éxito no incluye un "código de proyecto": el backend (`submitIntakeAction`) no genera ninguno, y no se fabricó uno falso solo para calzar con el mockup.
  - **Portada** (`intake-cover.tsx`): ahora es mitad foto / mitad tarjeta negra sólida (antes: foto a pantalla completa con degradado), más cercana al mockup.
  - `bubbles.tsx` (BotBubble/EditableUserBubble/TypingDots) quedó sin uso tras el rediseño — no se borró el archivo, pero ya no se importa desde ningún lado.
- Service worker a `ofink-v37`.

### Known Issues

- Seguimos sin poder correr `npm install` / `next build` / `eslint` en este entorno (sin red — `npm install --dry-run` devuelve 403 al intentar resolver el registry). La verificación de este rediseño fue manual: balance de llaves/paréntesis por archivo, chequeo cruzado de que ningún otro componente del proyecto importe las firmas que cambiaron (`IntakeSummary`, `visual-inputs.tsx`), y relectura completa de cada archivo tocado. No reemplaza un build real de Next — revisar en el próximo deploy de Vercel.
- El selector de zona corporal (`body-zone-picker.tsx`) es una silueta genérica, no un mapa anatómico real; "Espalda" y "Glúteo" se ubican de forma aproximada porque no son visibles desde una vista frontal simple.

## [0.75.0] - 2026-07-20

### Changed

- **Rediseño visual del bot de solicitudes** (`(bot)/t/[slug]`), basado en el mockup de referencia — CERO cambios de lógica: `flow.ts` (pasos, `nextStepId`, `applyEdit`), `submitIntakeAction`, validaciones, rutas y base de datos quedan intactos; el tap-to-edit del historial sigue funcionando igual.
  - **Portada emocional** (`intake-cover.tsx`, nuevo): foto del estudio a pantalla completa, nombre + "● En línea", "Gracias por interesarte en tatuarte conmigo", beneficios (2 minutos / información segura / cotización personalizada) y botón grande "Comenzar mi proyecto". Reemplaza el arranque directo en el chat (solo un estado `started` nuevo).
  - **Barra de progreso por fases** (`intake-progress.tsx`, nuevo): Idea → Tamaño → Ubicación → Estilo → Detalles → Listo, con íconos que se iluminan al avanzar. Las fases agrupan los StepId reales — solo presentación.
  - **Encabezados emocionales por paso** (`STEP_HEADERS`): el paso actual ya no es una burbuja de chat sino un título grande + subtexto persuasivo ("Todo comienza con una idea.", "¿Dónde quieres llevar tu historia?", "Inspírame.", "Cuéntame la historia.", etc.). El historial conserva sus burbujas y preguntas originales (`questionFor`) para que la edición no cambie.
  - **Estilo como tarjetas visuales** (`StyleCards` en `intake-chat.tsx`): franjas anchas con textura degradada propia por estilo en vez de chips. *No hay fotografías de estilos en los assets del proyecto — el visual es un degradado representativo; si consigues fotos por estilo, se cambian en `STYLE_VISUALS`.*
  - **Resumen con vista previa de la cotización** (`summary.tsx`): tarjeta "Así se verá tu cotización" (título del proyecto, zona · estilo, chip "Proyecto personalizado", "Valor · próximamente") antes de aceptar términos y enviar.
  - **Pantalla de envío**: overlay "Estamos preparando tu proyecto… Analizando cada detalle para crear la mejor propuesta posible." mientras corre el envío real; la confirmación "¡Solicitud enviada!" existente se mantiene.
  - El paso de tamaño con cuadrados verdes que pedía el mockup **ya existía** (`SizeCards`, v. anteriores) con las mismas 6 opciones — no hubo que agregarlo.
- Service worker a `ofink-v36`.

## [0.74.0] - 2026-07-20

### Changed

- **Landing de proyecto — tarjeta "Inversión del proyecto"**: se eliminó el botón "Reservar mi cita" (quedaba compitiendo con el "Reservar mi proyecto" del cierre, que sigue siendo el único CTA de reserva y lo último de la página). La tarjeta conserva el enlace "¿Tienes dudas? Escríbeme por WhatsApp".
- **Negociación de precio más emotiva** (`quote-negotiate-button.tsx`): el disparador ahora dice "¿Está fuera de tu presupuesto? Hazme una propuesta", con texto de acompañamiento "...la evaluamos juntos con nuestro equipo de trabajo"; el mensaje de WhatsApp generado pasa a "...quiero hacerte una propuesta: mi presupuesto es de {presupuesto}. Me encantaría que la pudieras evaluar con tu equipo de trabajo...".
- Service worker a `ofink-v35`.

## [0.73.1] - 2026-07-20

### Fixed

- **Build roto en Vercel**: `src/middleware.ts` (agregado en 0.72.0) chocaba con `src/proxy.ts`, que YA existía en el proyecto — Next.js 16 renombró la convención `middleware.ts`/`export middleware` a `proxy.ts`/`export proxy`, y no permite que coexistan los dos. El guard de sesión de 0.72.0 ahora vive en `proxy.ts` (reemplaza al stub "deja pasar todo, no hay login real" que ya estaba ahí); se eliminó `middleware.ts`.
- Service worker a `ofink-v34`.

## [0.73.0] - 2026-07-20

### Added

- **Flechas de navegación entre secciones** en la landing de proyecto (`/proyecto/[token]`): un tap hace scroll suave a la siguiente sección — nuevo `components/quote-landing/section-arrow.tsx`, integrado al final de cada sección (hero → carta → resumen → galería → proceso → inversión → incluye → tatuador → reserva).
- **Ajustes → Cotizaciones → "Carta y negociación"** (`/dashboard/settings/carta`, `quote-letter-form.tsx`): el tatuador personaliza la carta que ve el cliente en la landing (antes "Un mensaje para ti", ahora "Una carta para ti" — `quote-message.tsx`), con placeholder `{nombre_cliente}` y una plantilla por defecto (`DEFAULT_LETTER_MESSAGE`) si no la personaliza.
- **Negociación de precio** (mismo panel): checkbox "Permitir que el cliente proponga otro valor". Activado, la sección de inversión de la landing muestra un botón — el cliente escribe su presupuesto y se genera un mensaje de WhatsApp: *"Hola {tatuador}, estuve analizando tu cotización... no puedo llegar al {precio}... mi presupuesto es de {presupuesto}..."* (`quote-negotiate-button.tsx`). El botón "Reservar mi proyecto" del cierre sigue siendo siempre lo último de la página.
- **Copiar el link del bot desde el Centro de control**, sin entrar a Ajustes → Bot: nueva fila con botón de copiar en el módulo "Bot de solicitudes" (`copy-bot-link.tsx`).
- Nuevas columnas en `studios`: `quote_letter_message`, `quote_price_negotiable` (ver Migración).
- Service worker a `ofink-v33`.

### Migración requerida

Ya aplicada directamente en Supabase (`ofink-maqueta`) con el conector — dejo el SQL acá para que quede documentado:
```sql
alter table studios
  add column quote_letter_message text,
  add column quote_price_negotiable boolean not null default false;
```

## [0.72.0] - 2026-07-20

### Fixed

- **`/` entraba directo a `/dashboard` sin revisar sesión**: no existía `middleware.ts` en el proyecto — la raíz redirigía siempre a `/dashboard` (`src/app/page.tsx`), así que si el navegador tenía una cookie de sesión guardada (de una cuenta creada antes) entraba directo a ella, y sin sesión el dashboard igual se renderizaba en vez de pedir login. Nuevo `src/middleware.ts`: sin sesión válida → `/login`; con sesión válida → `/dashboard`. Solo corre sobre `/` y `/dashboard/**` — no toca rutas públicas.
- Service worker a `ofink-v32`.

## [0.71.0] - 2026-07-19

### Added

- **La cotización enviada por WhatsApp deja de ser una imagen: ahora es un link a una landing privada del proyecto** (`/proyecto/[token]`), premium e interactiva (hero a pantalla completa con la foto, carta del tatuador, resumen del proyecto, galería de referencias, timeline del proceso, inversión con botón "Reservar mi cita", qué incluye, quién hará el tatuaje y CTA final) — reemplaza el flujo de compartir/descargar la imagen en `send-quote-whatsapp.tsx`, que ahora solo genera el link y lo agrega al mensaje. El link expira a los **7 días**; pasada la expiración la página deja de servirse (`getPublicQuoteProject` la rechaza — no hay borrado físico ni cron, ver Known Issues). Reenviar por WhatsApp renueva la expiración conservando el mismo token.
  - Nuevas tablas/acciones: `quote_links` (token único por cotización), `createQuoteLinkAction` (`actions/quote-links.ts`), `getPublicQuoteProject` (`queries/quote-links.ts`, service-role, sin sesión).
  - Nuevas rutas: `(proyecto)/[token]` (la landing) y `api/quote-links/[token]/image` (imagen Open Graph — WhatsApp arma el preview del link solo, ya no hace falta compartir el archivo a mano).
  - Nuevos componentes en `components/quote-landing/`: `quote-hero`, `quote-message`, `quote-summary`, `quote-gallery`, `quote-process`, `quote-investment`, `quote-includes`, `quote-artist`, `quote-final-cta`, `reveal` (animaciones al hacer scroll con `motion/react`).
  - Toda la data viene de `buildQuoteTemplateData` (ya existente, usada también por la imagen OG) — no se duplicó ningún cálculo ni dato de la cotización. Se amplió su tipo de `studio` (`QuoteTemplateStudio`) para poder construirla también desde una consulta pública sin sesión.
  - Se extrajeron `safeImageUrl` y `renderPng` a helpers compartidos (`lib/pdf/safe-image-url.ts`, `lib/pdf/render-png.ts`) para no duplicarlos entre las dos rutas de imagen OG.
  - La sección "Opiniones de clientes" del mockup de referencia no se implementó: no existe una tabla de reseñas — se dejó fuera para no inventar contenido falso.
- Service worker a `ofink-v31`.

### Migración requerida

Correr en Supabase antes de desplegar:
```sql
create table quote_links (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references studios(id) on delete cascade,
  quote_id uuid not null unique references quotes(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index quote_links_token_idx on quote_links(token);

alter table quote_links enable row level security;

create policy "quote_links_studio_isolation" on quote_links
  for all using (
    studio_id in (select studio_id from artists where user_id = auth.uid())
  );
```
Nota: el token se lee siempre con el cliente admin (service-role), que ignora RLS — la policy de arriba solo protege el acceso autenticado del estudio (crear/renovar el link, listarlos, etc.).

## [0.70.0] - 2026-07-19

### Added

- **Color de acento seleccionable para la cotización** (Ajustes → Personalización → "Color de la cotización"): verde OFINK, blanco, azul o rojo. Cambia el título, la línea del hero, el badge de estado, "Valor total", todos los íconos y el QR de la imagen que se envía por WhatsApp — el fondo negro nunca cambia. Nuevo componente `template-color-picker.tsx`, nueva acción `updateQuoteTemplateColor` (`actions/studio.ts`) y campo `quote_template_color` en `studios` (ver migración abajo). `og-icons.tsx` (18 íconos) ahora recibe `color` como prop en vez de verde fijo; `quote-og-image.tsx`/`quote-og-image-fallback.tsx` y `qr.ts` usan el acento del estudio (`accentColorFor()` en `quote-template-data.ts`).
- Service worker a `ofink-v30`.

### Migración requerida

Correr en Supabase antes de desplegar:
```sql
alter table studios add column quote_template_color text;
```

## [0.69.0] - 2026-07-19

### Fixed

- **Ajustes: tarjetas Personalización/Cuenta se salían de la pantalla** (overflow horizontal, texto cortado en "OSCURO", "Formal", "Consentimientos", "Buscar actualizaciones"): las filas internas usan `flex-wrap`, pero al vivir dentro de una celda de grid sin `min-width: 0` el navegador dimensionaba la celda por el ancho SIN wrap de esos botones — clásico bug de CSS Grid/Flexbox. Se agregó `min-w-0` a las tarjetas del Centro de control.
- **Botón "Enviar por WhatsApp" no se veía verde OFINK**: usaba `variant="outline"`, cuyas clases `dark:bg-input/30` le ganaban en el tema oscuro al `bg-primary` pasado por className. Cambiado a `variant="default"`.
- **Popup de cotización: la X quedaba superpuesta al botón de eliminar** (ambas en la esquina superior derecha, una encima de la otra — la X por defecto del Dialog vs. el botón de eliminar de `quote-detail-content.tsx`). Se desactivó la X del Dialog (`showCloseButton={false}`) y se agregó una X propia junto al botón de eliminar, uno al lado del otro.

### Added

- **Deslizar hacia abajo para cerrar el popup de cotización**: agarradera arriba de la foto (`quote-detail-dialog.tsx`, con `motion/react`); arrastrarla más de ~100px o soltar con velocidad cierra el popup.
- **Ajustes: se quitó la flecha de las tarjetas de módulo** (Estudio, Cotizaciones, Clientes, Bot) — no llevaba a ningún destino adicional que sus filas de estado ya no cubrieran; cada fila ya es un Link directo a su subpágina.
- Service worker a `ofink-v29`.

## [0.68.0] - 2026-07-19

### Fixed

- **Popup "Estudio" tapando la pantalla al tocar la pestaña Ajustes**: la última pestaña de la barra móvil abría una hoja intermedia (accesos a Estadísticas/Clientes/Galería/Consentimientos/Ajustes + Cerrar sesión) en vez de llevar directo al Centro de control. Ahora la pestaña "Estudio" navega directo a `/dashboard/settings` — sin hoja, sin popup. La hoja y `BUSINESS_SHEET_ITEMS` se eliminaron (`mobile-nav.tsx`, `nav-items.tsx`). Estadísticas y Galería, que solo vivían en esa hoja, ahora tienen su fila dentro de Ajustes (módulos Estudio y Clientes) para no perder el acceso.
- Service worker a `ofink-v28`.

## [0.67.0] - 2026-07-20

### Fixed

- **"Guardar no hacía nada" en TODOS los formularios de Ajustes**: la barra Guardar (`SettingsSaveBar`) era `sticky bottom-0` y en el móvil quedaba exactamente DEBAJO de la barra de navegación fija (64px + safe-area) — el botón estaba tapado y los taps caían en la navegación. Ahora la barra se pega ENCIMA de la navegación (`bottom-[calc(64px+env(safe-area-inset-bottom))]`, `bottom-0` solo en desktop). Afectaba a perfil, horario, enlace, abono, pagos, precios, políticas, mensajes y artista.
- **Popup de cotización: el botón X quedaba bajo la isla dinámica**: el `DialogContent` medía `100vh-2rem` sin descontar los safe areas del iPhone. Ahora `100dvh` menos `safe-area-inset-top/bottom` — el contenido (y su X) queda siempre debajo de la isla.

### Added

- **Módulos de Ajustes desplegables** (`module-accordion.tsx`, nuevo): la flecha de cada tarjeta ya no navega — DESPLIEGA el módulo completo ahí mismo, con los formularios REALES de las subpáginas apilados (Estudio: perfil + horario + fechas especiales + enlace; Cotizaciones: abono + métodos de pago + precios preestablecidos + políticas; Clientes: mensajes; Bot: su tarjeta; Cuenta: perfil de artista). Cero duplicación: son exactamente los mismos componentes de formulario con los mismos datos, montados en "modo embebido" vía `EmbeddedSettingsProvider` (context en `settings-subpage.tsx`) que les quita el marco de subpágina (sin flecha de volver, título compacto, Guardar no-sticky). Las subpáginas siguen existiendo y las filas de estado siguen enlazando a ellas.
- **Botón "Bloquear un día en el calendario"** en el módulo Estudio → abre la agenda (`/dashboard?openCalendar=1`), donde ya existía el bloqueo de días; y el panel de Fechas especiales desplegado permite añadir días que no se trabaja sin salir de Ajustes.
- **Menú del pulpo configurable** (`lib/octopus-actions.ts` + `octopus-menu-settings.tsx`, nuevos): en Personalización, la gente elige qué acción muestra cada uno de los 4 brazos del pulpo al desplegarse — catálogo de 9 acciones (Clientes, Agenda, Rápida, Formal, Proyectos, Stats, Galería, Consentimientos, Ajustes), sin repetidas (asignar una ya usada las intercambia). La geometría de los tentáculos no cambia (cada brazo está resuelto a mano); solo cambia el destino/ícono/etiqueta del botón. La preferencia se guarda por dispositivo en localStorage (es preferencia de interfaz, no dato del estudio — sin migración de BD) y el menú la aplica al instante vía evento propio.
- Service worker a `ofink-v27`.

## [0.66.0] - 2026-07-20

### Changed

- **Ajustes rediseñado como "Centro de control del estudio"** (`studio-control-center.tsx`, nuevo; reemplaza a `settings-hub.tsx`, eliminado): deja de ser una lista de filas iguales y pasa a ser un panel donde el estado completo del estudio se entiende de un vistazo. CERO cambios de lógica, rutas, formularios o datos — cada elemento enlaza a las mismas subpáginas de siempre; solo cambió la presentación.
  - **Héroe**: tarjeta grande con logo/inicial del estudio, nombre en tipografía condensada, chip PRO, ciudad, link público `/t/slug` y un **anillo de progreso SVG** (hecho a mano, sin librerías) con el porcentaje de configuración. Debajo: "Tu estudio está listo" o "faltan N configuraciones". El % se calcula de datos reales (`computeStudioStatus`): perfil, horario, abono, pagos, políticas, precios, mensajes, WhatsApp y perfil de artista.
  - **Seis módulos-tarjeta** en grilla de 2 columnas (1 en móvil): Estudio, Cotizaciones, Clientes, Bot de solicitudes, Personalización y Cuenta. Cada uno con ícono grande, título condensado, y **filas de estado ✓/⚠ calculadas del estudio real** que se ven sin abrir ningún submenú (p. ej. "Abono 20%", "4 métodos", "Fechas especiales · Sin configurar") — y cada fila ES el link a su subpágina. Flecha discreta a la ruta principal del módulo.
  - **Personalización** como panel creativo: vista previa real del logo, el verde de marca y la tipografía, con el selector de tema embebido (chrome de `ThemeToggle` y `VersionInfo` adelgazado para anidar sin tarjeta-dentro-de-tarjeta).
  - **Cuenta** compacta: perfil de artista, "Acerca de OFINK" con buscar actualizaciones, y cerrar sesión.
  - El chip de "Fechas especiales" cuenta los días bloqueados de los próximos 12 meses (`getBlockedDayKeys`, query existente).
  - Sin PageHeader propio: el héroe es el encabezado. Jerarquía: héroe grande → módulos principales → personalización → cuenta.
- Service worker a `ofink-v26`.

## [0.65.0] - 2026-07-19

### Changed

- **Dieta de peso: `public/` pasó de 2.2 MB a 552 KB (−75%)** — el proyecto completo de 4.7 MB a 3.1 MB, y el zip de deploy queda a casi la mitad (menos fricción al subir con conexión móvil, y PWA más liviana de instalar):
  - Eliminados assets MUERTOS (cero referencias en el código): `app-icon.png` (1.2 MB — el más pesado de todo el proyecto y nadie lo usaba), `pulpo-rojo.png` (36 KB) y `logo-completo.png` (8 KB, solo se mencionaba en un comentario, ya actualizado).
  - Íconos PWA recomprimidos a paleta 256 (arte plano, calidad visual idéntica): `icon-512` 306→29 KB, `icon-512-maskable` 167→18 KB, `icon-192` 49→7 KB, `apple-touch-icon` 44→6 KB.
  - Pulpos (siluetas) re-guardados en modo gris+alfa: 32→22 KB y 33→24 KB **conservando los 256 niveles de alfa** — crítico porque `pulpo-negro.png` es la máscara CSS del logo y del splash; una cuantización agresiva banda los bordes (se probó, se detectó con `getextrema()` del canal alfa, y se rehízo desde el original).
  - JPGs de onboarding y `auth-bg` ya estaban óptimos — se dejaron igual.
  - Los tests (`*.test.ts`, 92 KB) se conservan: no pesan nada en la app desplegada (no van al bundle del cliente) y sí valen para el desarrollo.
- Service worker a `ofink-v25`.

## [0.64.0] - 2026-07-19

### Fixed

- **Swipe-to-delete: se sentía duro, "no desliza fácil"**: se mantiene el scroll horizontal nativo de 0.62 (el navegador sigue arbitrando horizontal vs. vertical, así que las filas no se abren solas al hacer scroll), pero se quitó `scroll-snap-mandatory` — con un recorrido de apenas 84px, el imán del snap en iOS exigía un latigazo decidido para empezar a revelar el botón. Ahora el dedo arrastra libre con fricción nativa y el componente asienta la fila al soltar: pasando apenas 28px de arrastre, se termina de abrir sola con animación suave (umbral simétrico para cerrar). El asentamiento espera a que el dedo se levante y a que pare la inercia — nunca pelea contra el gesto en curso. Service worker a `ofink-v24`.

### Added

- **Progreso del proyecto editable** (`project-progress-editor.tsx`, nuevo): en la página de detalle del proyecto, la tarjeta "Progreso del proyecto" ahora tiene lápiz de edición (mismo patrón que el valor del proyecto): un slider 0–100 en pasos de 5 mueve la barra en vivo, Guardar escribe `manual_progress` (la acción y la columna ya existían), y el botón "Automático" lo borra para volver al cálculo por sesiones completadas de siempre. Cuando hay un porcentaje manual activo se indica con "· manual" junto al título. La tarjeta ahora aparece aunque el proyecto no tenga sesiones todavía (antes solo salía con `total > 0`), para poder fijarle progreso a cualquier proyecto. `updateProjectProgressAction` acepta `null` para el reset.

## [0.63.0] - 2026-07-19

### Added

- **Versión visible en el splash**: debajo del pulpo de la animación de apertura ahora aparece `v0.63.0` (la versión del build que está corriendo en ese momento). Con PWA + service worker el teléfono puede quedarse sirviendo un build viejo aunque el deploy haya salido bien — este número lo delata al instante, sin entrar a Ajustes. Service worker a `ofink-v23`.

## [0.62.0] - 2026-07-19

### Fixed

- **Swipe-to-delete de cotizaciones — reescrito de raíz con scroll nativo (tercera y definitiva)**: las dos implementaciones anteriores (pointer events con matemática de deltas, luego con bloqueo de eje) peleaban contra el scroll táctil de iOS Safari — el navegador dispara `pointercancel` a mitad de arrastre cuando decide que el gesto es scroll (dejando filas a medio abrir o abiertas sin querer), y el bloqueo de eje clasificaba mal los deslizamientos en arco del pulgar (de ahí los dos síntomas reportados: filas que quedaban mostrando "Eliminar" tras hacer scroll, Y deslizamientos legítimos donde "Eliminar" no aparecía). Ahora el carril es un contenedor con **scroll horizontal nativo + scroll-snap**: deslizar es literalmente hacer scroll, y es el motor del navegador (el mismo de las listas reales de iOS) quien arbitra si el dedo va en horizontal o vertical — perfecto por definición. `snap-mandatory` garantiza que la fila siempre repose totalmente cerrada o totalmente abierta, nunca a medias; cero JavaScript durante el gesto. Mismo API (`SwipeToDeleteRow`/`SwipeToDeleteGroup`), tap con la fila abierta la cierra (como iOS), scroll de página cierra la abierta, solo una abierta a la vez.
- Service worker a `ofink-v22` para forzar el build nuevo en dispositivos.

## [0.61.0] - 2026-07-19

### Fixed

- **Swipe-to-delete que "se quedaba pegado" (segundo intento) — dos causas más**: (1) hacer scroll de la página ahora cierra la fila abierta (mismo comportamiento de Mail de iOS), así ninguna queda revelando "Eliminar" mientras se navega la lista; (2) MUY IMPORTANTE: el service worker seguía sirviendo la versión anterior de la app desde caché (`CACHE` seguía en `ofink-v20`) — el fix de 0.60.0 posiblemente ni siquiera llegó al celular. Se subió a `ofink-v21`; tras desplegar, cerrar la app del todo y abrirla de nuevo (o Ajustes → Buscar actualizaciones) fuerza el build nuevo.

### Changed

- **Optimización de carga — fotos en miniatura, no originales** (`remote-photo.tsx`, nuevo): la causa principal de la lentitud general — las tarjetas de cotizaciones/proyectos/próxima sesión descargaban la foto ORIGINAL subida desde el celular (2–8 MB cada una; una lista podía pesar decenas de MB). Ahora piden la miniatura del CDN de transformación de Supabase (`/render/image/public/...?width&quality`, 50–150 KB) con fallback automático al original si el proyecto no tiene transformaciones habilitadas (`onError` una sola vez — no puede romper nada). Todas las fotos remotas quedaron además con `loading="lazy"` + `decoding="async"`: las que están fuera de pantalla no se descargan hasta acercarse.
- **Optimización de animaciones/efectos**: se retiraron los efectos más caros de GPU en móvil — `backdrop-blur` en chips de tarjetas, badges y overlays repetidos por ítem (reemplazado por fondos sólidos `bg-black/70`–`/90`, visualmente casi idéntico sobre foto), el `backdrop-blur-lg` a pantalla completa del menú pulpo (ahora `bg-black/80` — ese blur animándose era de lo más pesado de toda la app), los zoom por hover en fotos con filtro (`group-hover:scale` + `transition-transform duration-500`, capa GPU permanente por tarjeta) y los sticky headers/footers translúcidos con blur (wizard, onboarding, chat del bot — ahora fondo opaco, sin repintado en cada scroll). Se conservan el blur sutil de los overlays de diálogo (un solo elemento) y todas las transiciones baratas de color/opacidad.
- **Cache inmutable para `/brand` y `/icons`** (next.config): un año, `immutable` — el logo y el splash no se re-descargan en cada apertura.

### Added

- **Animación de apertura (splash)** (`splash-screen.tsx`, nuevo + keyframes en globals.css): al abrir la app aparece el isotipo del pulpo en verde de marca sobre fondo negro con un giro de entrada profesional (rotación −180° + escala con leve rebote y pulso de brillo) y fade de salida. Costo de carga casi nulo: CSS puro sobre `transform`/`opacity`/`filter` (compuestos en GPU), cero librerías, cero assets nuevos — es la misma silueta `pulpo-negro.png` pintada con máscara CSS que ya usa el logo, y con el cache inmutable nuevo ni siquiera se re-descarga. Se muestra una vez por sesión (cada apertura en frío de la PWA la reproduce; navegar dentro no). Respeta `prefers-reduced-motion` (fade simple).
- **Login minimalista**: la pantalla de login ahora muestra un solo logo de OFINK (antes la marca salía duplicada — el logo+tagline del layout de auth Y otro logo+descripción dentro de la propia página). Se quitó el bloque duplicado y el tagline; queda el logo completo, más grande, y el formulario.

## [0.60.0] - 2026-07-19

### Fixed

- **Swipe-to-delete de cotizaciones — se quedaba abierto en varias tarjetas al hacer scroll**: el gesto (`swipe-to-delete-row.tsx`) movía `translateX` con solo mirar el delta horizontal del dedo, sin compararlo contra el vertical — así que desplazarse por la lista (que casi nunca es un arrastre perfectamente vertical) alcanzaba a revelar el botón rojo de "Eliminar" en varias tarjetas de golpe, atascadas así hasta tocarlas de nuevo. Ahora el gesto no decide su eje hasta pasar un umbral de movimiento: si domina el vertical se trata como scroll (se suelta el pointer capture, no se toca `translateX`, el scroll nativo de la lista sigue intacto); solo si domina el horizontal se activa el swipe.
  - `SwipeToDeleteGroup` (nuevo, opcional): envuelve la lista para que abrir una fila cierre cualquier otra que hubiera quedado abierta — mismo comportamiento de Mail/Recordatorios de iOS. `quotes-list.tsx` ya lo usa.

### Added

- **Mantener presionada una cita en el calendario (vista Día) — editar o eliminar**: antes tocar una cita solo llevaba al proyecto; ahora un tap corto sigue haciendo eso, y mantener presionado ~450ms abre `SessionActionsDialog` (nuevo) con "Reagendar" (reutiliza `RescheduleSessionForm`, ya existente) o "Eliminar cita" (con confirmación explícita, `deleteSessionAction`). Si el dedo se mueve más de 10px durante la pulsación se cancela — no interfiere con hacer scroll de la vista Día. `CalendarNav` gana el prop opcional `onLongPressSession`; sin pasarlo, el comportamiento es igual que antes.

## [0.59.0] - 2026-07-19

### Removed

- **Calendario de página completa (`/dashboard/calendar`), eliminado** — a pedido explícito ("un mismo calendario en toda la app"). Se borraron `calendar-view.tsx`, `create-session-dialog.tsx` y `session-form.tsx` (sin más usos tras quitar la página). El popup de Inicio (`HomeCalendarDialog`) ya usaba el mismo `CalendarNav` que esa página, así que sigue siendo — ahora en solitario — el único punto de acceso al calendario/agendamiento de toda la app.
  - Todo enlace que antes apuntaba a `/dashboard/calendar` ("Ver todo", "Ver agenda", el tentáculo "Agenda" del menú pulpo) ahora apunta a `/dashboard?openCalendar=1`: `calendar-card.tsx` detecta ese query param al montar y abre el popup solo, en vista Mes.
  - `HomeCalendarDialog` gana un `initialView` opcional (antes siempre arrancaba en "Día").

### Added

- **Estadísticas**, nueva sección en el menú de Estudio en el lugar donde vivía Calendario: `/dashboard/stats`, informe general del mes con gráficas — reutiliza `MonthSummary` (sesiones programadas, ingresos proyectados, ocupación, por cobrar) y suma cotizaciones del mes (total, por estado, valor cotizado) con `MiniBarChart` (nuevo, barras hechas a mano con divs — mismo criterio del proyecto de no sumar dependencias nuevas) mostrando cotizaciones y citas agendadas por día.
- **Swipe-to-delete en cotizaciones, estilo iPhone** (`swipe-to-delete-row.tsx`, nuevo): deslizar una tarjeta de derecha a izquierda revela un botón rojo de eliminar; tocarlo borra directo, sin un segundo diálogo — el gesto de deslizar ya es la confirmación, igual que Mail/Recordatorios de iOS. Un tap sin arrastre no interfiere con abrir el detalle de la cotización.
- **Editar valor del proyecto**: nuevo `project-value-editor.tsx` (mismo patrón que el editor de sesiones/abono ya existente) + `updateProjectValueAction`, en la página de detalle del proyecto.

### Changed

- **Agendar cita directa desde el calendario — cliente y proyecto explícitos** (`quick-schedule-dialog.tsx`): ya creaba cliente nuevo y un proyecto "Cita rápida" automáticamente si hacía falta, pero en silencio. Ahora lo dice ("No encontramos ese teléfono — se creará un cliente nuevo.") y deja nombrar el proyecto nuevo en vez de imponer siempre "Cita rápida".

## [0.58.0] - 2026-07-19

### Fixed

- **Imagen de cotización — el fix anterior no atrapaba el error real**: `new ImageResponse(...)` no lanza el fallo de render de forma síncrona — arma un stream y lo va llenando después, así que el try/catch alrededor del constructor (agregado en 0.57.0) nunca llegaba a atraparlo; por eso seguía sin salir la imagen. Ahora se fuerza `.arrayBuffer()` sobre el resultado, lo que obliga a esperar el render completo y sí deja capturar el error de verdad.
  - `lib/pdf/quote-og-image-fallback.tsx` (nuevo): si aun así la plantilla premium falla, se genera una imagen de respaldo mínima — sin fotos remotas, íconos SVG ni degradados, solo texto plano sobre fondo sólido (nombre, precio, abono, sesiones, WhatsApp). La persona siempre recibe una imagen para enviar, aunque sea la simple.

### Changed

- **Cotización rápida — "Agendar sesión(es)" en vez de "Calendario"**: el botón que aparece tras crear el proyecto ya no abre el calendario general. Ahora dice "Agendar sesión" (si la cotización tiene 1 sesión) o "Agendar sesiones" (si tiene más), y abre `schedule-sessions-dialog.tsx` (nuevo): un paso por sesión, cada uno con su propia fecha y hora (`DateTimePicker`, ya existente) y una duración compartida para todas (`DurationDial`, ya existente). Al agendar la última, crea las sesiones en orden; si una falla (día bloqueado, choque de horario) se detiene ahí sin perder las que ya quedaron creadas.

## [0.57.0] - 2026-07-19

### Fixed

- **Imagen de cotización por WhatsApp no se generaba** (`api/quotes/[id]/image`): Satori (`next/og`) revienta la generación COMPLETA si una sola imagen remota falla (URL rota, timeout, bucket lento) — no la salta, tumba toda la imagen. Se agregó `safeImageUrl()`: valida con `HEAD` cada imagen (foto principal, referencias, logo del estudio) antes de renderizar; la que falla se descarta en silencio en vez de romper la cotización entera. Se agregó también `maxDuration = 30` (varias imágenes remotas podían superar el límite por defecto) y un try/catch con log alrededor del render. De paso, corregido un divisor visual que quedaba huérfano en cotizaciones de cortesía.
- **Header de "Cotización rápida" sin espacio para dispositivos con isla/notch**: le faltaba `env(safe-area-inset-top)` (a diferencia del resto de pantallas full-bleed de la app, como `onboarding/step-shell.tsx`, que sí lo reservan). Agregado.

### Changed

- **Cotización rápida — cliente nuevo o existente** (`quick-quote-form.tsx`): en vez de pedir nombre y teléfono directo, ahora primero pregunta si el cliente es nuevo o ya existe.
  - "Cliente existente": solo pide el teléfono; al salir del campo busca por los últimos 10 dígitos (`findClientProjectsByPhoneAction`, la misma búsqueda que ya usa el popup de "Agendar cita" del calendario — no se duplicó lógica) y autocompleta el nombre. Si no lo encuentra, ofrece un atajo directo a "Crear como cliente nuevo" conservando el teléfono ya escrito.
  - "Cliente nuevo": mismo formulario de siempre (nombre + teléfono).
  - Al confirmar la cotización, si el cliente es existente reutiliza su `clientId` en vez de crear un duplicado.
- **"Información del bot" — nueva interfaz, transcripción real de la conversación** (`bot-intake-summary.tsx`, nuevo componente): reemplaza el checklist genérico anterior ("Seleccionó estilo: X", "Zona: X") y la tarjeta duplicada "Lo que quiere" por una transcripción tipo chat con la MISMA pregunta que el bot le hizo al cliente (importada de `intake/copy.ts`, única fuente de verdad — si el texto del bot cambia, esto cambia solo) emparejada con la respuesta real, en el mismo orden del flujo (`intake/flow.ts`): nombre, servicio, tamaño, zona, color, tono de piel, estilo, fotos, descripción, contacto, disponibilidad. Un campo sin valor simplemente no aparece, nada inventado.
  - Se agregó `email` a `QuoteWithClient` (antes solo traía nombre y teléfono del cliente) para poder mostrar el contacto completo, tal cual lo pide el bot ("Déjame tu contacto…").

## [0.56.0] - 2026-07-19

### Changed

- **Imagen de cotización — rediseño premium + theming por estilo** (`lib/pdf/quote-og-image.tsx`): hero más grande (560px) con watermark del estilo integrado a la foto, resumen económico como bloque único (antes tarjetas separadas), grid de detalles completo (zona/estilo/tamaño/color/piel/servicio/disponibilidad), tarjeta "Tu experiencia incluye" de vuelta, galería real de hasta 4 referencias + "+N", cierre emocional ("Cada tatuaje comienza con una historia…") en vez del pie genérico anterior.
  - `lib/pdf/style-theme.ts` (nuevo): un único sistema de theming — `getStyleTheme(d.style)` ajusta opacidad del watermark, fuerza del degradado del hero, tracking del nombre y aire entre secciones según palabras clave del estilo (realismo, blackwork, línea fina, japonés, microrrealismo). No son cinco componentes ni cinco plantillas: es la misma plantilla leyendo distintos parámetros.
  - `lib/pdf/og-icons.tsx`: se agregaron los íconos de piel/servicio/disponibilidad/check que faltaban para el grid completo.
  - Canvas subido a 1080×2480 para que entre el contenido nuevo sin recortarse en el caso más completo (descripción larga + 7 detalles + políticas + galería). Es un lienzo de tamaño fijo (`next/og` no pagina como sí hacía `react-pdf`): una cotización con muy poco contenido deja espacio en negro al final (mismo color de fondo, no se nota como "hueco"); una con texto excepcionalmente largo en descripción o políticas podría, en el límite, recortarse — avisar si se ve un caso así para ajustar el alto.

### Removed

- **PDF de cotización, eliminado por completo** — a pedido explícito, la única pieza que se genera ahora es la imagen para WhatsApp. Se quitó el botón "Descargar PDF" de los tres lugares donde vivía (detalle de cotización, formulario rápido, resumen del wizard) y se borraron los archivos que ya no tenía sentido mantener: `api/quotes/[id]/pdf/route.tsx`, `components/quotes/download-quote-pdf.tsx`, `lib/pdf/quote-pdf.tsx`, `lib/pdf/icons.tsx` (el set de íconos de `@react-pdf/renderer`, reemplazado por `og-icons.tsx`). No se tocó `lib/pdf/consent-pdf.tsx` ni la ruta de PDF de consentimientos — es un documento distinto, sin relación con cotizaciones.

## [0.55.0] - 2026-07-19

### Changed

- **Imagen de cotización para WhatsApp — rediseño completo** (`lib/pdf/quote-og-image.tsx`), siguiendo referencia visual del cliente. Deja de ser un póster 9:16 tipo "historia" y pasa a ser el documento completo (antes solo vivía en el PDF): encabezado con logo/código/estado, hero con foto + degradado + nombre + estilo gigante de fondo, resumen económico (precio/abono/sesión estimada), sesiones, descripción, grid de detalles (zona/estilo/tamaño/color), políticas + galería de referencias lado a lado, footer con frase de marca + contacto + marca OFINK, pie con vigencia y fecha. Sigue consumiendo `buildQuoteTemplateData()` tal cual, sin fetch nuevo ni duplicar lógica.
  - `lib/pdf/og-icons.tsx` (nuevo): set de íconos SVG plano (zona, estilo, tamaño, color, sesiones, reloj, galería, escudo, descripción, WhatsApp/Instagram/TikTok/Facebook/web) — `next/og` (Satori) no entiende los componentes `<Svg>/<Path>` de `@react-pdf/renderer` que ya existían en `icons.tsx`, es un motor de layout distinto.
  - `api/quotes/[id]/image`: ahora pasa `platformMarkUrl` (mismo patrón que ya usaba el PDF) y genera a 1080×1720 (formato documento) en vez de 1080×1920 (formato historia).
  - Se evaluó un sistema de "una plantilla HTML → PDF + imagen" con navegador headless (Puppeteer/Playwright), pero se descartó: en Vercel serverless implica cargar Chromium en cada función (cold starts más lentos, función más pesada, más puntos de falla) sin necesidad real, ya que el pedido final fue generar solo la imagen. Se mantiene el sistema actual (`@react-pdf/renderer` para el PDF de descarga, `next/og` para esta imagen), sin dependencias nuevas.
  - A propósito sin fuente condensada externa (Anton) para el nombre del cliente: mismo criterio que ya usa `quote-pdf.tsx`, no descargar una fuente en el momento de generar el documento. El look pesado se logra con `fontWeight: 800` + `letterSpacing` negativo.
  - El logo de marca del footer reutiliza `pulpo-blanco.png` (mismo asset que el PDF), no una versión verde como la de la referencia — no existe ese asset ya coloreado sin la máscara CSS que usa `Logo` en la app, y Satori no soporta `mask-image`.
  - El PDF de descarga (`quote-pdf.tsx`, botón "PDF") no se tocó — sigue aparte, sin cambios.

## [0.54.1] - 2026-07-18

### Fixed

- **`SendQuoteWhatsapp` — la imagen ya no se quedaba sin entregar en desktop**: antes, sin soporte de Web Share (la mayoría de navegadores de escritorio), el botón solo abría WhatsApp con el texto y la imagen no se generaba ni entregaba de ninguna forma. Ahora, cuando no hay soporte de compartir archivos, la imagen se DESCARGA directo (mismo mecanismo que el botón de PDF) a la vez que se abre WhatsApp Web con el texto — el archivo para WhatsApp siempre queda disponible, por share nativo o por descarga.
- Fallos reales (red, generación de la imagen) ahora muestran un toast y igual dejan abierto WhatsApp con el texto, en vez de fallar en silencio.

Confirmado el resto sin cambios: "Enviar por WhatsApp" siempre usa la imagen vertical; "PDF" sigue aparte, siempre visible, para descargar el documento.

## [0.54.0] - 2026-07-18

### Changed

- **Plantilla premium de cotización — PDF + imagen WhatsApp**, reemplaza el PDF de texto plano anterior. Fondo negro `#090909`, verde OFINK `#C8FF1A` de acento, tipografía condensada simulada (Helvetica-Bold + tracking, ver nota de fuentes abajo).
  - `lib/pdf/quote-template-data.ts` (nuevo): TODA la lógica de datos en un solo lugar — consume el `Quote`/`studio` ya cargados (sin fetch nuevo), deriva precio, abono, código, fecha, tags, políticas, etc. Lo consumen el PDF y la imagen; ninguno vuelve a calcular nada.
  - `lib/pdf/quote-pdf.tsx` (reescrito): hero de foto con degradado + estilo gigante de fondo (8-12% opacidad) + nombre condensado, resumen económico destacado, descripción, grid de detalles con íconos propios (`lib/pdf/icons.tsx`, dibujados a mano, sin depender de un set de íconos externo), "Tu experiencia incluye", políticas + galería de referencias con "+N", footer con QR (WhatsApp del estudio) y contacto.
  - `lib/pdf/quote-og-image.tsx` + `/api/quotes/[id]/image` (nuevos): imagen vertical 1080×1920 para WhatsApp — composición propia (no el PDF estirado), pensada para verse como miniatura en un chat antes de abrirla. Usa `next/og` (`ImageResponse`, ya incluido en Next.js, cero dependencias nuevas) — es un motor de render distinto a react-pdf, por eso es un archivo separado aunque comparta el mismo `quote-template-data.ts`.
  - `lib/pdf/qr.ts` (nuevo): QR generado localmente (paquete `qrcode`, única dependencia nueva) sin llamar a ningún servicio externo en el momento de generar el documento — apunta al WhatsApp del estudio.
  - `send-quote-whatsapp.tsx`: el share nativo (Web Share API) ahora adjunta la IMAGEN vertical en vez del PDF — se ve como foto en el chat, no como ícono de documento.

### Known / decisiones tomadas

- El brief pedía "PDF horizontal A4" pero la referencia visual entregada es vertical — se construyó vertical (siguiendo la imagen, evidencia más concreta). Es un solo cambio (`orientation="landscape"`) si en realidad se buscaba horizontal.
- No existe un campo "código de cotización" en la base de datos: se deriva del `id` real (`OFK-{primeros 8 caracteres}`), no es un consecutivo real.
- No existe "nivel de detalle": se reemplazó por `Servicio` y `Disponibilidad` (datos reales que no se estaban mostrando).
- "Tu experiencia incluye" es copy fijo de marca (`EXPERIENCE_INCLUDES` en `quote-template-data.ts`) — no depende de datos de la cotización, editable ahí.
- No se registró ninguna fuente externa (ni Google Fonts para el look condensado, ni un servicio de QR de terceros) — mismo criterio que la entrega anterior del PDF: evitar que una descarga en el momento de generar el documento pueda romperlo.
- "Este presupuesto es válido por 7 días" se dejó como aviso genérico sin el número de días — no existe un sistema real de vigencia/expiración de cotizaciones en la app.

## [0.53.0] - 2026-07-18

### Added

- **Enviar cotización por WhatsApp con el PDF adjunto** (`send-quote-whatsapp.tsx`). Límite real de la plataforma: un enlace `wa.me` (WhatsApp Click-to-Chat) solo admite texto prellenado — WhatsApp no tiene forma de adjuntar un archivo por URL; eso solo lo permite la API de WhatsApp Business (de pago, con verificación de Meta). Mejor alternativa real disponible: Web Share API con archivos.
  - En dispositivos que la soportan (la mayoría de celulares, incluida esta PWA instalada): un tap genera el PDF y abre el panel nativo de compartir del sistema con el PDF ya adjunto + el mensaje — WhatsApp aparece como una de las opciones.
  - En desktop (sin soporte de compartir archivos): cae automáticamente al comportamiento de siempre, solo con el texto.
  - Si la persona cierra el panel de compartir sin elegir nada (`AbortError`), no pasa nada — no cae al link de texto como si hubiera fallado.

## [0.52.0] - 2026-07-18

### Changed

- **PDF de cotización — diseño de marca** (`lib/pdf/quote-pdf.tsx`): antes texto plano en blanco y negro. Ahora:
  - Encabezado con el logo del estudio (nuevo prop `studioLogoUrl`, ya existía en `getCurrentStudio()` pero no se pasaba al PDF) y franja verde de marca.
  - Panel de precio destacado (caja con borde verde, el número más grande de la página) + abono al lado.
  - Sesiones y duración como tarjetas pequeñas en fila.
  - Políticas y reglas con bullets de punto verde (dibujado con `<Svg>/<Circle>`, sin dependencias de íconos) — mismo lenguaje visual de "punto + texto" que ya usan los chips de estado en la app.
  - Pie de página fijo con contacto del estudio.
  - A propósito NO se registró la fuente Anton (la condensada de la app) vía Google Fonts: `Font.register` en `@react-pdf/renderer` la descarga en el momento de generar el PDF — si esa descarga falla en producción, se cae la descarga completa. El look condensado se logra con Helvetica-Bold + tracking amplio, sin ese riesgo. El verde también se oscureció (`#8FB800` en vez del `#B8F400` de la app) porque el verde puro de marca pierde casi todo el contraste como texto/borde sobre papel blanco.

## [0.51.0] - 2026-07-18

### Changed

- **Detalle de cotización — ahora abre en popup**, con el diseño de la referencia del cliente ("LEO — REALISMO"). Mismo patrón ya usado en Proyectos (`project-detail-dialog.tsx`): la lista es cliente (`quotes-list.tsx`), guarda `selected` en estado y monta `quote-detail-dialog.tsx`. Las tarjetas de la lista dejaron de navegar a una URL.
  - `quote-detail-content.tsx` (nuevo): hero con la foto de referencia + nombre y estilo enormes + estado, botón grande de WhatsApp, fila de PDF/Editar/Convertir, tarjeta "Resumen" (precio, abono, sesiones, duración), tarjeta "Información del bot" (checklist de lo que compartió el cliente — solo el primer paso usa timestamp real de `created_at`; no se inventó hora para los demás, no existe ese dato) y tarjeta "Lo que quiere" (descripción + tags: estilo, zona, tamaño, servicio, color, tono de piel, disponibilidad — los mismos campos que ya mostraba la versión anterior, ninguno se perdió).
  - Mismo componente se usa en el popup Y en la página standalone `quotes/[id]` (se conserva como ruta real: el wizard de creación enlaza ahí al terminar, y las acciones de mutación revalidan esa ruta).
  - `getQuotes()` ahora trae también el teléfono del cliente (antes solo `getQuote` individual lo traía) — necesario para el botón de WhatsApp del popup sin un fetch adicional al abrir cada cotización.
  - `SendQuoteWhatsapp`, `DownloadQuotePdf`, `EditQuoteButton`, `ConvertQuoteButton`, `DeleteQuoteButton`: se les agregó `className` opcional (y `label`/`iconOnly` donde aplicaba) para el nuevo diseño compacto — su lógica interna no cambió. Se agregaron además `onDeleted`/`onConverted` opcionales para que el popup se cierre solo si se elimina o convierte una cotización desde ahí (si no, el `router.push` a la misma ruta no cerraba el diálogo).

## [0.50.0] - 2026-07-18

### Added

- **Tema Claro/Oscuro** — toggle nuevo en Ajustes → Apariencia. La app forzaba `.dark` a mano en `layout.tsx`; el tema claro (`:root` en `globals.css`) ya estaba completo y sincronizado ("se mantiene por si se activa en el futuro" decía el comentario) pero nunca se activaba.
  - `next-themes` ya era una dependencia — la usaba `sonner.tsx` (`useTheme()`) sin que existiera ningún `<ThemeProvider>` montado; los toasts corrían con el tema sin resolver. Se agregó `theme-provider.tsx` (wrapper cliente) envolviendo `<body>`, `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}` (el toggle es manual, no sigue el sistema). Persistencia automática (localStorage) y sin parpadeo en la carga.
  - `theme-toggle.tsx`: selector Oscuro/Claro en Ajustes, sincroniza además el `theme-color` del navegador/PWA con el tema elegido.
  - `<Toaster/>` se movió dentro de `<ThemeProvider>` (antes quedaba fuera, por lo que `useTheme()` nunca tenía contexto).

### Fixed

- `mobile-nav.tsx`: la barra inferior usaba colores fijos (`#080808`, `#1c1c1c`) en vez de tokens de tema — se veía negra sin importar el tema. Ahora usa `bg-background`/`border-border`.
- `quotes/page.tsx`: el glow verde de las tarjetas (`var(--primary-glow)`) no tenía valor de respaldo — `--primary-glow` solo está definido en `.dark`, así que en tema claro el glow se rompía. Agregado el mismo fallback que ya usa el resto de `globals.css`.

### Known

Estas superficies quedan con tratamiento oscuro fijo A PROPÓSITO, sin adaptarse al tema claro por ahora (son overlays sobre foto/vidrio, no leen fondo de página): las tarjetas de cotización (fondo siempre foto + overlay negro), los chips de origen/estado sobre ellas, el núcleo del `OctopusMenu`, y los diálogos/pasos del wizard de cotización. Si se quiere que también cambien con el tema, es un ajuste puntual por archivo — avisar cuáles.

## [0.49.1] - 2026-07-18

### Fixed

- **Tarjetas de cotización — desbordamiento horizontal ("grid blowout")** (`quotes/page.tsx`): una palabra larga sin espacios en el estilo del tatuaje (p.ej. "BLACKWORK") forzaba, por el `min-width:auto` implícito de CSS grid/flex, el ancho de toda la tarjeta más allá de la pantalla — eso empujaba el chip de estado (derecha) fuera de la vista y cortaba el texto gigante de fondo en el borde real de la pantalla en vez de en el borde de la tarjeta. Fix: `min-w-0` en la celda del grid y en la tarjeta, más `truncate`/`max-w-full` en el texto de fondo.
- **Posible asome de contenido bajo la barra de estado durante el rebote elástico** (`globals.css`): agregado `overscroll-behavior-y: contain` en `body` — el padding de safe-area de cada layout ya reservaba el espacio correcto, esto evita que el bounce de iOS lo desplace momentáneamente al hacer scroll-to-top.

## [0.49.0] - 2026-07-18

### Changed

- **Tarjetas de cotización — rediseño premium editorial** (`quotes/page.tsx`, `bot-badge.tsx`): mismo lenguaje visual en las 4 pantallas de referencia del cliente ("LEO / REALISMO"). Solo visual — `getQuotes`, `getClients`, `getCurrentStudio` y todos los campos (`status`, `source`, `style`, `description`, `body_zone`, `created_at`) sin tocar.
  - Fondo: `reference_photo_path` resuelto a URL pública del bucket `quote-photos` (mismo patrón que el detalle de cotización), `object-cover`, overlay negro ~65%. Alternancia automática verde OFINK / blanco y negro por posición (par = verde, impar = B&N) — nunca dos verdes seguidas. Sin foto: degradé oscuro de respaldo.
  - Nombre del cliente en `font-title` (Anton, ya configurada en `layout.tsx` como `--font-title` — es la condensada pedida), enorme, blanco, sin sombra.
  - Estilo del tatuaje como recurso gráfico gigante detrás del nombre, opacidad 13%, mezclado con la foto.
  - Info: "Hace X días • hora" + "estilo • idea • zona" separados por punto.
  - Chip de origen: `BotBadge` ahora cubre AMBOS estados ("Desde bot" / "Creada por mí" con ícono `PenLine`) — antes las cotizaciones manuales no mostraban ningún chip.
  - Chip de estado: mismo sistema de color que `<StatusBadge/>` (`STATUS_CONFIG`/`DOT`, ahora exportados de forma aditiva desde `status-badge.tsx` — el componente compartido no cambió, sigue igual en Proyectos/Sesiones/Clientes) en un chip de vidrio oscuro sobre la foto.
  - Botón circular negro translúcido, centrado verticalmente, con `ChevronRight` (mismo ícono que usan las tarjetas de sesiones/galería).
  - Borde hairline oscuro siempre; glow verde (`--primary-glow`) solo en las tarjetas verdes.
  - Hover: zoom leve de la imagen (`scale-[1.04]`), overlay se aclara un poco, botón y flecha crecen levemente. Transiciones 300–500ms, sin efectos exagerados.

## [0.48.0] - 2026-07-18

### Removed

Limpieza de código muerto: análisis de alcanzabilidad completo (grafo de imports desde cada `page.tsx`/`layout.tsx`/`route.ts` de `src/app`) + verificación cruzada por grep exacto de ruta de import para evitar falsos positivos por nombres genéricos. 17 archivos sin ninguna referencia real, 264 → 247 archivos en `src/`:

- `actions/consents.ts`, `validations/consents.ts`, `components/consents/{consent-form,consent-links-panel,download-consent-pdf}.tsx` — versión vieja del formulario de consentimiento, reemplazada por `public-consent-form.tsx` + `actions/consent-links.ts` (la página `/dashboard/consents` ya usaba `queries/consents.ts` directamente, sin pasar por estos).
- `components/gallery/gallery-grid.tsx` — reemplazado por `gallery-card.tsx` + `gallery-upload.tsx`.
- `components/home/sparkline.tsx`, `components/projects/{collapsible-section,project-pipeline,status-select}.tsx`, `components/sessions/session-list.tsx` — componentes huérfanos de refactors anteriores, sin ningún import.
- `components/ui/avatar.tsx`, `components/ui/separator.tsx` — primitivas shadcn nunca conectadas (la app usa `<img>` plano para avatares y separadores inline propios en `dropdown-menu.tsx`/`select.tsx`).
- `lib/mock/client.ts`, `lib/mock/data.ts` — cliente y datos Supabase FALSOS de una fase anterior de la maqueta; `lib/supabase/server.ts` ya usa el cliente real (`@supabase/ssr`) en toda la app.
- `lib/supabase/client.ts` — cliente Supabase de navegador, nunca importado por ningún componente `'use client'`.
- `lib/types/app.types.ts` — archivo vacío (`export type {}`).

Verificado: ningún test (`*.test.ts`) dependía de estos archivos; ningún paquete de `package.json` quedó sin uso (los 3 candidatos iniciales eran falsos positivos: tipos usados implícitamente, `@import` en CSS, o CLI de dev).

**No se tocó** `src/proxy.ts`: aunque no está conectado (Next.js solo reconoce `middleware.ts`, no `proxy.ts` — hoy no corre), el comentario interno ("MAQUETA: sin autenticación... no hay login real") sugiere que fue renombrado a propósito para desactivar el auth durante esta fase, no que sea basura. Se deja para decisión explícita.

## [0.47.0] - 2026-07-17

### Changed

- **Barra de navegación estilo Instagram** (`mobile-nav.tsx`): pegada al borde inferior a todo el ancho (antes: pill flotante despegada 12px), fondo opaco `#080808` con borde superior sutil, 64px de alto + safe-area como padding interno. Se eliminaron el `backdrop-blur-xl`, la sombra y el radio.
- **Pulpo reposicionado** (`octopus-menu.tsx`): geometría del núcleo y pivote ajustada a la barra nueva (BAR_OFFSET 12→0, BAR_H 88→64); el núcleo sigue sobresaliendo la mitad por encima del borde de la barra.

### Performance

- **`getCurrentStudio()` deduplicada con `React.cache()`** (`queries/studio.ts`): el layout del dashboard y cada página la llamaban en el mismo request — eran dos round-trips a Supabase por CADA navegación. Ahora la segunda llamada reutiliza el resultado (~mitad de latencia de datos al navegar).
- **`loading.tsx` del dashboard** (nuevo): skeleton instantáneo (CSS puro, animate-pulse) al navegar entre páginas. Antes no existía ninguno: la pantalla quedaba congelada hasta la respuesta del servidor.
- **Scroll de ajustes destrabado**: eliminadas las dos capas `backdrop-blur` fijas/sticky que se repintaban en cada frame de scroll en iOS — la pill de navegación (ahora barra opaca) y la barra sticky de "Guardar" de las subpáginas de ajustes (`settings-subpage.tsx`, ahora fondo opaco).

### Fixed

- Se subió la versión del caché del service worker (`ofink-v10` → `ofink-v11`).

## [0.46.0] - 2026-07-17

### Changed

- **Curvatura orgánica regenerada para los 6 brazos** (`octopus-menu.tsx`): los 4 principales con curva S más pronunciada (amplitud 15px externos / 11.5px internos, se arquean hacia afuera desde la base y la punta entra curvándose a su botón); llegada analítica exacta al centro de cada botón verificada (error 0.00px). Los 2 decorativos rehechos con el mismo lenguaje: barrido Catmull-Rom lateral + espiral de radio decreciente (r 14→4px, 250°) en la punta, taper y ventosas coherentes.
- **Despliegue desde el centro del núcleo**: los brazos ya no se "levantan" desde la barra (scaleY); nacen con escala uniforme desde el pivote (centro de la cabeza) + fundido de aparición. Los decorativos se des-enroscan (26° → 0° espejado por lado) desde el núcleo.
- **Cerrado limpio**: fundido a opacidad 0 al cerrar — eliminado el filo/reborde verde de los brazos que quedaba visible a los lados del núcleo con el menú cerrado. También se retiró el stroke oscuro del contorno; el volumen queda a cargo del degradado (3 paradas: #CDFF5E → #B4EF1C → #9CD100) y un drop-shadow suave.
- **Isotipo oficial en el núcleo**: el botón disparador ahora usa `/brand/pulpo-negro.png` como máscara CSS pintada con `--primary` (mismo mecanismo que `<Logo/>`) en lugar del pulpo SVG dibujado a mano. Se conserva el crossfade secuencial ícono→foto.

### Fixed

- Se subió la versión del caché del service worker (`ofink-v9` → `ofink-v10`).

## [0.45.0] - 2026-07-17

### Changed

- **Pulpo de 6 brazos**: se agregaron 2 brazos inferiores decorativos (sin botón), simétricos entre sí, con el mismo grosor (taper 14→3.5px), color, degradado y ventosas en la cara interior que los 4 superiores — más un curl en espiral en la punta, como la referencia. Generados en espacio final (Python/NumPy: cubic + espiral de radio decreciente, tangentes numéricas para el ancho perpendicular). Nada más del menú cambió: los 4 botones (Clientes, Agenda, Rápida, Formal) conservan exactamente su posición, tamaño e íconos; `ActionButton` ahora simplemente filtra los brazos `decorative`.
- **Isotipo de OFINK retirado de arriba en todas las páginas**: `MobileTopbar` ya no renderiza nada (se conserva el componente y su prop para no tocar `app-shell` ni lógica), y el overlay del menú abierto perdió el pulpo+wordmark superior — queda solo el fondo desenfocado. Padding superior del layout reducido (4.5rem → 1rem + safe-area) al no haber topbar que compensar.

### Fixed

- Se subió la versión del caché del service worker (`ofink-v8` → `ofink-v9`).

## [0.44.0] - 2026-07-17

### Changed

Réplica del mockup de referencia provisto por el usuario (barra + menú radial), sin tocar lógica, rutas, hooks ni handlers — solo JSX/Tailwind/animaciones:

- **Pill bar flotante estilo Apple** (`mobile-nav.tsx`): despegada del borde (12px + safe-area), fondo `#080808` al 95% con `backdrop-blur-xl`, radio 30px, borde `#222`, 88px de alto, sombra suave. Distribución Inicio · Proyectos · [núcleo] · Cotizaciones · Estudio (ya era el orden de `MOBILE_TAB_ITEMS`). Activo: verde + subrayado corto animado; inactivo: gris neutro. Sin cambios de lógica ni eventos.
- **Botón central como núcleo** (`octopus-menu.tsx`): 84px, interior negro, doble aro verde (borde 2.5px + aro interior fino), glow suave, logo del pulpo en verde. Sobresale exactamente la mitad por encima del borde superior de la barra. Mantiene scale al presionar, spring y el crossfade secuencial a la foto (ahora 64px al abrir).
- **Tentáculos orgánicos**: geometría nueva por completo (Python/NumPy) — curva S cúbica con dos "panzas" desfasadas y distintas por brazo (nada simétrico), taper real 14→3.5px, degradado sutil de luminosidad, y **ventosas**: anillos (elipses evenodd, oscuras) solo en la cara interior, decrecientes hacia la punta. Llegada analítica exacta al centro de cada botón, según las proporciones medidas del mockup (externos ±134,-104; internos ±50,-154/-156).
- **Botones superiores**: 76px, círculo negro `#0d0d0d`, borde verde 2px, glow ligero, ícono verde `size-6` + texto blanco 11px con mayor separación. El tentáculo termina detrás del círculo (el botón opaco lo tapa).
- **Animación secuenciada como pide la spec**: (1) escala el núcleo, (2) salen los tentáculos desde el centro (~320ms con leve overshoot), (3) aparecen los círculos con retraso escalonado Clientes→Agenda→Rápida→Formal. Al cerrar todo vuelve al centro. Capas: contenido < tentáculos (z-35) < botones (z-50) — con el núcleo (z-40) y la pill (z-30) según el stacking ya existente.
- Padding inferior del layout del dashboard ajustado (5.5→7.5rem) para compensar la pill flotante más alta.

### Fixed

- Se subió la versión del caché del service worker (`ofink-v7` → `ofink-v8`).

### Known Issues

- Sin `next build` en este entorno; la composición se verificó con un render estático (Playwright) de la geometría exacta del componente, no con el componente compilado.

## [0.43.0] - 2026-07-17

### Fixed

- **Los tentáculos salían de detrás de la barra de navegación, no del botón**: su capa (z-20) quedaba por debajo de la barra (z-30), así que la base de cada brazo nacía tapada por la barra y parecían desprenderse de ella. Se subieron a z-35 (glow a z-32): por encima de la barra, por debajo del botón (z-40) — ahora se ven desprenderse del propio botón del pulpo.
- **Ícono "doble" en el crossfade**: durante la transición, el ícono saliente y la foto entrante se superponían semitransparentes. Ahora el crossfade es secuencial: el ícono desaparece por completo (opacidad + escala) antes de que entre la foto, y viceversa — nunca se ven las dos capas a la vez. Queda solo el ícono blanco en reposo.
- Se subió la versión del caché del service worker (`ofink-v6` → `ofink-v7`).

### Changed

- **Brazos más largos**: los 4 destinos pasan de ±128/±54 px a ±150/±64 px de alcance horizontal y de -100/-104 a -124/-128 px de altura (internos) — geometría regenerada completa (Python/NumPy) manteniendo la llegada analítica exacta al centro de cada botón, verificada por render (Playwright).
- **Movimiento mejorado**: el despliegue ahora tiene un pequeño overshoot (rota ~8% de más y vuelve, con `times`) en vez de un spring uniforme, y la ondulación continua es más amplia (±1.6°) con duración y desfase distintos por brazo — dejan de moverse todos en sincronía, como un pulpo de verdad.
- **Ícono del botón rediseñado (v3)**: cabeza más compacta y 6 brazos más abiertos, delgados y con curl hacia afuera — verificado por render que se lee como pulpo.

## [0.42.0] - 2026-07-17

### Fixed

- **El botón disparador flotaba arriba de la barra en vez de estar dentro de ella** (confirmado con captura del usuario): con `bottom: NAV_H` + `marginBottom: -20`, la mayor parte del círculo (44 de sus 64px) quedaba por encima del borde superior de la barra. Se reemplazó por `TRIGGER_BOTTOM`, calculado para centrar el botón verticalmente dentro de los 4.25rem de contenido de la barra — ya no sobresale.
- El pivote de tentáculos/glow/botones de acción (antes anclado al borde superior de la barra) se movió con el botón a `PIVOT_BOTTOM` (su nuevo centro vertical), así que siguen naciendo exactamente detrás de él en vez de quedar descolgados del botón real.
- Se subió otra vez la versión del caché del service worker (`ofink-v5` → `ofink-v6`) para este release.

### Changed

- **Ícono en reposo, rehecho**: `pulpo-blanco.png` se reemplazó por un SVG propio (cabeza + 6 tentáculos ondulados) dibujado a mano con Python/NumPy y verificado con Playwright — se ve como un pulpo con claridad incluso a tamaño chico, cosa que el PNG perdía al escalarse.
- **Foto del tatuador más grande al abrir**: pasa de 36px fijos a 52px (dentro del mismo botón de 64px), con transición de escala más notoria.

## [0.41.0] - 2026-07-17

### Fixed

- **`package.json` seguía en `0.36.0`** pese a que el proyecto ya iba en la 0.40.0 — como "Acerca de OFINK" (`version-info.tsx`) lee `NEXT_PUBLIC_APP_VERSION` de `pkg.version` (`next.config.ts`), Ajustes mostraba "0.36.0" aunque el código desplegado fuera mucho más nuevo. Causa raíz de la sensación de "no se actualiza": no era el service worker (que sí se venía subiendo de versión), sino que nadie tocaba `package.json` en cada release. Se subió a `0.41.0`.
- Se subió otra vez la versión del caché del service worker (`ofink-v4` → `ofink-v5`) para forzar la invalidación con este release.

### Changed

- **Tentáculos del `OctopusMenu`, curva real**: los 4 brazos pasan de un afinado recto (taper sobre una línea) a una curva bézier con panza lateral de verdad. El punto de partida (base, pivote de rotación) y el punto de llegada de cada brazo se mantuvieron exactamente iguales — solo se resolvió la geometría rehaciendo el trayecto intermedio con Python/NumPy (bézier cuadrática + normal por punto para el ancho), así que cada tentáculo sigue entrando exacto al centro de su botón, ahora con una curva visible en vez de una diagonal recta.
- **Botones de acceso rápido más grandes**: `BTN_SIZE` de 54 a 64px, con ícono y etiqueta reescalados.
- **Se quitó el nombre del estudio/tatuador de arriba de todas las pantallas** (topbar móvil, `mobile-topbar.tsx`): ya no usa `StudioBrand` (nombre en texto); ahora solo muestra el isotipo del pulpo como marca, enlazando a Inicio igual que antes.
- Centrado del botón disparador revisado: la implementación (`left-1/2` + `marginLeft` fijo, sin `flex justify-center` de por medio) ya estaba matemáticamente centrada desde la 0.39.0. Si en el teléfono se seguía viendo descentrado, era la misma causa que la versión: el bundle servido era anterior a ese fix.

### Known Issues

- Seguimos sin poder correr `next build`/`npm install` en este entorno (sin red). La curva de los tentáculos se verificó por cálculo analítico (el punto de llegada tras la rotación coincide exacto con el original, confirmado por script), no con un render real del componente compilado — revisar visualmente en el próximo deploy de Vercel.

## [0.40.0] - 2026-07-17

### Changed

- **Rediseño completo del pulpo, de cero, a pedido explícito**: fuera el acabado "glossy" con degradados fuertes — ahora es flat, premium, un solo verde de marca con variaciones de luminosidad mínimas. Arquitectura nueva:
  - **Ya no hay un círculo de "cabeza" separado.** El propio botón disparador del Bottom Navigation (siempre el mismo círculo verde) hace de cabeza: al abrir, su ícono se desvanece y aparece la foto del tatuador en el mismo lugar (crossfade). Esto resuelve el problema de tener dos "caras" verdes compitiendo visualmente.
  - **Los tentáculos nacen literalmente detrás del botón** (z-index por debajo), así que no hay "patas" visibles en la base — el botón tapa esa unión por completo.
  - **Geometría resuelta analíticamente, no a ojo**: el punto final de la curva bézier de cada brazo, tras aplicar su rotación, cae calculado para coincidir exactamente con el centro de su botón — cada tentáculo "entra" al círculo (el botón, opaco, se dibuja encima y tapa el tramo final) en vez de terminar pegado sobre él o quedar corto.
  - **Los 4 botones forman un arco superior** (los internos —Agenda/Rápida— más arriba que los externos —Clientes/Formal—), no una fila horizontal.
  - Glow verde muy difuso (blur, sin forma dura) como único efecto de ambientación detrás de todo.
- Verificado esta vez con un pipeline propio: calculé la geometría con Python/NumPy (offset perpendicular a lo largo de cada curva bézier + resolución inversa de la rotación para que la punta caiga exacto sobre el botón), la rendericé con Playwright/Chromium, y confirmé por análisis de píxeles antes de escribir el componente final: una sola forma conectada, centrado a menos de 1px de error, y los 4 tentáculos efectivamente visibles entrando a sus botones.

### Fixed

- Se subió otra vez la versión del caché del service worker (`ofink-v3` → `ofink-v4`) por el mismo motivo de siempre: fuerza a que la PWA no siga sirviendo el bundle anterior cacheado.

## [0.39.0] - 2026-07-17

### Fixed

- **Bug real de centrado (causa confirmada, no una corazonada)**: la cabeza, los tentáculos y los botones de `OctopusMenu` estaban descentrados hacia la izquierda. Causa: cada capa combinaba `flex justify-content: center` (que ya centra a un hijo `absolute` sin `left`/`right` fijados) **con** un `marginLeft` manual negativo pensado para centrar por sí solo — el resultado era un doble centrado que corría todo la mitad de su propio ancho hacia la izquierda. Se reemplazó por el patrón estándar y ya usado en `TriggerButton`: `left-1/2` explícito + `marginLeft` negativo, sin ningún `flex justify-center` de por medio.
- Verificado esta vez con un render real (Playwright + Chromium headless) reproduciendo la geometría exacta del componente antes de subirlo: confirmé el bug de forma aislada (offset de 25px en una prueba mínima), y confirmé que el fix centra exactamente (0px de error) antes de aplicarlo al componente.
- Cabeza agrandada levemente (radio 46→50) para cubrir mejor la zona donde convergen las bases de los 4 tentáculos y que no se vea desprolija en ese punto.

### Known Issues

- Seguimos sin poder correr `next build` en este entorno (sin red). El render de verificación fue una réplica manual en HTML/CSS puro de la geometría del componente, no el componente React real — confirma la causa del bug y que el fix corrige el cálculo, pero no reemplaza un build real de Next.

## [0.38.0] - 2026-07-17

### Fixed

- **Bug real de recorte del cuerpo en `OctopusMenu`**: el mecanismo anterior (contenedor `fixed` + `overflow-hidden` para mostrar solo el ~41% superior del cuerpo) no recortaba de forma fiable — el cuerpo aparecía completo, sin recortar, flotando por encima de contenido de otras pantallas (capturado en pantallas de Proyectos). Se reemplazó por ocultamiento vía **z-index**: el cuerpo vive en una capa (`z-[25]`) por debajo del Bottom Navigation (`z-30`) y por encima del botón disparador (`z-20`); solo se traslada en `Y` — cerrado, se empuja hacia abajo toda su altura (queda íntegramente detrás de la barra opaca); abierto, sube lo justo para asomar. Cero `overflow-hidden`, cero recorte — la barra lo tapa por posición y capa, no por clip.
- **Tentáculos ya no son triángulos planos**: los 4 brazos rellenos se veían como cuñas rectas y poco elegantes. Se recalcularon con offset perpendicular real a lo largo de la curva bézier de cada brazo (afinado analítico de ~24px en la base a ~5px en la punta, 15 puntos por lado), dando una curva orgánica de verdad en vez de una aproximación por 4 puntos de control.
- Cuerpo (`Body`) reducido y simplificado a un capuchón compacto (110×100 en vez de 140×140) para no verse como un bulto amorfo — ahora es proporcional al botón disparador que tapa al abrirse.

### Known Issues

- Seguimos sin poder correr `npm install` / `next build` / `eslint` en este entorno (sin red, sin `node_modules`). Revisar en el próximo build de Vercel y ajustar proporciones a ojo si hace falta.

## [0.37.0] - 2026-07-17

### Changed

- **Reescritura completa del botón central desde cero**: `create-fab.tsx` fue eliminado y reemplazado por `src/components/shared/octopus-menu.tsx`, con un único componente `OctopusMenu` (usado ahora en `app-shell.tsx`). Ya no es un "menú con líneas conectadas" — es una sola criatura vectorial con piezas internas (`Body`, `Avatar`, `TentacleShape` para los 4 brazos, `ActionButton`) que comparten el mismo estado y la misma secuencia de springs.
  - **Cuerpo**: silueta cerrada y rellena inspirada en el isotipo (no un círculo), sin ojos, boca ni degradados. Vive detrás del Bottom Navigation en una ventana con `overflow-hidden`: solo se ve su ~41% superior; la base (de donde nacen los tentáculos) siempre queda clippeada, nunca visible.
  - **Avatar**: la foto del tatuador va incrustada dentro de la cabeza vía `<clipPath>` circular + borde blanco fino + sombra suave — no es un círculo superpuesto.
  - **Tentáculos**: los 4 brazos ahora son masas sólidas rellenas (un único `path` cerrado por brazo, ~26px de ancho en la base a ~6px en la punta), no líneas ni `stroke`. Nacen de la base del cuerpo, no del centro ni de la cabeza.
  - **Botones**: sin cambios de diseño (negro, borde verde fino, ícono verde, texto blanco); ahora aparecen recién cuando su tentáculo termina el recorrido.
  - **Secuencia**: tocar el botón dispara blur de fondo → el botón dispara (mismo botón verde+pulpo blanco de siempre, sin transformarse) crece ligeramente → el cuerpo emerge desde detrás de la barra → al llegar, los tentáculos se despliegan → los botones aparecen con escala. Cierre: inverso.
- El botón disparador del Bottom Navigation ya no se convierte en la foto del tatuador ni sube — permanece siempre igual (verde + pulpo blanco), y la criatura completa (cuerpo + tentáculos) emerge por detrás como una pieza aparte.

### Known Issues (nuevo)

- No se pudo correr `npm install` / `next build` / `eslint` en este entorno (sin acceso a red, sin `node_modules`) — el componente no fue verificado con el compilador todavía. Revisar en el próximo build de Vercel.
- Las curvas de los 4 tentáculos (`d` de cada `TentacleConfig`) son una primera aproximación geométrica del "afinado" pedido; probablemente necesiten ajuste visual fino una vez se vea renderizado.

## [0.36.0] - 2026-07-17

### Changed

- Cabeza del pulpo del FAB (`create-fab.tsx`): vuelve a ser el botón circular simple (verde + pulpo blanco) en reposo. Al abrir, el pulpo se desvanece y aparece la foto del tatuador en su lugar (crossfade); al cerrar, vuelve a mostrarse el pulpo. Se quitó el recorte de silueta vía máscara CSS de la versión anterior.
- `StudioBrand` (topbar móvil y sidebar de escritorio): ya no muestra la imagen del logo del estudio en ningún lado de la web — siempre el nombre del estudio en texto + punto de marca.

## [0.35.0] - 2026-07-17

### Changed

- Rediseño completo del pulpo del FAB (`create-fab.tsx`), mismo mecanismo de apertura/cierre y mismos 4 destinos, solo presentación:
  - **Tentáculos**: de líneas rectas a curvas propias (cada brazo con su propio path SVG, ninguno recto), con ahusado real (3 trazos superpuestos cada vez más delgados hacia la punta) — grosor reducido ~30% frente a la versión anterior.
  - **Cabeza**: ahora usa el isotipo real del pulpo (silueta de `pulpo-negro.png` recortada vía máscara CSS, no un círculo liso), mostrando solo el ~40% superior — el resto queda oculto tras la barra. Tamaño reducido. La foto del tatuador sigue integrada en el centro del aro.
  - **Distribución**: los 4 botones pasan de dos pares verticales simétricos a un arco irregular con más aire entre ellos.
  - **Secuencia**: al abrir, la cabeza sube primero, luego se despliegan los tentáculos, y los botones aparecen al final (justo cuando su tentáculo llega). Al cerrar es a la inversa: botones → tentáculos → cabeza.
  - **Microanimación**: mientras el menú está abierto, los tentáculos tienen una respiración sutil (leve oscilación continua).
  - Fondo: blur más intenso (`backdrop-blur-lg`).
- Los botones en sí (forma, color, ícono, texto) no se tocaron, según lo pedido.

## [0.34.0] - 2026-07-17

### Fixed

- **Bug real de posicionamiento en el pulpo del FAB**: las clases Tailwind `-translate-x-1/2` (para centrar) entraban en conflicto con `motion/react`, que escribe `transform` directo por JS y las pisaba — el centrado ahora va por `marginLeft` fijo en px, dejando `transform` 100% en manos de `motion`.
- **Color real del logo**: `logo-completo.png` viene en **rojo** de fábrica (no verde, como asumí antes). `Logo` (`logo.tsx`), el overlay del FAB y `auth-shell.tsx` ahora pintan el pulpo en el verde de marca (`--primary`) recortando la silueta sólida `pulpo-negro.png` como máscara CSS; el wordmark blanco se mantiene igual.
- Se simplificó el mecanismo de "recorte tras la barra" del pulpo (dependía de `overflow-hidden` + offsets negativos, frágil) por un anclaje directo al borde superior de la barra — más robusto, aunque ya no oculta una porción del cuerpo tras el Bottom Navigation.

## [0.33.0] - 2026-07-17

### Added

- Nueva dependencia **`motion`** (sucesora de Framer Motion, `motion/react`) en `package.json`. Se instalará sola en el próximo `npm install` / deploy de Vercel — no se pudo instalar ni compilar aquí porque este entorno no tiene acceso a red.

### Changed

- Animación del pulpo del FAB (`create-fab.tsx`) reescrita con `motion/react`: los tentáculos, sus botones y la cabeza ahora usan física de resorte (`spring`) en vez de `transition` de CSS a mano, para un movimiento más orgánico y fluido.

## [0.32.0] - 2026-07-17

### Changed

- Tarjeta de proyecto: la fotografía ocupa aún más espacio (bloque blanco reducido al mínimo).
- Chip de estado: "En progreso" ahora muestra el porcentaje puesto por el tatuador (`manual_progress`, o el de sesiones completadas si no hay uno manual) en vez del texto genérico. "Agendado" ya venía correcto en `STATUS_LABELS`.
- Tarjeta "Productividad este mes": ahora son **4 tarjetas en una sola fila horizontal** (antes apiladas verticalmente).
- `Logo` (login, offline): usa por defecto la versión completa (pulpo verde + wordmark) en vez del wordmark monocromático.
- Barra de navegación móvil: **anclada al borde inferior** de la pantalla, a todo lo ancho — ya no es una pill flotante con márgenes.
- **Rediseño completo del botón central del pulpo**: ya no abre un menú desplegable tradicional. Ahora es una criatura vectorial propia — la cabeza (con la foto del tatuador integrada al centro) sube ~70px y cuatro tentáculos rellenos (dos a cada lado) se despliegan desde debajo de la barra, cada uno sosteniendo un botón circular de acceso rápido (Cotización rápida/formal a la derecha; Clientes/Agenda a la izquierda, de momento fijos). Fondo desenfocado + logo OFINK arriba mientras está abierto. Sin modal, sin popup, sin FAB radial genérico.

### Added

- `CreateFab` recibe `avatarUrl` (reutiliza `studio.logoUrl`, ya disponible en `AppShell` — sin nuevas consultas) para la foto integrada en la cabeza del pulpo.

## [0.31.0] - 2026-07-17

### Changed

- Tarjeta de proyecto (`project-card.tsx`): ya no navega a la ficha del proyecto — al tocarla se abre un **popup** (`project-detail-dialog.tsx`) con foto, estado, progreso, próxima sesión y saldo, más un enlace "Ver proyecto completo".
- Se quitó la fecha y el valor del footer de la tarjeta; en su lugar hay un **chip de estado a todo lo ancho** (verde cuando el proyecto está completado).
- Grid de proyectos: de 3 a **2 columnas**, para que cada tarjeta se vea más grande y legible.
- Tarjeta de "Productividad este mes" rediseñada con el mismo lenguaje visual que las tarjetas de Inicio (contenedor grande, título tipo h2, ícono-en-círculo por métrica).
- Filtros de Proyectos: ahora son **Todos**, **Completados** y un selector de **mes** (antes había chips de Pendiente/En sesión).
- Botón "+" flotante de la tarjeta: eliminado.
- FAB del pulpo (crear cotización): al abrirse, desenfoca el fondo y muestra el logo de OFINK arriba.

## [0.30.0] - 2026-07-17

### Changed

- Tarjeta de proyecto rediseñada como cuadrada y minimalista (`src/components/projects/project-card.tsx`), optimizada para el grid fijo de 3 columnas en móvil: la fotografía pasa a ocupar casi toda la tarjeta (protagonista), el bloque inferior queda delgado con solo nombre, estilo, barra de progreso + porcentaje y footer (fecha + valor).

### Removed

- Badge flotante de estado del proyecto (punto de color + etiqueta como "Diseño") sobre la fotografía.
- Botón circular con el isotipo del pulpo sobre la curva.
- Curva de transición (SVG), grid de puntos decorativo y marco negro grueso — se quitaron por no ser viables en el espacio angosto de una tarjeta cuadrada de 3 columnas.

## [0.29.0] - 2026-07-17

### Changed

- Ajuste de la tarjeta de proyecto (`src/components/projects/project-card.tsx`) para calzar fielmente con la referencia visual: marco negro grueso alrededor de toda la tarjeta, curva de transición asimétrica (más baja a la izquierda, pico hacia la derecha bajo el botón), grid de puntos decorativo visible, nombre del cliente más grande, barra de progreso más gruesa.

### Added

- Franja verde "Completado" al final de la tarjeta cuando el proyecto está finalizado, además de la fecha y el valor.

## [0.28.0] - 2026-07-17

### Changed

- Rediseño premium de la tarjeta de proyecto (`src/components/projects/project-card.tsx`): foto protagonista (~60%), badge de estado y botón "+" flotantes, transición con curva orgánica (SVG), bloque inferior blanco cálido (`#FAFAF8`) con nombre grande, progreso en barra lima, botón con isotipo del pulpo y patrón de puntos decorativo. Sin cambios en estructura de pantalla, grid, filtros, navegación ni lógica de datos.

## Known Issues

- `quote_links` no tiene borrado automático: pasados los 7 días la fila sigue en la base de datos, solo `getPublicQuoteProject` deja de servir la página al validar `expires_at`. Para borrado físico real hace falta un cron (pg_cron en Supabase o un endpoint programado) — no existe infraestructura de cron en el proyecto todavía.
- El proyecto usa datos simulados: existe `src/lib/mock` (`data.ts`, `client.ts`) junto a `src/lib/supabase`, según el README es una maqueta visual sin backend real.
- Conexión real a Supabase pendiente de confirmar como funcional en producción.
- `next.config.ts` ignora errores de tipos de TypeScript en el build (`typescript.ignoreBuildErrors`). El lint ya no se configura ahí — corre aparte con `npm run lint` (`eslint.config.mjs`), como indica el propio comentario del archivo.
- README indica explícitamente que no hay login ni persistencia de datos, lo cual podría estar desactualizado frente a la presencia de `src/lib/supabase` y rutas de autenticación.
