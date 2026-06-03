import React from 'react';

import {
  defaultSvgIcons,
  IconKey as DefaultIconKey
} from '@mdxeditor/editor';

export const getSvgIcon = (name: IconKey) => {
  const customIcon = evoyaSvgIcons[name];

  if (customIcon) {
    return customIcon;
  }

  return defaultSvgIcons[name];
}

const evoyaSvgIcons = {
  'handPointer': (
    <svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M8 13v-8.5a1.5 1.5 0 0 1 3 0v7.5" />
      <path d="M11 11.5v-2a1.5 1.5 0 1 1 3 0v2.5" />
      <path d="M14 10.5a1.5 1.5 0 0 1 3 0v1.5" />
      <path d="M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" />
    </svg>
  ),
  'save': (
    <svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
      <path d="M7 11l5 5l5 -5" />
      <path d="M12 4l0 12" />
    </svg>
  ),
  'filePlus': (
    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 28 28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M14 3v4a1 1 0 0 0 1 1h4" fill="none" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" fill="none" />
      <path d="M12 11l0 6" fill="none" />
      <path d="M9 14l6 0" fill="none" />
    </svg>
  ),
  'file': (
    <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 28 28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z" fill="none"/>
      <path d="M14 2v5a1 1 0 0 0 1 1h5" fill="none"/>
    </svg>
  ),
  'folder-open': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" >
      <path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2" fill="none" />
    </svg>
  ),
  'eye': (
    <svg  xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
      <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0 -4 0" />
      <path d="M21 12c-2.4 4 -5.4 6 -9 6c-3.6 0 -6.6 -2 -9 -6c2.4 -4 5.4 -6 9 -6c3.6 0 6.6 2 9 6" />
    </svg>
  ),
  'arrow-right-from-line': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 5v14" />
      <path d="M21 12H7" />
      <path d="m15 18 6-6-6-6" />
    </svg>
  ),
  'floppy': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/>
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"/>
      <path d="M7 3v4a1 1 0 0 0 1 1h7"/>
    </svg>
  ),
  'heading-1': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12h8"/>
      <path d="M4 18V6"/>
      <path d="M12 18V6"/>
      <path d="m17 12 3-2v8"/>
    </svg>
  ),
  'heading-2': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12h8"/>
      <path d="M4 18V6"/>
      <path d="M12 18V6"/>
      <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/>
    </svg>
  ),
  'heading-3': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12h8"/>
      <path d="M4 18V6"/>
      <path d="M12 18V6"/>
      <path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/>
      <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/>
    </svg>
  ),
  'heading-4': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 18V6"/>
      <path d="M17 10v3a1 1 0 0 0 1 1h3"/>
      <path d="M21 10v8"/>
      <path d="M4 12h8"/>
      <path d="M4 18V6"/>
    </svg>
  ),
  'heading-5': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 12h8"/>
      <path d="M4 18V6"/>
      <path d="M12 18V6"/>
      <path d="M17 13v-3h4"/>
      <path d="M17 17.7c.4.2.8.3 1.3.3 1.5 0 2.7-1.1 2.7-2.5S19.8 13 18.3 13H17"/>
    </svg>
  ),
  'heading-6': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" >
      <path d="M4 12h8"/>
      <path d="M4 18V6"/>
      <path d="M12 18V6"/>
      <circle cx="19" cy="16" r="2"/>
      <path d="M20 10c-2 2-3 3.5-3 6"/>
    </svg>
  ),
  'quote': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" >
      <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>
      <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/>
    </svg>
  ),
  'text-type': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 4v16"/>
      <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2"/>
      <path d="M9 20h6"/>
    </svg>
  ),
  'letters': (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16"/>
      <path d="M22 9v7"/>
      <path d="M3.304 13h6.392"/>
      <circle cx="18.5" cy="12.5" r="3.5"/>
    </svg>
  ),
};

export type IconKey = DefaultIconKey | 'handPointer' | 'save' | 'filePlus' | 'eye';
