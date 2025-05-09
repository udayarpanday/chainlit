import { Eye, EyeOff, Lock, LockOpen } from 'lucide-react';
import { useState } from 'react';
import { useMediaQuery } from 'react-responsive';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';

import { usePrivacyShield } from './usePrivacyShield';

const PrivacyShieldToggle = (): JSX.Element => {
  const { enabled, setEnabled, enabledVisual, setEnabledVisual, sections } =
    usePrivacyShield();
  
  return (
    <div className="flex items-center -ml-2">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipContent className="w-[350px]">
            <Translator path="components.organisms.privacyShield.info" />
          </TooltipContent>
          <TooltipTrigger asChild>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEnabled(!enabled)}
              >
                {enabled ? (
                  <Lock className="!size-5 text-primary" />
                ) : (
                  <LockOpen className="!size-5" />
                )}
              </Button>
              {/* <Switch
                    checked={enabled ?? false}
                    onCheckedChange={(e) => setEnabled(e)}
                    name="privacy_shield"
                  />
                  <Label htmlFor="privacy_shield">Privacy Shield</Label> */}
            </div>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipContent>
            {enabledVisual ? (
              <Translator path="components.organisms.privacyShield.hidePrivacyTable" />
            ) : (
              <Translator path="components.organisms.privacyShield.showPrivacyTable" />
            )}
          </TooltipContent>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEnabledVisual(!enabledVisual)}
              disabled={sections.length === 0}
            >
              {enabled &&
                (enabledVisual ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                ))}
            </Button>
          </TooltipTrigger>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default PrivacyShieldToggle;
