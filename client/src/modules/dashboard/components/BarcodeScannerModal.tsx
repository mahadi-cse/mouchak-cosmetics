'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Theme } from '@/modules/dashboard/utils/theme';

interface BarcodeScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export default function BarcodeScannerModal({ open, onClose, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'error' | 'permission-denied'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const startedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
      } catch { /* ignore */ }
      try { scannerRef.current.clear(); } catch { /* ignore */ }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (!containerRef.current || startedRef.current) return;
    startedRef.current = true;

    try {
      setStatus('scanning');
      setErrorMsg('');
      const html5Qrcode = new Html5Qrcode('pos-barcode-reader');
      scannerRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 160 }, aspectRatio: 1.5 },
        (decodedText) => { onScan(decodedText); stopScanner(); onClose(); },
        () => {}
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const isPermission = message.includes('Permission') || message.includes('permission') || (err as any)?.name === 'NotAllowedError';
      if (isPermission) {
        setStatus('permission-denied');
        setErrorMsg('Camera access denied. Please allow camera permissions in your browser settings.');
      } else {
        setStatus('error');
        setErrorMsg(message || 'Failed to start camera.');
      }
    }
  }, [onScan, stopScanner, onClose]);

  useEffect(() => {
    if (open) {
      startedRef.current = false;
      setStatus('idle');
      setErrorMsg('');
      const timer = setTimeout(() => startScanner(), 100);
      return () => clearTimeout(timer);
    } else {
      startedRef.current = false;
      stopScanner();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { stopScanner(); }, [stopScanner]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col bg-black" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 bg-black text-white shrink-0">
        <div className="text-sm font-semibold">Scan Product Barcode</div>
        <button onClick={() => { stopScanner(); onClose(); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white text-lg font-bold">✕</button>
      </div>

      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
        <div ref={containerRef} id="pos-barcode-reader" className="w-full h-full" style={{ minHeight: '300px' }} />

        {status === 'scanning' && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-[280px] h-[160px] rounded-xl border-2" style={{ borderColor: Theme.primary }} />
            <div className="mt-4 text-xs text-white/70 text-center px-8">Position barcode within the frame</div>
          </div>
        )}

        {status === 'permission-denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-8">
            <div className="text-5xl mb-4">📷</div>
            <div className="text-white font-semibold text-base mb-2">Camera Permission Required</div>
            <div className="text-white/60 text-xs text-center max-w-[300px]">{errorMsg}</div>
            <button onClick={() => { stopScanner(); onClose(); }} className="mt-6 px-6 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: Theme.primary }}>Close</button>
          </div>
        )}

        {status === 'error' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 px-8">
            <div className="text-5xl mb-4">⚠️</div>
            <div className="text-white font-semibold text-base mb-2">Scanner Error</div>
            <div className="text-white/60 text-xs text-center max-w-[300px]">{errorMsg}</div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { stopScanner(); onClose(); }} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-white/10">Close</button>
              <button onClick={() => { startedRef.current = false; stopScanner().then(() => startScanner()); }} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: Theme.primary }}>Retry</button>
            </div>
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 py-3 bg-black flex items-center justify-between">
        <div className="text-xs text-white/50">Supports EAN, Code128, QR and more</div>
        <button onClick={() => { stopScanner(); onClose(); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-white/10">Cancel</button>
      </div>
    </div>
  );
}
