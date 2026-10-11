# Mensajes de WhatsApp (CRM) — puesta en marcha

La bandeja `/dashboard/inbox` usa la **WhatsApp Cloud API** oficial de Meta.
Una sola app de Meta sirve a toda la plataforma; cada estudio conecta su
propio número desde **Ajustes → WhatsApp Business**.

## 1. Base de datos (una vez)

Ejecuta `whatsapp-inbox.sql` en el SQL Editor de Supabase. Crea
`whatsapp_accounts`, `wa_conversations`, `wa_messages`, sus políticas RLS y
los agrega a Realtime.

## 2. App de Meta (una vez)

1. Entra a <https://developers.facebook.com/apps> → **Crear app** → tipo
   **Business** → agrega el producto **WhatsApp**.
2. En **App settings → Basic** copia el **App Secret**.
3. En Vercel (`crisbo-next` → Settings → Environment Variables) agrega:
   - `WHATSAPP_APP_SECRET` = el App Secret
   - `WHATSAPP_VERIFY_TOKEN` = una clave cualquiera que inventes (p. ej. `crisbo-wa-2026`)
   Luego redeploy.
4. En **WhatsApp → Configuration → Webhook**:
   - Callback URL: `https://crisbotattoo.com/api/whatsapp/webhook`
   - Verify token: el mismo `WHATSAPP_VERIFY_TOKEN`
   - **Subscribe** al campo `messages`.

## 3. Número del estudio

1. En **WhatsApp → API Setup** verás el **Phone Number ID** y el
   **WhatsApp Business Account ID**. Al principio Meta da un número de prueba
   gratis (solo puede escribir a 5 números que verifiques ahí mismo).
2. Para un número real: **Add phone number**. Ojo: un número que ya está en
   la app de WhatsApp normal deja de funcionar ahí al pasarlo a la API.
3. Token permanente: **Business settings → Users → System users** → crea un
   usuario de sistema (Admin) → **Generate token** para tu app con los permisos
   `whatsapp_business_messaging` y `whatsapp_business_management`, sin
   caducidad. (El token temporal de API Setup caduca en 24 h.)
4. En Crisbo Tattoo: **Ajustes → WhatsApp Business** → pega Phone Number ID,
   WABA ID y el token → **Conectar y probar**.

## Reglas de Meta para tener en cuenta

- **Ventana de 24 h**: solo puedes escribir texto libre si el cliente te
  escribió en las últimas 24 h. Fuera de ella, solo plantillas aprobadas
  (fase 2).
- Las conversaciones iniciadas con plantilla se cobran por Meta.
