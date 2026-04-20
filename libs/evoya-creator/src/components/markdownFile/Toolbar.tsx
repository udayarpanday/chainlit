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

export default function Toolbar() {
  return (
    <DiffSourceToggleWrapper>
      <div style={{ flexGrow: 1 }}>
        <ConditionalContents
          options={[
            { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
            {
              fallback: () => (
                <>
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
                </>
              )
            }
          ]}
        />
      </div>
    </DiffSourceToggleWrapper>
  )
}