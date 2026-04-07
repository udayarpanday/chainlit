import { Switch } from '@/components/ui/switch';
import {
  evoyaDiffSourceEnabledState,
} from '@chainlit/react-client';
import { useRecoilState } from 'recoil';
import { cn } from '@/lib/utils';
import { Translator } from '@/components/i18n';
import { Label } from '@/components/ui/label';

interface Props {
  id?: string;
}

export default function({ id = "diff-toggle" }: Props) {
    const [isDiffSourceEnabled, setDiffSourceEnabled] = useRecoilState<boolean>(evoyaDiffSourceEnabledState);

    return (
        <div className="flex items-center pl-2">
            <Switch
                id={id}
                size="sm"
                checked={isDiffSourceEnabled}
                onCheckedChange={(checked) => {
                    setDiffSourceEnabled(checked);
                }}
                className={cn(
                    'data-[state=checked]:bg-primary'
                )}
            />
            <Label htmlFor={id} className="pl-2 text-xs">
                  <Translator path="components.molecules.evoyaDiff.showLabel" />
            </Label>
        </div>
    )
}