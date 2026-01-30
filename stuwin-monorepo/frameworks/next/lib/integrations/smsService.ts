const SMSPLUS_URL = 'https://smsplus.az/api/sms/send';

function normalizeAzPhone(input: string | number | null | undefined): string | null {
  const digits = String(input || '').replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('994')) return digits;
  if (digits.startsWith('0')) return `994${digits.slice(1)}`;
  if (digits.length === 9) return `994${digits}`;
  return digits;
}

interface SendOtpSmsResult {
  success: boolean;
  error?: string;
  code?: string;
  message?: string;
}

interface SendOtpSmsOptions {
  number: string | number;
  otp: string | number;
  expiryMinutes?: number;
}

export async function sendOtpSmsPlus({
  number,
  otp,
  expiryMinutes = 10
}: SendOtpSmsOptions): Promise<SendOtpSmsResult> {
  try {
    const token = process.env.SMSPLUS_TOKEN;
    const sender = process.env.SMSPLUS_SENDER;
    const templateId = Number(process.env.SMSPLUS_TEMPLATE_ID);

    if (!token || !sender || !templateId) {
      return { success: false, error: 'SMSPlus env vars missing' };
    }

    const formatted = normalizeAzPhone(number);
    if (!formatted) return { success: false, error: 'Invalid phone number' };

    const body = {
      sender_name: sender,
      message_template_id: templateId,
      mobile_numbers: [formatted],
      first_parameters: [String(otp)]
    };

    const res = await fetch(SMSPLUS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('SMSPlus response:', res);

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success !== true) {
      return {
        success: false,
        error: data?.message || `SMSPlus error ${res.status}`,
        code: data?.code
      };
    }

    return { success: true, code: data.code, message: data.message };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return { success: false, error: error.message || 'SMS send failed' };
  }
}

export { normalizeAzPhone };

