import React from 'react';
import { TableEditor as SourceTableEditor } from 'SourceTableEditor';
import {
  LexicalEditor,
} from 'lexical';
import * as Mdast from 'mdast';
import {
  TableNode,
  iconComponentFor$,
  useTranslation,
} from '@mdxeditor/editor';
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';
import { useCellValues, usePublisher } from '@mdxeditor/gurx';
import classNames from 'classnames';

import { setNodeSelection$ } from '../../evoyaAi';

interface TableEditorProps {
  parentEditor: LexicalEditor
  lexicalTable: TableNode
  mdastNode: Mdast.Table
}

export const TableEditorWrapper: React.FC<TableEditorProps> = ({ parentEditor, lexicalTable, mdastNode}) => {
  return (
    <div className="evoya-table-wrapper">
      <TableSelector parentEditor={parentEditor} lexicalTable={lexicalTable} />
      <SourceTableEditor parentEditor={parentEditor} lexicalTable={lexicalTable} mdastNode={mdastNode} />
    </div>
  )
}

interface TableSelectorProps {
  parentEditor: LexicalEditor
  lexicalTable: TableNode
}

const TableSelector: React.FC<TableSelectorProps> = ({
  parentEditor,
  lexicalTable,
}) => {
  const [iconComponentFor] = useCellValues(iconComponentFor$);
  const setNodeSelection = usePublisher(setNodeSelection$);
  const t = useTranslation();

  return (
    <button type="button" className={classNames(styles.iconButton, 'table-select-btn')} onClick={() => setNodeSelection(lexicalTable)}>
      {/* <EvoyaLogo /> */}
      {iconComponentFor('handPointer')}
    </button>
  )
}

export {
  TableEditorWrapper as TableEditor
}