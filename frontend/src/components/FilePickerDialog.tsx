import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Translator } from '@/components/i18n';
import { Button } from './ui/button';
import FilePicker from '@evoya/file-picker/src/components/FilePicker';
import { EvoyaFile } from '@evoya/file-picker/src/types';

interface Props {
  open: boolean;
  setOpen: (val: boolean) => void;
  selectFile: (val: EvoyaFile) => void
}

const FilePickerDialog = ({ open, setOpen, selectFile }: Props): JSX.Element => {
  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent className="z-[9999] max-w-screen-sm">
        <DialogHeader>
          <DialogTitle>
            <Translator path="evoyaFiles.actions.open.title" />
          </DialogTitle>
        </DialogHeader>
        <div>
          <FilePicker 
            initialPath='/'
            handleItemClick={(item) => selectFile(item)}
            singleMode
          />
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            <Translator path="common.actions.cancel" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { FilePickerDialog };
