
import { Translator } from '@/components/i18n';

export default function TemporaryChatNotice() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Translator path="chat.temporary.footer" />
    </div>
  );
}
