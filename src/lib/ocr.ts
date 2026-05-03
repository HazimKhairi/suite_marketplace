import { createWorker } from 'tesseract.js';
import type { OcrResult } from '@/lib/types';

// Tesseract worker is reused across invocations on warm Vercel functions to avoid the ~5s
// language-data load on every receipt upload.
let workerPromise: ReturnType<typeof createWorker> | null = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker('eng');
  }
  return workerPromise;
}

const BANK_KEYWORDS = [
  'BANK ISLAM',
  'MAYBANK',
  'CIMB',
  'RHB',
  'BANK RAKYAT',
  'HONG LEONG',
  'AMBANK',
  'AM BANK',
  'ALLIANCE',
  'PUBLIC BANK',
  'BSN',
  'UOB',
  'CITIBANK',
  'STANDARD CHARTERED',
  'OCBC',
  'HSBC',
  'AGROBANK',
  'AFFIN',
  'MUAMALAT',
  'BOOST',
  'TOUCH N GO',
  "TOUCH 'N GO",
  'TNG',
  'GRABPAY',
  'SHOPEEPAY',
  'BIGPAY',
  'DUITNOW',
  'FPX',
];

function detectAmount(text: string): number | null {
  // Strategy: find every monetary-looking number in the text, then prefer the largest one
  // that is plausibly the transfer amount. Bank receipts almost always print the transferred
  // value with two decimals, so we bias toward that pattern and fall back to whole-ringgit
  // values that follow an explicit "RM" / "MYR" prefix.
  const candidates: number[] = [];

  // RM 33.00, MYR 33.00, RM33.00 — explicit currency prefix
  const prefixed = text.matchAll(/(?:RM|MYR)\s*([0-9]{1,7}(?:[,\s][0-9]{3})*(?:[.,][0-9]{2}))/gi);
  for (const m of prefixed) {
    const cleaned = m[1].replace(/[,\s]/g, '').replace(/,/g, '.');
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n)) candidates.push(n);
  }

  // Standalone decimal numbers like 33.00, 1,250.00, 28.50
  const decimal = text.matchAll(/\b([0-9]{1,7}(?:[,\s][0-9]{3})*[.,][0-9]{2})\b/g);
  for (const m of decimal) {
    const cleaned = m[1].replace(/[,\s]/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    if (!Number.isNaN(n)) candidates.push(n);
  }

  if (candidates.length === 0) return null;
  // Prefer the largest plausible candidate — most receipts list a fee or balance smaller
  // than the actual transfer.
  return Math.max(...candidates);
}

function detectBank(text: string): string | null {
  const upper = text.toUpperCase();
  for (const keyword of BANK_KEYWORDS) {
    if (upper.includes(keyword)) return keyword;
  }
  return null;
}

function detectReference(text: string): string | null {
  // Many Malaysian banks print a 10-16 digit transaction reference. Take the longest match.
  const refs = Array.from(text.matchAll(/\b([0-9]{10,18})\b/g)).map((m) => m[1]);
  if (refs.length === 0) return null;
  return refs.sort((a, b) => b.length - a.length)[0];
}

function detectDate(text: string): string | null {
  // 04/05/2026, 4-May-2026, 4 May 2026, 2026-05-04 — pick the first match
  const patterns = [
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b/,
    /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

function detectRecipient(text: string, expectedHolder: string): string | null {
  // Tesseract often produces noisy multi-line output, so we scan line-by-line for whichever
  // line contains the expected holder's first word. If found, return that whole line trimmed
  // so the admin notification surfaces what the receipt actually printed.
  const firstWord = expectedHolder.toUpperCase().split(/\s+/)[0];
  if (!firstWord) return null;
  const lines = text.split(/\r?\n/);
  const upper = lines.map((l) => l.toUpperCase());
  for (let i = 0; i < lines.length; i++) {
    if (upper[i].includes(firstWord) && lines[i].trim().length > 0) {
      return lines[i].trim();
    }
  }
  return null;
}

export async function extractReceipt(
  imageBuffer: Buffer,
  expectedHolder: string,
): Promise<OcrResult> {
  let raw = '';
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(imageBuffer);
    raw = (data.text ?? '').trim();
  } catch (e) {
    return {
      detected_amount: null,
      detected_recipient: null,
      detected_reference: null,
      detected_date: null,
      detected_bank: null,
      raw_text: '',
      is_likely_real: false,
      confidence: 'low',
      notes: e instanceof Error ? e.message : 'OCR failed',
    };
  }

  if (!raw) {
    return {
      detected_amount: null,
      detected_recipient: null,
      detected_reference: null,
      detected_date: null,
      detected_bank: null,
      raw_text: '',
      is_likely_real: false,
      confidence: 'low',
      notes: 'No text extracted from image',
    };
  }

  const amount = detectAmount(raw);
  const bank = detectBank(raw);
  const reference = detectReference(raw);
  const date = detectDate(raw);
  const recipient = detectRecipient(raw, expectedHolder);

  // Confidence heuristic: if we have an amount + a recognised bank + recipient line, it
  // looks like a real Malaysian transfer slip. Otherwise dial it down.
  const hits = [amount != null, !!bank, !!recipient].filter(Boolean).length;
  const confidence: OcrResult['confidence'] = hits >= 3 ? 'high' : hits >= 2 ? 'medium' : 'low';

  return {
    detected_amount: amount,
    detected_recipient: recipient,
    detected_reference: reference,
    detected_date: date,
    detected_bank: bank,
    raw_text: raw.slice(0, 4000),
    is_likely_real: hits >= 1,
    confidence,
    notes: hits === 0 ? 'No amount, bank, or recipient line detected' : '',
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
  // Recipient name presence is best-effort — Tesseract can mangle names. Fall back to a
  // looser substring check anywhere in the raw text so we don't reject a clearly-correct
  // amount because OCR garbled the recipient line.
  const firstWord = expectedHolder.toUpperCase().split(/\s+/)[0];
  if (!firstWord) return true;
  if (!ocr.raw_text.toUpperCase().includes(firstWord)) return false;
  return true;
}
