import { type MessageNotice, defaultMessageNotices } from '@/lib/messageNotice';

import { useTranslation } from '@/components/i18n/Translator';

export default function Notice({ notice }: { notice: MessageNotice }) {
  const { i18n } = useTranslation();
  return (
    <div
      role="status"
      aria-atomic="true"
      className="message-content w-full flex flex-col gap-2"
    >
      <div className="prose lg:prose-xl">
        <div
          className="leading-7 break-words"
          style={{
            lineHeight: '28px',
            color: 'inherit',
            fontStyle: 'inherit',
            fontSize: 'inherit'
          }}
        >
          {i18n.t(`notices.${notice}`, {
            defaultValue: defaultMessageNotices[notice]
          })}
        </div>
      </div>
    </div>
  );
}
