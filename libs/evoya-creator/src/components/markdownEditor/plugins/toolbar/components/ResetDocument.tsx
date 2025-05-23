import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
} from '@mdxeditor/editor';
import React from 'react';
import { useCellValue, usePublisher } from '@mdxeditor/gurx';
import {
  resetDocument$,
} from '../../evoyaAi';

// const selectDocument$ = Action((realm) => {
//   realm.sub(realm.pipe(selectDocument$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
//     activeEditor?.update(() => {
//       $selectAll();
//     });
//   });
// });

/**
 * A toolbar button that allows the user to insert a table.
 * For this button to work, you need to have the `tablePlugin` plugin enabled.
 * @group Toolbar Components
 */
export const ResetDocument: React.FC = () => {
  const iconComponentFor = useCellValue(iconComponentFor$);
  const resetDocument = usePublisher(resetDocument$);
  const t = useTranslation();

  return (
    <ButtonWithTooltip
      title={t('toolbar.resetDocument', 'Start new document')}
      onClick={() => {
        resetDocument();
      }}
    >
      {iconComponentFor('filePlus')}
    </ButtonWithTooltip>
  );
}