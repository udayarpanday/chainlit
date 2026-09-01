import { cn } from '@/lib/utils';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { WidgetContext } from '@chainlit/copilot/src/context';

import { Translator } from 'components/i18n';

import 'assets/evoya_light.svg';
import LogoDark from 'assets/evoya_light.svg?react';
import LogoLight from 'assets/evoya_light.svg?react';

import { Kbd } from './Kbd';
import { useTheme } from './ThemeProvider';

const DEFAULT_ADDITIONAL_INFO_PATH =
  'components.organisms.chat.inputBox.additionalInfo.defaultText';

function DefaultAdditionalInfo() {
  const { t } = useTranslation();

  return t(DEFAULT_ADDITIONAL_INFO_PATH)
    .split(/([/@])/)
    .map((part, index) =>
      part === '/' || part === '@' ? (
        <Kbd
          key={`${part}-${index}`}
          className="mx-0.5 bg-primary/10 py-0 text-primary shadow-none"
        >
          {part}
        </Kbd>
      ) : (
        part
      )
    );
}

export default function WaterMark() {
  const { variant } = useTheme();
  const { evoya } = useContext(WidgetContext);
  const Logo = variant === 'light' ? LogoLight : LogoDark;
  return (
    <>
      {!evoya?.hideWaterMark && (
        <a
          href="https://evoya.ai"
          target="_blank"
          className="watermark"
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none'
          }}
        >
          <div className="text-xs text-black">
            <span>Powered by</span>
          </div>
          <Logo
            style={{
              width: 20,
              height: 'auto',
              filter: 'grayscale(1)',
              marginLeft: '10px',
              marginRight: '5px'
            }}
          />
          <div className="text-xs text-black">
            <span>Evoya AI</span>
          </div>
        </a>
      )}
      {evoya?.additionalInfo && (
        <div
          className={cn(
            ' leading-[1.25]',
            evoya?.type === 'dashboard' ? 'text-left' : 'text-center'
          )}
        >
          <p className="text-xs text-muted-foreground tracking-normal">
            {evoya?.additionalInfo?.text ? (
              evoya?.additionalInfo?.text
            ) : evoya?.additionalInfo?.defaultText ? (
              <DefaultAdditionalInfo />
            ) : (
              <Translator path="components.organisms.chat.inputBox.additionalInfo.text" />
            )}
            {evoya?.additionalInfo?.link && (
              <a
                href={evoya.additionalInfo.link}
                className="text-primary text-xs hover:underline font-normal ml-1"
              >
                {evoya.additionalInfo.linkText}
              </a>
            )}
          </p>
        </div>
      )}
    </>
  );
}
