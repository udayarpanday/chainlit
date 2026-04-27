import { WidgetContext } from '@/context';
import { cn } from '@chainlit/app/src/lib/utils';
import {
  Building2,
  ChevronDown,
  Globe,
  Link2,
  Loader2,
  Share
} from 'lucide-react';
import { useContext, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@chainlit/app/src/components/ui/dialog';
import { Switch } from '@chainlit/app/src/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';

import { EvoyaShareLink } from './types';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';

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
  const [accessScope, setAccessScope] = useState<'public' | 'organization'>(
    'public'
  );
  const [includeNewMessages, setIncludeNewMessages] = useState(false);
  const [shareLink, setShareLink] = useState<EvoyaShareLink>({});
  const [open, setOpen] = useState(false);
  const [_, copyToClipboard] = useCopyToClipboard();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const { accessToken, evoya } = useContext(WidgetContext);
  const shareRequestIdRef = useRef(0);
  const shareType = includeNewMessages ? 'DYNAMIC' : 'STATIC';
  const hasShareLink = Boolean(shareLink.url);
  const isShareLinkCurrent =
    hasShareLink &&
    shareLink.expire === expireTime &&
    shareLink.type === shareType &&
    shareLink.accessScope === accessScope &&
    shareLink.allowContinuation === true;

  const options = [
    { value: '0', label: 'components.molecules.shareSession.expire.no_expiry' },
    { value: '7', label: 'components.molecules.shareSession.expire.7days' },
    { value: '31', label: 'components.molecules.shareSession.expire.1month' }
  ];

  const handleClickOpen = async () => {
    setOpen(true);
    setIsLoading(true);
    if (!evoya?.api) {
      setIsLoading(false);
      return;
    }

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
        setExpireTime(0);
        setAccessScope('public');
        setIncludeNewMessages(false);
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
          accessScope:
            shareData.data.access_scope === 'ORGANISATION'
              ? 'organization'
              : 'public',
          allowContinuation: !!shareData.data.allow_continuation,
          url: shareData.data.link
        };
        setShareLink(shareConfig);
        setExpireTime(dateDiff);
        setAccessScope(shareConfig.accessScope || 'public');
        setIncludeNewMessages(shareData.data.share_type === 'DYNAMIC');
      }
    } catch (_e) {
      // Error handling - could set error state if needed
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleRevokeShareLink = async () => {
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

  const syncShareLink = async (nextConfig: {
    accessScope: 'public' | 'organization';
    expireTime: number;
    includeNewMessages: boolean;
  }) => {
    const shareConfig: EvoyaShareLink = {
      expire: nextConfig.expireTime,
      type: nextConfig.includeNewMessages ? 'DYNAMIC' : 'STATIC',
      accessScope: nextConfig.accessScope,
      allowContinuation: true
    };
    if (evoya?.api?.share && accessToken) {
      const requestId = ++shareRequestIdRef.current;
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
              access_scope:
                nextConfig.accessScope === 'organization'
                  ? 'ORGANISATION'
                  : 'PUBLIC',
              allow_continuation: true,
              expires_in:
                nextConfig.expireTime > 0 ? nextConfig.expireTime : null,
              share_type: shareConfig.type
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
          if (requestId !== shareRequestIdRef.current) {
            return;
          }
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
        if (requestId === shareRequestIdRef.current) {
          setIsCreating(false);
        }
      }
    }
  };

  const handleAccessScopeChange = async (
    nextAccessScope: 'public' | 'organization'
  ) => {
    if (nextAccessScope === accessScope) {
      return;
    }

    setAccessScope(nextAccessScope);
    if (hasShareLink) {
      await syncShareLink({
        accessScope: nextAccessScope,
        expireTime,
        includeNewMessages
      });
    }
  };

  const handleExpireTimeChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const nextExpireTime = parseInt(e.target.value, 10);
    if (nextExpireTime === expireTime) {
      return;
    }

    setExpireTime(nextExpireTime);
    if (hasShareLink) {
      await syncShareLink({
        accessScope,
        expireTime: nextExpireTime,
        includeNewMessages
      });
    }
  };

  const handleIncludeNewMessagesChange = async (nextValue: boolean) => {
    if (nextValue === includeNewMessages) {
      return;
    }

    setIncludeNewMessages(nextValue);
    if (hasShareLink) {
      await syncShareLink({
        accessScope,
        expireTime,
        includeNewMessages: nextValue
      });
    }
  };

  const handleGenerateShareLink = async () => {
    await syncShareLink({
      accessScope,
      expireTime,
      includeNewMessages
    });
  };

  const displayedLink = shareLink.url
    ? (() => {
        try {
          const parsed = new URL(shareLink.url);
          return `${parsed.pathname}${parsed.search}${parsed.hash}`;
        } catch {
          return shareLink.url;
        }
      })()
    : '';

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
                <Share
                  className="!size-5 "
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
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleClose();
          }
        }}
        aria-labelledby="share-alert-dialog-title"
        aria-describedby="share-alert-dialog-description"
      >
        <DialogContent className="z-[9999] rounded-[24px] border border-slate-200 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle id="share-alert-dialog-title">
              {t('components.molecules.shareSession.dialog.title')}
            </DialogTitle>
            <DialogDescription
              id="share-alert-dialog-description"
              className="text-[15px] text-slate-500"
            >
              {t('components.molecules.shareSession.dialog.description')}
            </DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <div className="min-h-[400px] md:w-[463px] w-[386px] space-y-6 pt-0">
              <section className="space-y-3">
                <h3 className="text-[15px] font-semibold text-slate-900">
                  {t('components.molecules.shareSession.access.title')}
                </h3>
                <div className="rounded-lg border border-slate-200 bg-slate-100 p-1.5">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => handleAccessScopeChange('public')}
                      className={cn(
                        'flex h-9 items-center justify-center gap-2 rounded-md text-base transition-colors',
                        accessScope === 'public'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      <Globe className="h-4 w-4" />
                      <span>
                        {t('components.molecules.shareSession.access.public')}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAccessScopeChange('organization')}
                      className={cn(
                        'flex h-9 items-center justify-center gap-2 rounded-md text-base transition-colors',
                        accessScope === 'organization'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      )}
                    >
                      <Building2 className="h-4 w-4" />
                      <span>
                        {t(
                          'components.molecules.shareSession.access.organization'
                        )}
                      </span>
                    </button>
                  </div>
                </div>
                <p className="text-[14px] leading-6 text-slate-500">
                  {accessScope === 'public'
                    ? t(
                        'components.molecules.shareSession.access.publicDescription'
                      )
                    : t(
                        'components.molecules.shareSession.access.organizationDescription'
                      )}
                </p>
              </section>

              <section className="space-y-3">
                <h3 className="text-[15px] font-semibold text-slate-900">
                  {t('components.molecules.shareSession.expire.expiresAfter')}
                </h3>
                <Select
                  value={expireTime}
                  onChange={handleExpireTimeChange}
                  options={options}
                  label={t(
                    'components.molecules.shareSession.expire.expiresIn'
                  )}
                />
              </section>

              <section className="space-y-3">
                <div className="rounded-[18px] border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-[15px] font-semibold text-slate-900">
                        {t(
                          'components.molecules.shareSession.includeNewMessages.title'
                        )}
                      </h4>
                      <p className="max-w-[370px] text-[14px] leading-6 text-slate-500">
                        {t(
                          'components.molecules.shareSession.includeNewMessages.description'
                        )}
                      </p>
                    </div>
                    <Switch
                      checked={includeNewMessages}
                      onCheckedChange={handleIncludeNewMessagesChange}
                    />
                  </div>
                </div>
              </section>

              {isCreating ? (
                <section className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </section>
              ) : isShareLinkCurrent ? (
                <>
                  <section className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <a
                        href={shareLink.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-w-0 items-center gap-3 text-[15px] text-[#2563eb]"
                      >
                        <Link2 className="h-4 w-4 shrink-0 text-slate-500" />
                        <span className="truncate">{displayedLink}</span>
                      </a>
                      <Button
                        variant="outline"
                        className="h-11 rounded-[14px] border-slate-200 bg-white px-5 text-[15px] font-semibold text-slate-900 hover:bg-slate-100"
                        onClick={() => {
                          if (shareLink.url) copyToClipboard(shareLink.url);
                          toast.success(
                            <Translator path="components.molecules.shareSession.messages.success" />
                          );
                        }}
                      >
                        {t('components.molecules.shareSession.copyButton')}
                      </Button>
                    </div>
                  </section>

                  <button
                    type="button"
                    className="w-full text-center text-[15px] font-semibold text-red-500 transition-colors hover:text-red-600"
                    onClick={handleRevokeShareLink}
                  >
                    {t('components.molecules.shareSession.revokeLinkButton')}
                  </button>
                </>
              ) : (
                <Button
                  variant="default"
                  onClick={handleGenerateShareLink}
                  className="w-full"
                >
                  <Link2 className="mr-2 h-5 w-5" />
                  {t(
                    'components.molecules.shareSession.generateShareableLinkButton'
                  )}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
