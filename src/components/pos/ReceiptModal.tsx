'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  X, Download, Share2, CheckCircle2, Loader2, FileText, Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { POSTransaction, Cooperative } from '@/types';
import { formatWhatsappDisplay } from '@/lib/utils/phone';
import {
  generateReceiptPdf,
  uploadReceiptPdf,
  buildReceiptMessage,
  buildWhatsappUrl,
  shareReceiptFile,
  canShareReceiptFile,
  downloadReceiptPdf,
  receiptNumber,
} from '@/lib/services/receipt';

// WhatsApp brand glyph (lucide has no dedicated WA icon).
function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const rupiah = (n: number) => `Rp ${Math.round(n || 0).toLocaleString('id-ID')}`;

interface ReceiptModalProps {
  tx: POSTransaction;
  coop?: Cooperative | null;
  onClose: () => void;
}

export default function ReceiptModal({ tx, coop, onClose }: ReceiptModalProps) {
  // Generate the PDF lazily during first render (client-only; this modal never
  // renders during SSR since it mounts after a checkout interaction).
  const [pdf] = useState<{ blob: Blob; fileName: string }>(() => generateReceiptPdf(tx, coop));
  const [pdfUrl, setPdfUrl] = useState<string>('');
  // Initialize to true only when we will actually attempt an upload (online),
  // so the effect never has to call setState synchronously in its body.
  const [uploading, setUploading] = useState<boolean>(
    () => (typeof navigator !== 'undefined' ? navigator.onLine : false)
  );
  const [uploadFailed, setUploadFailed] = useState(false);
  const [sent, setSent] = useState(false);

  const hasNumber = !!tx.customer_wa;
  const canShare = useMemo(() => canShareReceiptFile(pdf?.blob), [pdf]);

  // Try to upload the PDF for a shareable link once on mount (best-effort).
  useEffect(() => {
    let cancelled = false;
    const online = typeof navigator !== 'undefined' ? navigator.onLine : false;
    if (!pdf || !online) return;

    uploadReceiptPdf(pdf.blob, tx)
      .then((url) => {
        if (!cancelled) setPdfUrl(url);
      })
      .catch((err) => {
        console.warn('Receipt PDF upload failed; falling back to link-less message:', err);
        if (!cancelled) setUploadFailed(true);
      })
      .finally(() => {
        if (!cancelled) setUploading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendWhatsapp = () => {
    const message = buildReceiptMessage(tx, coop, pdfUrl || undefined);
    const url = buildWhatsappUrl(tx.customer_wa || '', message);
    window.open(url, '_blank', 'noopener,noreferrer');
    setSent(true);
  };

  const handleShareFile = async () => {
    if (!pdf) return;
    const message = buildReceiptMessage(tx, coop, pdfUrl || undefined);
    const ok = await shareReceiptFile(pdf.blob, pdf.fileName, message);
    if (ok) setSent(true);
  };

  const handleDownload = () => {
    if (pdf) downloadReceiptPdf(pdf.blob, pdf.fileName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-sans text-slate-800 animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 leading-none">Transaksi Berhasil</h3>
              <span className="text-[10px] font-semibold text-slate-400">{receiptNumber(tx)}</span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Receipt preview */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs font-semibold text-slate-700">
            <div className="text-center border-b border-slate-200 pb-2 mb-2">
              <p className="font-semibold text-slate-900 flex items-center justify-center gap-1.5">
                <Store className="h-3.5 w-3.5 text-brand-navy" />
                {(coop?.name || 'Koperasi Desa')}
              </p>
              {coop?.city && <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{coop.city}{coop.province ? `, ${coop.province}` : ''}</p>}
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {tx.items.map((it, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <span className="truncate">
                    {it.commodity_name}
                    <span className="text-slate-400 font-semibold"> · {it.quantity.toLocaleString('id-ID')} {it.unit} × {rupiah(it.price_per_kg)}</span>
                  </span>
                  <span className="font-semibold text-slate-800 shrink-0">{rupiah(it.quantity * it.price_per_kg)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center border-t border-slate-200 mt-2 pt-2">
              <span className="text-[10px] font-semibold uppercase text-slate-400">Total ({tx.payment_method})</span>
              <span className="text-base font-semibold text-brand-navy">{rupiah(tx.total_amount)}</span>
            </div>
            {tx.payment_method === 'Tunai' && typeof tx.amount_paid === 'number' && (
              <div className="flex justify-between text-[10px] font-semibold text-slate-500 mt-1">
                <span>Tunai {rupiah(tx.amount_paid)}</span>
                <span>Kembali {rupiah(tx.change || 0)}</span>
              </div>
            )}
          </div>

          {/* Buyer / delivery target */}
          <div className="rounded-xl bg-white border border-slate-200 p-3 text-xs">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Kirim struk ke</span>
            {hasNumber ? (
              <p className="font-semibold text-slate-800">
                {tx.customer_name ? `${tx.customer_name} · ` : ''}
                <span className="text-brand-navy">{formatWhatsappDisplay(tx.customer_wa)}</span>
              </p>
            ) : (
              <p className="font-semibold text-slate-500">
                Nomor WhatsApp tidak diisi — Anda tetap bisa memilih kontak tujuan di WhatsApp, membagikan file, atau mengunduh PDF.
              </p>
            )}

            {uploading && (
              <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Menyiapkan tautan PDF struk...
              </p>
            )}
            {!uploading && pdfUrl && (
              <p className="mt-2 text-[10px] font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3" /> Tautan PDF siap dilampirkan ke pesan.
              </p>
            )}
            {!uploading && uploadFailed && (
              <p className="mt-2 text-[10px] font-semibold text-amber-600">
                Tautan PDF gagal dibuat (offline / storage). Pesan WhatsApp tetap terkirim tanpa tautan &mdash; gunakan tombol Bagikan File atau Unduh PDF.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-slate-100 space-y-2 shrink-0">
          <Button
            onClick={handleSendWhatsapp}
            disabled={!pdf || uploading}
            className="w-full bg-[#25D366] hover:bg-[#1ebe5b] text-white font-semibold rounded-xl h-11 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <WhatsappIcon className="h-5 w-5" />
            {sent ? 'Kirim Ulang via WhatsApp' : 'Kirim Struk via WhatsApp'}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            {canShare && (
              <Button
                onClick={handleShareFile}
                variant="outline"
                disabled={!pdf}
                className="rounded-xl h-10 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Share2 className="h-4 w-4" /> Bagikan File
              </Button>
            )}
            <Button
              onClick={handleDownload}
              variant="outline"
              disabled={!pdf}
              className={`rounded-xl h-10 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${canShare ? '' : 'col-span-2'}`}
            >
              <Download className="h-4 w-4" /> Unduh PDF
            </Button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 py-2 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5" /> Selesai &amp; Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}
