import { GoogleGenerativeAI } from '@google/generative-ai';
import type { OcrResult } from '@/lib/types';

const PROMPT = `You are a receipt verifier for a Malaysian bank-transfer payment.

Look at this image and extract the following from the transfer receipt:
- detected_amount (number, MYR — the amount transferred)
- detected_recipient (string — the name of the account holder receiving the money)
- detected_reference (string or null — any reference / transaction ID shown)
- detected_date (string — ISO 8601 if possible, else as shown)
- detected_bank (string — bank name shown e.g. "BANK ISLAM", "MAYBANK", "CIMB", "DUITNOW")
- raw_text (string — short flat dump of important lines from the receipt)
- is_likely_real (boolean — true if it looks like a real Malaysian banking app screenshot or printout, false if it looks photoshopped, generated, or contains obvious tampering)
- confidence ("high" | "medium" | "low") — your confidence in the extraction
- notes (string — short note about anything suspicious or unclear)

If a field is genuinely not visible, set it to null (or for booleans/strings use a sensible default). Do NOT guess.

Return ONLY a single JSON object. No markdown, no commentary.`;

export async function extractReceipt(imageBase64: string, mimeType: string): Promise<OcrResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  });

  const result = await model.generateContent([
    PROMPT,
    { inlineData: { data: imageBase64, mimeType } },
  ]);

  const text = result.response.text();
  let parsed: Partial<OcrResult>;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      detected_amount: null,
      detected_recipient: null,
      detected_reference: null,
      detected_date: null,
      detected_bank: null,
      raw_text: text.slice(0, 1000),
      is_likely_real: false,
      confidence: 'low',
      notes: 'Could not parse Gemini JSON response',
    };
  }

  return {
    detected_amount: typeof parsed.detected_amount === 'number' ? parsed.detected_amount : null,
    detected_recipient: parsed.detected_recipient ?? null,
    detected_reference: parsed.detected_reference ?? null,
    detected_date: parsed.detected_date ?? null,
    detected_bank: parsed.detected_bank ?? null,
    raw_text: parsed.raw_text ?? '',
    is_likely_real: parsed.is_likely_real ?? false,
    confidence: parsed.confidence ?? 'low',
    notes: parsed.notes ?? '',
  };
}

export function matchReceipt(
  ocr: OcrResult,
  expectedAmount: number,
  expectedHolder: string,
): boolean {
  if (!ocr.is_likely_real) return false;
  if (ocr.detected_amount == null) return false;
  if (Math.abs(ocr.detected_amount - expectedAmount) > 0.01) return false;
  const recipient = (ocr.detected_recipient ?? '').toUpperCase().replace(/\s+/g, ' ').trim();
  const holder = expectedHolder.toUpperCase().replace(/\s+/g, ' ').trim();
  if (!recipient.includes(holder.split(' ')[0])) return false;
  return true;
}
