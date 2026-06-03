import { useCellValue, usePublisher } from '@mdxeditor/gurx';
import React from 'react';
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';
import {
  iconComponentFor$,
  ToggleSingleGroupWithItem,
} from '@mdxeditor/editor';

import { evoyaAutoApprove$ } from '../../evoyaAi';

export const AutoApproveToggle: React.FC = () => {
  const evoyaAutoApprove = useCellValue(evoyaAutoApprove$);
  const setEvoyaAutoApprove = usePublisher(evoyaAutoApprove$);
  const iconComponentFor = useCellValue(iconComponentFor$);

  return (
    <div className={styles.toolbarGroupOfGroups}>
      <ToggleSingleGroupWithItem
        title={evoyaAutoApprove ? 'Disable Auto Approve' : 'Enable Auto Approve'}
        on={evoyaAutoApprove}
        onValueChange={(value: string) => setEvoyaAutoApprove(value === 'on')}
      >
        {iconComponentFor('check')}
      </ToggleSingleGroupWithItem>
    </div>
  );
}