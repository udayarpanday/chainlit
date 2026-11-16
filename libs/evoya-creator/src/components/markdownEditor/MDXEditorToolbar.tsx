import {
  Separator,
  UndoRedo,
  CreateLink,
  ListsToggle,
  BoldItalicUnderlineToggles,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  InsertFrontmatter,
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
import { AutoApproveToggle } from './plugins/toolbar/components/AutoApproveToggle';
import { CloseCreator } from './plugins/toolbar/components/CloseCreator';

export default function MDXEditorToolbar({ setMdDiffContent }: { setMdDiffContent: (md: string) => void }) {
  return (
    <>
    <div className="flex gap-1 items-start p-1 -ml-1 bg-white">
      <div className="[&_svg]:!size-5">
        <UndoRedo />
      </div>
      <EvoyaDropdown setMdDiffContent={setMdDiffContent} />
      <SaveContent />
      <OpenFile />
      <div style={{ flexGrow: 1 }}></div>
      <CloseCreator />
    </div>
    <div className="flex -ml-1 px-1 pb-1">
    <EvoyaDiffSourceToggleWrapper>
      <div style={{ flexGrow: 1 }} className="[&>div]:items-center">
        <ConditionalContents
          options={[
            { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
            {
              fallback: () => (
                <>
                  <BoldItalicUnderlineToggles />
                  <Separator />
                  <ListsToggle options={['bullet', 'number']} />
                  <Separator />
                  <EvoyaBlockTypeSelect />
                  <Separator />
                  <CreateLink />
                  <Separator />
                  <InsertFrontmatter />
                  <Separator />
                  <EvoyaAdvanced />
                  {/* <EvoyaDropdown setMdDiffContent={setMdDiffContent} />
                  <SaveContent />
                  <OpenFile />
                  <Separator /> */}
                  <AutoApproveToggle />
                  <div style={{ flexGrow: 1 }}></div>
                  <EvoyaAdvancedToggle />
                </>
              )
            }
          ]}
        />
      </div>
    </EvoyaDiffSourceToggleWrapper>
    </div>
    </>
  )
}