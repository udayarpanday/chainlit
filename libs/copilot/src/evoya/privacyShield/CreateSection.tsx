import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';
import { Card } from '@chainlit/app/src/components/ui/card';
import { Input } from '@chainlit/app/src/components/ui/input';
import { Label } from '@chainlit/app/src/components/ui/label';

import { TextSection } from '../types';
import { getPrivacyCategoryLabel, privacySectionTypes } from './categories';

type Props = {
  textSelection: string;
  editSection: TextSection | null;
  open: boolean;
  showTextField: boolean;
  closeDialog: () => void;
  createSection: (type: string, text: string | null) => void;
};

const CreateSection = ({
  open,
  closeDialog,
  createSection,
  showTextField,
  editSection,
  textSelection
}: Props) => {
  const { t } = useTranslation();
  const [sectionType, setSectionType] = useState<string>(
    editSection?.type ?? 'other'
  );
  const [sectionText, setSectionText] = useState<string>('');

  // Retain an older category when editing an existing conversation.
  const options = Array.from(
    new Set<string>([
      ...privacySectionTypes,
      ...(editSection?.type ? [editSection.type] : [])
    ])
  );

  useEffect(() => {
    if (open) {
      setSectionType(editSection?.type ?? 'other');
      setSectionText('');
    }
  }, [open, editSection]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4 z-[999]">
      <Card className="w-full max-w-md bg-background p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">
          {editSection ? (
            <Translator path="components.organisms.privacyShield.createSection.title.edit" />
          ) : (
            <Translator path="components.organisms.privacyShield.createSection.title.create" />
          )}
        </h2>
        <div className="space-y-4">
          <Label htmlFor="privacy-text">
            <Translator path="components.organisms.privacyShield.createSection.textfield.label" />
          </Label>
          {showTextField ? (
            <Input
              id="privacy-text"
              value={sectionText}
              onChange={(e) => setSectionText(e.target.value)}
            />
          ) : (
            <Input
              id="privacy-text"
              value={editSection ? editSection.string : textSelection}
              disabled
            />
          )}
          <Label htmlFor="privacy-type">
            <Translator path="components.organisms.privacyShield.createSection.typefield.label" />
          </Label>
          <select
            id="privacy-type"
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={sectionType}
            onChange={(e) => setSectionType(e.target.value)}
          >
            {options.map((type) => (
              <option key={type} value={type}>
                {getPrivacyCategoryLabel(type, t)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={closeDialog}>
            <Translator path="components.organisms.privacyShield.createSection.actions.close" />
          </Button>
          <Button
            disabled={showTextField && !sectionText.trim()}
            onClick={() => {
              createSection(sectionType, showTextField ? sectionText : null);
              setSectionText('');
            }}
          >
            {editSection ? (
              <Translator path="components.organisms.privacyShield.createSection.actions.save" />
            ) : (
              <Translator path="components.organisms.privacyShield.createSection.actions.create" />
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CreateSection;
