import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCellValues, usePublisher } from '@mdxeditor/gurx';
import classNames from 'classnames';
import { $getNodeByKey } from 'lexical';
import React from 'react';
import {
  disableImageSettingsButton$,
  openEditImageDialog$,
  iconComponentFor$,
  readOnly$,
  useTranslation,
} from "@mdxeditor/editor";
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';
import { setNodeSelectionByKey$ } from '../evoyaAi';

export interface EditImageToolbarProps {
  nodeKey: string
  imageSource: string
  initialImagePath: string | null
  title: string
  alt: string
}

export function EditImageToolbar({ nodeKey, imageSource, initialImagePath, title, alt }: EditImageToolbarProps): JSX.Element {
  const [disableImageSettingsButton, iconComponentFor, readOnly] = useCellValues(disableImageSettingsButton$, iconComponentFor$, readOnly$);
  const [editor] = useLexicalComposerContext();
  const openEditImageDialog = usePublisher(openEditImageDialog$);
  const setNodeSelectionByKey = usePublisher(setNodeSelectionByKey$);
  const t = useTranslation();

  return (
    <div className={styles.editImageToolbar}>
      <button
        className={styles.iconButton}
        type="button"
        title={t('imageEditor.selectImage', 'Select image')}
        disabled={readOnly}
        onClick={(e) => {
          e.preventDefault();
          setNodeSelectionByKey(nodeKey);
        }}
      >
        {iconComponentFor('handPointer')}
      </button>
      <button
        className={styles.iconButton}
        type="button"
        title={t('imageEditor.deleteImage', 'Delete image')}
        disabled={readOnly}
        onClick={(e) => {
          e.preventDefault()
          editor.update(() => {
            $getNodeByKey(nodeKey)?.remove()
          })
        }}
      >
        {iconComponentFor('delete_small')}
      </button>
      {!disableImageSettingsButton && (
        <button
          type="button"
          className={classNames(styles.iconButton, styles.editImageButton)}
          title={t('imageEditor.editImage', 'Edit image')}
          disabled={readOnly}
          onClick={() => {
            openEditImageDialog({
              nodeKey: nodeKey,
              initialValues: {
                src: !initialImagePath ? imageSource : initialImagePath,
                title,
                altText: alt
              }
            })
          }}
        >
          {iconComponentFor('settings')}
        </button>
      )}
    </div>
  )
}