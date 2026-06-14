import webpush from 'web-push';

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL ?? 'mailto:noreply@pawcare.app';
  if (pub && priv) {
    webpush.setVapidDetails(email, pub, priv);
    configured = true;
  }
}

export interface WebPushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendWebPush(subscription: unknown, payload: WebPushPayload) {
  ensureConfigured();
  if (!configured) {
    console.warn('[push] VAPID not configured, skipping web push');
    return;
  }
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    console.error('[push] web push failed', err);
  }
}

export async function sendExpoPush(
  pushToken: string,
  payload: WebPushPayload
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        to: pushToken,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `Expo push ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
