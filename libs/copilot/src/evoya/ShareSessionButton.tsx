import { WidgetContext } from '@/context';
import { Share2 } from 'lucide-react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdContentCopy } from 'react-icons/md';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@chainlit/app/src/components/ui/dialog';
import { Label } from '@chainlit/app/src/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';

import { EvoyaShareLink } from './types';

interface Props {
  sessionUuid: string;
}

interface SelectProps {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  label?: string;
  className?: string;
}

export const Select = ({
  value,
  onChange,
  options,
  label,
  className = '',
  ...props
}: SelectProps) => {
  const selectRef = useRef<HTMLSelectElement>(null);

  const handleIconClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
      // Try to open the dropdown using showPicker if available (modern browsers)
      if ('showPicker' in selectRef.current) {
        (
          selectRef.current as HTMLSelectElement & { showPicker: () => void }
        ).showPicker();
      } else {
        // Fallback: simulate a click event
        selectRef.current.click();
      }
    }
  };
  return (
    <div className={`relative ${className}`}>
      <select
        ref={selectRef}
        value={value}
        onChange={onChange}
        className={`w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background 
        placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
        disabled:cursor-not-allowed disabled:opacity-50 appearance-none`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            <Translator path={option.label} />
          </option>
        ))}
      </select>
      <div
        onClick={handleIconClick}
        className="absolute right-5 top-2 h-4 w-4 cursor-pointer"
      >
        <ChevronDown className="opacity-50" />
      </div>
    </div>
  );
};

export default function ShareSessionButton({ sessionUuid }: Props) {
  const { t } = useTranslation();
  const [expireTime, setExpireTime] = useState(0); // 0=never, 7=7days, 31=31days
  const [allowOngoingAccess, setAllowOngoingAccess] = useState(false);
  const [shareLink, setShareLink] = useState<EvoyaShareLink>({});
  const [open, setOpen] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const { accessToken, evoya } = useContext(WidgetContext);

  const options = [
    { value: '0', label: 'components.molecules.shareSession.expire.no_expiry' },
    { value: '7', label: 'components.molecules.shareSession.expire.7days' },
    { value: '31', label: 'components.molecules.shareSession.expire.1month' }
  ];

  const handleClickOpen = async () => {
    setOpen(true);
    setIsLoading(true);
    if (evoya?.api) {
      try {
        const shareDataResponse = await fetch(
          evoya.api.share.check.replace('{{uuid}}', sessionUuid),
          {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            },
            credentials: 'same-origin'
          }
        );
        if (!shareDataResponse.ok) {
          throw new Error(shareDataResponse.statusText);
        }
        const shareData = await shareDataResponse.json();
        if (shareData.error) {
          setShareLink({});
        } else if (shareData.success) {
          let dateDiff = 0;
          if (shareData.data.expires_at) {
            const expiresAt = new Date(shareData.data.expires_at);
            dateDiff = Math.round(
              Math.abs(new Date().getTime() - expiresAt.getTime()) / 86400000
            );
          }
          const shareConfig: EvoyaShareLink = {
            expire: dateDiff,
            type: shareData.data.share_type,
            url: shareData.data.link
          };
          setShareLink(shareConfig);
        }
      } catch (_e) {
        // Error handling - could set error state if needed
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleRevokeShareLink = async (_shareLinkConfig: EvoyaShareLink) => {
    if (evoya?.api?.share && accessToken) {
      try {
        const shareResponse = await fetch(
          evoya.api.share.remove.replace('{{uuid}}', sessionUuid),
          {
            method: 'DELETE',
            headers: {
              Accept: 'application/json',
              'X-CSRFTOKEN': evoya.api.csrf_token
            },
            credentials: 'same-origin'
          }
        );
        if (!shareResponse.ok) {
          throw new Error(shareResponse.statusText);
        }
        await shareResponse.json();
        toast.success(
          <Translator path="components.molecules.shareSession.messages.successRemove" />
        );
        setShareLink({});
      } catch (e) {
        console.error(e);
        toast.error(
          <Translator path="components.molecules.shareSession.messages.error" />
        );
      }
    }
  };

  const handleCopyShareLink = async () => {
    const type = allowOngoingAccess ? 'DYNAMIC' : 'STATIC';
    const shareConfig: EvoyaShareLink = {
      expire: expireTime,
      type
    };
    if (evoya?.api?.share && accessToken) {
      setIsCreating(true);
      try {
        const shareResponse = await fetch(
          evoya.api.share.add.replace('{{uuid}}', sessionUuid),
          {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'X-CSRFTOKEN': evoya.api.csrf_token
            },
            body: JSON.stringify({
              ...(expireTime > 0 ? { expires_in: expireTime } : {}),
              share_type: type
            }),
            credentials: 'same-origin'
          }
        );

        if (!shareResponse.ok) {
          throw new Error(shareResponse.statusText);
        }
        const shareData = await shareResponse.json();

        if (shareData.success) {
          const shareUrl = shareData.data.link;

          await copyToClipboard(shareUrl);
          toast.success(
            <Translator path="components.molecules.shareSession.messages.success" />
          );
          shareConfig.url = shareUrl;
          setShareLink(shareConfig);
        } else {
          toast.error(
            <Translator path="components.molecules.shareSession.messages.error" />
          );
        }
      } catch (e) {
        console.error(e);
        toast.error(
          <Translator path="components.molecules.shareSession.messages.error" />
        );
      } finally {
        setIsCreating(false);
      }
    }
  };

  return (
    <div>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-block">
              <Button
                id="share-session-button"
                size="icon"
                variant="ghost"
                onClick={handleClickOpen}
                disabled={sessionUuid == ''}
              >
                <Share2
                  fill="#5c5c5c"
                  className="!size-5 "
                  strokeWidth={1.25}
                />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {sessionUuid === '' ? (
                <Translator path="components.molecules.shareSession.inactiveButton" />
              ) : (
                <Translator path="components.molecules.shareSession.openButton" />
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Dialog
        open={open}
        onOpenChange={handleClose}
        aria-labelledby="share-alert-dialog-title"
        aria-describedby="share-alert-dialog-description"
      >
        <DialogContent className="z-[9999] sm:max-w-[425px] lg:max-w-[960px]">
          <DialogHeader>
            <DialogTitle id="share-alert-dialog-title">
              <Translator path="components.molecules.shareSession.openButton" />
            </DialogTitle>
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="space-y-4 pb-3">
                <div className="flex items-center justify-between flex-wrap">
                  <div className="flex items-center gap-2">
                    <Translator path="components.molecules.shareSession.types.static" />
                    <Select
                      value={expireTime}
                      onChange={(e) => setExpireTime(parseInt(e.target.value))}
                      options={options}
                      label={t(
                        'components.molecules.shareSession.expire.expiresIn'
                      )}
                      className="w-[min(165px)]"
                    />
                  </div>
                  <Button
                    variant="default"
                    disabled={isCreating}
                    onClick={handleCopyShareLink}
                  >
                    {isCreating && <Loader2 className="animate-spin mr-2" />}
                    <Translator path="components.molecules.shareSession.copyCreateButton" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="allowOngoingAccess"
                    checked={allowOngoingAccess}
                    onChange={(e) => setAllowOngoingAccess(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary "
                  />
                  <Label htmlFor="allowOngoingAccess">
                    <Translator path="components.molecules.shareSession.types.dynamic" />
                  </Label>
                </div>
              </div>

              {shareLink.url && (
                <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="mb-2 text-sm text-gray-600">
                        <Translator path="components.molecules.shareSession.messages.created" />{' '}
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={shareLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                        >
                          {shareLink.url}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="px-2 h-8 w-8"
                          onClick={() => {
                            if (shareLink.url) copyToClipboard(shareLink.url);
                            toast.success(
                              <Translator path="components.molecules.shareSession.messages.success" />
                            );
                          }}
                        >
                          <MdContentCopy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4 px-3 py-1 text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => handleRevokeShareLink(shareLink)}
                    >
                      <Translator path="components.molecules.shareSession.revokeLinkButton" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
