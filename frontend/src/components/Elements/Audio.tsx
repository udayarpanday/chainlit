import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

import { IAudioElement } from '@chainlit/react-client';

const AudioElement = ({ element }: { element: IAudioElement }) => {
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!element.url) return;

    const fetchAudio = async () => {
      const token = localStorage.getItem('chainlit_token');
      const headers: Record<string, string> = {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      try {
        const res = await fetch(element.url, {
          headers,
          credentials: 'include',
          mode: 'cors'
        });

        if (!res.ok) throw new Error('Failed to fetch audio');

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setAudioSrc(url);

        return () => URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
      }
    };

    fetchAudio();
  }, [element.url]);

  if (!audioSrc) return null;

  return (
    <div className={cn('space-y-2', `${element.display}-audio`)}>
      <p className="text-sm leading-7 text-muted-foreground">{element.name}</p>
      <audio controls src={audioSrc} autoPlay={element.autoPlay} />
    </div>
  );
};

export { AudioElement };
