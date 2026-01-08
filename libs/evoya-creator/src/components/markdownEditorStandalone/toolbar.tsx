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
      <ConditionalContents
        options={[
          { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
          {
            fallback: () => (
              <>
                  <BoldItalicUnderlineToggles />
                  <Separator />
                  {/* <StrikeThroughSupSubToggles /> */}
                  {/* <Separator /> */}
                  <ListsToggle />
                  <Separator />
                  <BlockTypeSelect />
              </>
            )
          }
        ]}
      />
    </DiffSourceToggleWrapper>
  )
}