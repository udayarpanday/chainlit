import {
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  ConditionalContents,
  CreateLink,
  ListsToggle,
  Separator,
  UndoRedo
} from '@mdxeditor/editor';

import { AutoApproveToggle } from './plugins/toolbar/components/AutoApproveToggle';

import {
  EvoyaAdvanced,
  EvoyaAdvancedToggle,
  EvoyaBlockTypeSelect,
  EvoyaDiffSourceToggleWrapper,
  EvoyaDropdown,
  OpenFile,
  PasteSanitizerToggle,
  SaveContent
} from './plugins/toolbar/components';

export default function MDXEditorToolbar({
  setMdDiffContent
}: {
  setMdDiffContent: (md: string) => void;
}) {
  return (
    <EvoyaDiffSourceToggleWrapper>
      <div style={{ flexGrow: 1 }} className="[&>div]:items-center">
        <ConditionalContents
          options={[
            {
              when: (editor) => editor?.editorType === 'codeblock',
              contents: () => <ChangeCodeMirrorLanguage />
            },
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
                  <Separator />
                  <PasteSanitizerToggle />
                  <Separator />
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
  );
}
