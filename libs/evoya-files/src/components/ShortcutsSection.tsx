import { Files, FolderOpen, Images } from 'lucide-react';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';

import type { ShortcutKey } from '../types';

type Props = {
  onOpen: (shortcut: ShortcutKey) => void;
};

const shortcuts = [
  { key: 'generated', icon: Files },
  { key: 'images', icon: Images },
  { key: 'projects', icon: FolderOpen }
] as const;

export default function ShortcutsSection({ onOpen }: Props) {
  return (
    <section className="mt-6 flex-shrink-0" aria-labelledby="shortcuts-title">
      <h2 id="shortcuts-title" className="mb-2 text-base font-semibold">
        <Translator path="evoyaFiles.shortcuts.title" />
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {shortcuts.map(({ key, icon: Icon }) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            className="h-auto min-h-24 justify-start rounded-xl bg-white p-4 text-left hover:bg-gray-50"
            onClick={() => onOpen(key)}
          >
            <span className="mr-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block font-semibold">
                <Translator path={`evoyaFiles.shortcuts.${key}.title`} />
              </span>
              <span className="mt-1 block whitespace-normal text-xs font-normal text-gray-500">
                <Translator path={`evoyaFiles.shortcuts.${key}.description`} />
              </span>
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
