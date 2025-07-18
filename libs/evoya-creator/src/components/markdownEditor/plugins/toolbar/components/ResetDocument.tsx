import {
  ButtonWithTooltip,
  editorRootElementRef$,
  iconComponentFor$,
  useTranslation
} from '@mdxeditor/editor';
import { useCellValue, usePublisher } from '@mdxeditor/gurx';
import * as Dialog from '@radix-ui/react-dialog';
import classNames from 'classnames';
import React, { useState } from 'react';

import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';

import { resetDocument$ } from '../../evoyaAi';

const ResetModal = ({ show, setShow }) => {
  const editorRootElementRef = useCellValue(editorRootElementRef$);
  const resetDocument = usePublisher(resetDocument$);
  const t = useTranslation();

  return (
    <Dialog.Root open={show} onOpenChange={(open) => setShow(open)}>
      <Dialog.Portal container={editorRootElementRef?.current}>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content
          className={styles.dialogContent}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-dialog-title"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="math-dialog-content">
            <Dialog.Title id="reset-dialog-title">
              {t('dialogControls.deleteTitle', 'Are you sure?')}
            </Dialog.Title>
            <p>
              {t(
                'dialogControls.deleteInfo',
                'This will erase the current document and cannot be undone. Please confirm to proceed.'
              )}
            </p>
            <div className="d-flex gap-2">
              <button
                type="button"
                title={t('dialogControls.confirm', 'Confirm')}
                aria-label={t('dialogControls.confirm', 'Confirm')}
                className={classNames(styles.primaryButton)}
                onClick={() => {
                  resetDocument();
                  setShow(false);
                }}
              >
                {t('dialogControls.confirm', 'Confirm')}
              </button>

              <Dialog.Close asChild>
                <button
                  type="button"
                  title={t('dialogControls.cancel', 'Cancel')}
                  aria-label={t('dialogControls.cancel', 'Cancel')}
                  className={classNames(styles.secondaryButton)}
                >
                  {t('dialogControls.cancel', 'Cancel')}
                </button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export const ResetDocument: React.FC = () => {
  const t = useTranslation();
  const iconComponentFor = useCellValue(iconComponentFor$);
  const [show, setShow] = useState(false);

  return (
    <>
      <ButtonWithTooltip
        title={t('toolbar.resetDocument', 'Start new document')}
        onClick={() => setShow(true)}
      >
        {iconComponentFor('filePlus')}
      </ButtonWithTooltip>
      <ResetModal show={show} setShow={setShow} />
    </>
  );
};
