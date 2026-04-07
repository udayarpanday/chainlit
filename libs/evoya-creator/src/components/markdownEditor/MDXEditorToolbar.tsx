import {
  Separator,
  UndoRedo,
  CreateLink,
  ListsToggle,
  BoldItalicUnderlineToggles,
  // StrikeThroughSupSubToggles,
  CodeToggle,
  BlockTypeSelect,
  InsertTable,
  InsertCodeBlock,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  InsertImage,
  DiffSourceToggleWrapper,
} from '@mdxeditor/editor';

import {
  SelectDocument,
  ExportContent,
  ResetDocument,
  SetDiffSource,
} from './plugins/toolbar/components';

export default function MDXEditorToolbar({ setMdDiffContent }: { setMdDiffContent: (md: string) => void }) {
  return (
    <DiffSourceToggleWrapper>
      <ConditionalContents
        options={[
          { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
          {
            fallback: () => (
              <>
                  <ResetDocument />
                  <UndoRedo />
                  <Separator />
                  <BoldItalicUnderlineToggles />
                  <CodeToggle />
                  <Separator />
                  {/* <StrikeThroughSupSubToggles /> */}
                  {/* <Separator /> */}
                  <ListsToggle />
                  <Separator />
                  <BlockTypeSelect />
                  <Separator />
                  <CreateLink />
                  <Separator />
                  <InsertImage />
                  <Separator />
                  <InsertTable />
                  <Separator />
                  <InsertCodeBlock />
                  <Separator />
                  <SelectDocument />
                  <Separator />
                  <ExportContent />
                  <Separator />
                  <SetDiffSource setMdDiffContent={setMdDiffContent} />
                  <Separator />
              </>
            )
          }
        ]}
      />
    </DiffSourceToggleWrapper>
  )
}