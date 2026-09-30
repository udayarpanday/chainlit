import { AlertTriangle } from 'lucide-react';

import { Translator } from '@chainlit/app/src/components/i18n';

type Props = {
  action: 'move' | 'rename' | 'delete';
};

export default function DatasourceChangeWarning({ action }: Props) {
  return (
    <div
      className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="font-semibold">
          <Translator path="evoyaFiles.datasource.warning.title" />
        </p>
        <p className="mt-1">
          <Translator path={`evoyaFiles.datasource.warning.${action}`} />
        </p>
      </div>
    </div>
  );
}
