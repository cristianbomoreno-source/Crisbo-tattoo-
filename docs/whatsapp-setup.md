# Mensajes de WhatsApp (CRM) — puesta en marcha

La bandeja `/dashboard/inbox` usa la **WhatsApp Cloud API** oficial de Meta.
Una sola app de Meta sirve a toda la plataforma; cada estudio conecta su
propio número desde **Ajustes → WhatsApp Business**.

## 1. Base de datos (una vez)

Ejecuta `whatsapp-inbox.sql` en el SQL Editor de Supabase. Crea
`whatsapp_accounts`, `wa_conversations`, `wa_messages`, sus políticas RLS y
los agrega a Realtime.

## 2. App de Meta (compartida con Diego Neira y Keicy)

Se reutiliza la **app de Meta** de Diego Neira y Keicy Barber Club (solo la
app: Crisbo Tattoo usa su **propio número** y su propia cuenta de WhatsApp
Business). La Callback URL general de la app apunta al webhook de Diego en
Supabase — **no hay que cambiarla**. Al conectar un número desde Crisbo
Tattoo, la app llama a Meta para fijar un callback **solo para ese número**
([webhook overrides](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/override/)):
Meta busca primero el callback del número, luego el de la WABA y al final el
de la app, así que Diego y Keicy siguen recibiendo lo suyo.

1. En la app compartida (developers.facebook.com → **App settings → Basic**)
   copia el **App Secret**. Es el mismo valor que Diego tiene en Supabase
   como `WHATSAPP_APP_SECRET`.
2. En Vercel (`crisbo-next` → Settings → Environment Variables) agrega:
   - `WHATSAPP_APP_SECRET` = ese App Secret (Meta firma todos los webhooks
     de la app con él)
   - `WHATSAPP_VERIFY_TOKEN` = una clave que inventes (p. ej. `crisbo-wa-2026`);
     no tiene que coincidir con la de Diego
   - Opcional: `WHATSAPP_WEBHOOK_URL=https://crisbotattoo.com/api/whatsapp/webhook`
     (si no, se usa el dominio desde el que conectas el número)
   Luego redeploy.

## 3. Número del estudio

1. En **WhatsApp → API Setup** verás el **Phone Number ID** y el
   **WhatsApp Business Account ID**. Al principio Meta da un número de prueba
   gratis (solo puede escribir a 5 números que verifiques ahí mismo).
2. Para el número real de Crisbo: **Add phone number** (crea o elige la WABA
   de Crisbo Tattoo, no la de Diego). Ojo: un número que ya está en
   la app de WhatsApp normal deja de funcionar ahí al pasarlo a la API.
3. Token permanente: **Business settings → Users → System users** → crea un
   usuario de sistema (Admin) → **Generate token** para tu app con los permisos
   `whatsapp_business_messaging` y `whatsapp_business_management`, sin
   caducidad. (El token temporal de API Setup caduca en 24 h.)
4. En Crisbo Tattoo (desde crisbotattoo.com, no desde local):
   **Ajustes → WhatsApp Business** → pega Phone Number ID, WABA ID y el token
   → **Conectar y probar**. Eso suscribe la app a la WABA y fija el callback
   del número; si Meta lo rechaza, aparece un aviso con el motivo.

El número de Crisbo va en **su propia cuenta de WhatsApp Business (WABA)**,
separada de la de Diego. El usuario de sistema que genera el token debe tener
acceso a esa WABA (Business settings → WhatsApp accounts → asignar el usuario
de sistema con control total).

## Reglas de Meta para tener en cuenta

- **Ventana de 24 h**: solo puedes escribir texto libre si el cliente te
  escribió en las últimas 24 h. Fuera de ella, solo plantillas aprobadas
  (fase 2).
- Las conversaciones iniciadas con plantilla se cobran por Meta.
