import { LoaderCircle } from 'lucide-react';
import type { CSSProperties } from 'react';

export default function PreviewLoading({
  label,
  style
}: {
  label: string;
  style?: CSSProperties;
}) {
  return (
    <div
      role="status"
      className="text-sm text-foreground"
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 24,
        boxSizing: 'border-box',
        textAlign: 'center',
        ...style
      }}
    >
      <LoaderCircle
        className="size-4 animate-spin"
        style={{ flexShrink: 0 }}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
