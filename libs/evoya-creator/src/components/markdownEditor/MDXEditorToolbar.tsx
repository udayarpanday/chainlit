import {
  Separator,
  UndoRedo,
  CreateLink,
  ListsToggle,
  BoldItalicUnderlineToggles,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
} from '@mdxeditor/editor';

import {
  OpenFile,
  SaveContent,
  EvoyaDiffSourceToggleWrapper,
  EvoyaDropdown,
  EvoyaAdvanced,
  EvoyaAdvancedToggle,
  EvoyaBlockTypeSelect,
} from './plugins/toolbar/components';

export default function MDXEditorToolbar({ setMdDiffContent }: { setMdDiffContent: (md: string) => void }) {
  return (
    <EvoyaDiffSourceToggleWrapper>
      <div style={{ flexGrow: 1 }} className="[&>div]:items-center">
        <ConditionalContents
          options={[
            { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
            {
              fallback: () => (
                <>
                  <UndoRedo />
                  <Separator />
                  <BoldItalicUnderlineToggles />
                  <Separator />
                  <ListsToggle options={['bullet', 'number']} />
                  <Separator />
                  <EvoyaBlockTypeSelect />
                  <Separator />
                  <CreateLink />
                  <Separator />
                  <EvoyaAdvanced />
                  <EvoyaDropdown setMdDiffContent={setMdDiffContent} />
                  <SaveContent />
                  <OpenFile />
                  <div style={{ flexGrow: 1 }}></div>
                  <EvoyaAdvancedToggle />
                </>
              )
            }
          ]}
        />
      </div>
    </EvoyaDiffSourceToggleWrapper>
  )
}