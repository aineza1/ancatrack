
const AfricasTalking = require('africastalking') as (config: { apiKey: string; username: string }) => any

const at = AfricasTalking({
  apiKey:   process.env.AT_API_KEY!,
  username: process.env.AT_USERNAME!,
})

const sms = at.SMS

export async function sendSMS(to: string, message: string): Promise<void> {
  try {
    const result = await sms.send({
      to:      [to],
      message: message,
    })
    console.log('SMS sent:', JSON.stringify(result, null, 2))
  } catch (err: any) {
    console.error('SMS error:', err?.message || err)
  }
}

export function buildPatientSMS(
  patientName: string,
  severity: 'high' | 'medium'
): string {
  if (severity === 'high') {
    return `AncaTrack - Nyamata Hospital\nDear ${patientName}, your recent ANC visit blood pressure reading requires urgent attention. Please contact your doctor or return to the hospital.`
  }
  return `AncaTrack - Nyamata Hospital\nDear ${patientName}, your recent ANC visit has been recorded. Your blood pressure needs monitoring. Please attend your next scheduled visit.`
}
