// POS digital-receipt service.
//
// Responsibilities:
//  1. Render a POS transaction into a PDF "struk" (thermal-receipt style) using
//     jsPDF — fully client-side so it also works while the cashier is offline.
//  2. Upload that PDF to Firebase Storage to obtain a public URL that can be
//     shared over WhatsApp (wa.me only carries text, so we send a link).
//  3. Build the wa.me deep link + message, and expose a Web Share helper so
//     that, on mobile, the cashier can attach the actual PDF file to WhatsApp.
//
// Everything here is browser-only (jsPDF, navigator.share, Firebase client
// SDK) and must be called from client components / event handlers.

import { jsPDF } from 'jspdf';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import type { POSTransaction, Cooperative } from '@/types';
import { normalizeWhatsappNumber } from '@/lib/utils/phone';

const rupiah = (n: number) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`;

/** Short human-facing receipt number derived from the internal transaction id. */
export function receiptNumber(tx: POSTransaction): string {
  const parts = tx.id.split('-');
  const tail = parts.length > 1 ? parts[parts.length - 1] : tx.id;
  return `STR-${String(tail).slice(-6).toUpperCase()}`;
}

function formatDateTime(iso: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Render the transaction into a PDF Blob styled like an 80mm thermal receipt.
 * The page height grows with the number of line items so nothing is clipped.
 */
export function generateReceiptPdf(
  tx: POSTransaction,
  coop?: Cooperative | null
): { blob: Blob; fileName: string } {
  const width = 80; // mm — standard thermal roll width
  const margin = 5;
  const lineH = 4.2;
  const contentW = width - margin * 2;

  // Estimate height: fixed chrome + a couple of wrapped lines per item.
  const estItemLines = tx.items.reduce((acc, it) => {
    const nameLines = Math.max(1, Math.ceil((it.commodity_name || '').length / 30));
    return acc + nameLines + 1; // name line(s) + qty×price line
  }, 0);
  const height = 70 + estItemLines * lineH + (tx.customer_name ? lineH * 2 : 0) + 40;

  const doc = new jsPDF({ unit: 'mm', format: [width, height] });
  let y = margin + 2;

  const center = (text: string, size: number, bold = false) => {
    doc.setFont('courier', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.text(text, width / 2, y, { align: 'center' });
    y += lineH;
  };
  const row = (l: string, r: string, size = 8, bold = false) => {
    doc.setFont('courier', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.text(l, margin, y);
    doc.text(r, width - margin, y, { align: 'right' });
    y += lineH;
  };
  const rule = () => {
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text('-'.repeat(38), width / 2, y, { align: 'center' });
    y += lineH;
  };

  // ── Header ──────────────────────────────────────────────────────────────
  center((coop?.name || 'Koperasi Desa').toUpperCase(), 10, true);
  if (coop?.address) {
    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    const addr = doc.splitTextToSize(coop.address, contentW);
    doc.text(addr, width / 2, y, { align: 'center' });
    y += addr.length * (lineH - 0.6);
  } else if (coop?.city) {
    center(`${coop.city}${coop.province ? ', ' + coop.province : ''}`, 7);
  }
  if (coop?.phone) center(`Telp/WA: ${coop.phone}`, 7);
  y += 1;
  rule();

  // ── Meta ────────────────────────────────────────────────────────────────
  center('STRUK PEMBELIAN', 9, true);
  y += 0.5;
  row('No.', receiptNumber(tx), 8);
  row('Tanggal', formatDateTime(tx.created_at), 7);
  if (tx.customer_name) row('Pembeli', tx.customer_name, 7);
  rule();

  // ── Items ─────────────────────────────────────────────────────────────────
  tx.items.forEach((it) => {
    const nameLines = doc.splitTextToSize(it.commodity_name || 'Item', contentW);
    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.text(nameLines, margin, y);
    y += nameLines.length * lineH;
    const qtyStr = `${it.quantity.toLocaleString('id-ID')} ${it.unit || ''} x ${rupiah(it.price_per_kg)}`;
    row(qtyStr.trim(), rupiah(it.quantity * it.price_per_kg), 7);
  });
  rule();

  // ── Totals ──────────────────────────────────────────────────────────────
  row('TOTAL', rupiah(tx.total_amount), 10, true);
  row('Metode', tx.payment_method, 8);
  if (tx.payment_method === 'Tunai' && typeof tx.amount_paid === 'number') {
    row('Tunai', rupiah(tx.amount_paid), 8);
    row('Kembalian', rupiah(tx.change || 0), 8);
  }
  rule();

  // ── Footer ──────────────────────────────────────────────────────────────
  y += 1;
  center('Terima kasih telah berbelanja', 7);
  center('di koperasi kami.', 7);
  y += 1;
  center('Struk digital via ARUNA', 6);

  const blob = doc.output('blob');
  return { blob, fileName: `${receiptNumber(tx)}.pdf` };
}

/**
 * Upload the receipt PDF to Firebase Storage and return a public download URL.
 * Throws on failure so callers can fall back to a link-less WhatsApp message.
 */
export async function uploadReceiptPdf(
  blob: Blob,
  tx: POSTransaction
): Promise<string> {
  const path = `receipts/${tx.cooperative_id || 'umum'}/${tx.id}.pdf`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });
  return getDownloadURL(storageRef);
}

/** Compose the WhatsApp message body for a receipt (with optional PDF link). */
export function buildReceiptMessage(
  tx: POSTransaction,
  coop?: Cooperative | null,
  pdfUrl?: string
): string {
  const name = tx.customer_name ? ` ${tx.customer_name}` : '';
  const coopName = coop?.name || 'Koperasi Desa';
  const lines = [
    `Halo${name}, terima kasih telah berbelanja di *${coopName}*.`,
    '',
    `Struk: ${receiptNumber(tx)}`,
    `Tanggal: ${formatDateTime(tx.created_at)}`,
    `Total: ${rupiah(tx.total_amount)} (${tx.payment_method})`,
  ];
  if (tx.payment_method === 'Tunai' && typeof tx.amount_paid === 'number') {
    lines.push(`Bayar: ${rupiah(tx.amount_paid)} · Kembali: ${rupiah(tx.change || 0)}`);
  }
  if (pdfUrl) {
    lines.push('', `Struk PDF Anda: ${pdfUrl}`);
  }
  lines.push('', 'Simpan struk ini sebagai bukti pembayaran. 🙏');
  return lines.join('\n');
}

/** Build a wa.me deep link that opens WhatsApp with the message pre-filled. */
export function buildWhatsappUrl(rawNumber: string, message: string): string {
  const number = normalizeWhatsappNumber(rawNumber);
  const text = encodeURIComponent(message);
  // wa.me works with or without a number; with a number it targets the buyer.
  return number
    ? `https://wa.me/${number}?text=${text}`
    : `https://wa.me/?text=${text}`;
}

/** True when the browser can share files (Web Share API level 2, mobile). */
export function canShareReceiptFile(blob?: Blob | null): boolean {
  if (typeof navigator === 'undefined' || !('canShare' in navigator)) return false;
  try {
    const file = new File([blob ?? new Blob()], 'struk.pdf', { type: 'application/pdf' });
    return (navigator as Navigator).canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Share the actual PDF file through the OS share sheet (lets the user pick
 * WhatsApp and attach the file directly). Returns true if the share was
 * invoked, false when unsupported so the caller can fall back to wa.me.
 */
export async function shareReceiptFile(
  blob: Blob,
  fileName: string,
  message: string
): Promise<boolean> {
  if (!canShareReceiptFile(blob)) return false;
  const file = new File([blob], fileName, { type: 'application/pdf' });
  try {
    await (navigator as Navigator).share({
      files: [file],
      title: 'Struk Pembelian',
      text: message,
    });
    return true;
  } catch (err) {
    // AbortError = user dismissed the sheet; treat as handled.
    if (err instanceof DOMException && err.name === 'AbortError') return true;
    return false;
  }
}

/** Trigger a local download of the PDF (offline-safe fallback / archival). */
export function downloadReceiptPdf(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
