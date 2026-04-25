import { useCallback, useRef, useState } from 'react';
import { useAppStore } from '../../stores/appStore';

type Props = {
  onImage: (file: File, onProgress?: (pct: number) => void) => Promise<void> | void;
  onFile?: (file: File, onProgress?: (pct: number) => void) => Promise<void> | void;
};

function detectSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS = /iP(ad|hone|od)/.test(ua);
  const webkitNoChromium = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS|EdgiOS/.test(ua);
  return iOS || webkitNoChromium;
}

export default function ImageDrop({ onImage, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [safariWarning, setSafariWarning] = useState(false);
  const isSafari = detectSafari();
  const plan = useAppStore((s) => s.plan);
  const pushToast = useAppStore((s) => s.pushToast);
  const openUpgrade = useAppStore((s) => s.openUpgrade);

  const handleNonImageFile = useCallback(
    async (file: File) => {
      if (plan !== 'pro' || !onFile) {
        pushToast({
          kind: 'warning',
          title: 'File sharing is a Pro feature',
          body: 'Upgrade to send PDFs, ZIPs and more.',
        });
        openUpgrade('file_upload');
        return;
      }
      setError(null);
      setProgress(0);
      try {
        await onFile(file, setProgress);
      } catch (err) {
        setError(
          err instanceof Error && err.message === 'FILE_TOO_LARGE'
            ? 'That file is over the 50MB cap.'
            : 'Upload failed. Try again.'
        );
      } finally {
        setProgress(null);
      }
    },
    [plan, onFile, pushToast, openUpgrade]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setProgress(0);
      try {
        await onImage(file, setProgress);
      } catch (err) {
        setError(err instanceof Error && err.message === 'FILE_TOO_LARGE'
          ? 'That image is over the 10MB free cap.'
          : 'Upload failed. Try again.');
      } finally {
        setProgress(null);
      }
    },
    [onImage]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;
      const image = files.find((f) => f.type.startsWith('image/'));
      if (image) {
        await handleFile(image);
        return;
      }
      // Non-image drop → either gate (free) or actually upload (Pro).
      await handleNonImageFile(files[0]);
    },
    [handleFile, handleNonImageFile]
  );

  const handlePickClick = useCallback(async () => {
    // On iOS Safari, try reading clipboard first — if blocked, surface the fallback.
    if (isSafari && 'clipboard' in navigator && 'read' in navigator.clipboard) {
      try {
        const items = await (navigator.clipboard as Clipboard).read();
        for (const item of items) {
          const type = item.types.find((t) => t.startsWith('image/'));
          if (type) {
            const blob = await item.getType(type);
            await handleFile(new File([blob], 'paste.png', { type }));
            return;
          }
        }
      } catch (err) {
        const name = (err as { name?: string })?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setSafariWarning(true);
          inputRef.current?.click();
          return;
        }
      }
    }
    inputRef.current?.click();
  }, [handleFile, isSafari]);

  if (safariWarning) {
    return (
      <div
        className="rounded-card p-4"
        style={{
          background: 'var(--amber-light)',
          border: '0.5px solid var(--amber-border)',
          color: 'var(--amber-text)',
        }}
      >
        <p className="text-sm">
          Safari can't access your clipboard images. Use the button below to pick from your camera
          roll or files instead.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 rounded-btn px-4 py-[7px] text-sm font-medium text-white"
          style={{ background: '#3B6D11' }}
        >
          Choose from photos or files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={handlePickClick}
      className="cursor-pointer rounded-card p-5 text-center transition-colors"
      style={{
        background: dragOver ? 'var(--green-light)' : 'var(--bg-surface)',
        border: `0.5px dashed ${dragOver ? 'var(--green-primary)' : 'var(--border-default)'}`,
        color: 'var(--text-secondary)',
      }}
    >
      {progress !== null ? (
        <div>
          <div className="text-sm">Uploading… {progress}%</div>
          <div
            className="mt-2 h-1 w-full overflow-hidden rounded-full"
            style={{ background: 'var(--bg-raised)' }}
          >
            <div
              className="h-full transition-all"
              style={{ width: `${progress}%`, background: '#3B6D11' }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm">Drop an image or click to browse</div>
          <div className="mt-1 text-xs text-text-tertiary">PNG, JPG, WebP, GIF · up to 10MB</div>
        </>
      )}
      {error && <div className="mt-2 text-xs" style={{ color: 'var(--red-text)' }}>{error}</div>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
