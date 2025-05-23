import * as Dialog from '@radix-ui/react-dialog';
import classNames from 'classnames';

import {
  realmPlugin,
  addLexicalNode$,
  addActivePlugin$,
  addImportVisitor$,
  addExportVisitor$,
  LexicalExportVisitor,
  addMdastExtension$,
  addToMarkdownExtension$,
  addSyntaxExtension$,
  MdastImportVisitor,
  iconComponentFor$,
  addComposerChild$,
  activeEditor$,
  editorRootElementRef$,
  useTranslation,
} from "@mdxeditor/editor";

import {
  DecoratorNode,
  NodeKey,
  DOMExportOutput,
  Spread,
  SerializedLexicalNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  $getNodeByKey,
} from "lexical";

import {
  mathFromMarkdown,
  mathToMarkdown,
  InlineMath,
  Math
} from 'mdast-util-math';

import {
  math
} from 'micromark-extension-math';

import {
  renderToString
} from "katex";

import {
  useCellValue,
  useCellValues,
  usePublisher,
  Cell,
  Signal,
  withLatestFrom,
} from '@mdxeditor/gurx';

import { useCallback, useEffect, useMemo, useState } from "react";

import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';

export const updateMathFormula$ = Signal<string | null>();

export const editMathFormula$ = Cell<{nodeKey: string, mathFormula: string} | null>(null);

export const EvoyaMathDialog: React.FC = () => {
  const [editorRootElementRef, showEditMath] = useCellValues(
    editorRootElementRef$,
    editMathFormula$
  );
  const setShowEditMath = usePublisher(editMathFormula$);
  const updateMathFormula = usePublisher(updateMathFormula$);
  // const showEditMath = useCellValue(editMathFormula$);
  const t = useTranslation();

  const [mathFormula, setMathFormula] = useState<string>(showEditMath?.mathFormula ?? '');

  const submitFormula = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    updateMathFormula(mathFormula);
  }, [mathFormula, updateMathFormula]);

  useEffect(() => {
    setMathFormula(showEditMath?.mathFormula ?? '');
  }, [showEditMath]);

  const formulaHtml = useMemo(() => {
    try {
      const output = renderToString(mathFormula, {
        throwOnError: false,
        output: "mathml",
      });
      return output;
    } catch(e) {
      return '';
    }
  }, [mathFormula]);

  if (!showEditMath) return null;

  return (
    <Dialog.Root
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          setShowEditMath(null);
        }
      }}
    >
      <Dialog.Portal container={editorRootElementRef?.current}>
        <Dialog.Overlay className={styles.dialogOverlay} />
        <Dialog.Content
          className={styles.dialogContent}
          onOpenAutoFocus={(e) => {
            e.preventDefault()
          }}
        >
          <div className="math-dialog-content">
            <Dialog.Title>{t('mathFormula.dialogTitle', 'Edit Equation')}</Dialog.Title>
            <form
              onSubmit={submitFormula}
              className={styles.multiFieldForm}
            >
              <div className={styles.formField}>
                <label htmlFor="mathformula">{t('mathFormula.formula', 'Equation')}</label>
                <textarea rows={4} id="mathformula" name="mathformula" className={styles.textInput} value={mathFormula} onChange={(e) => setMathFormula(e.target.value)} />
              </div>

            <div className="math-preview">
              {formulaHtml && <span dangerouslySetInnerHTML={{__html: formulaHtml}} />}
            </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)' }}>
                <button
                  type="submit"
                  title={t('dialogControls.save', 'Save')}
                  aria-label={t('dialogControls.save', 'Save')}
                  className={classNames(styles.primaryButton)}
                >
                  {t('dialogControls.save', 'Save')}
                </button>
                <Dialog.Close asChild>
                  <button
                    type="reset"
                    title={t('dialogControls.cancel', 'Cancel')}
                    aria-label={t('dialogControls.cancel', 'Cancel')}
                    className={classNames(styles.secondaryButton)}
                  >
                    {t('dialogControls.cancel', 'Cancel')}
                  </button>
                </Dialog.Close>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export const evoyaMathDialogPlugin = realmPlugin({
  init: (realm) => {
    realm.pubIn({
      [addActivePlugin$]: 'evoyaMathDialog',
      [addComposerChild$]: EvoyaMathDialog,
    });

    realm.sub(realm.pipe(updateMathFormula$, withLatestFrom(activeEditor$, editMathFormula$)), ([payload, activeEditor, mathFormulaState]) => {
      if (mathFormulaState && activeEditor && payload) {
        activeEditor?.update(() => {
          const mathNode = $getNodeByKey(mathFormulaState.nodeKey);
          console.log(mathNode);
          if (mathNode) {
            mathNode.setMathString(payload);
          }
        });
      }
      realm.pub(editMathFormula$, null);
    });
  }
});