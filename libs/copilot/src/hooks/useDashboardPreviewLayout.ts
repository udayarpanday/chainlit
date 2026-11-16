import { useLayoutEffect } from 'react';

import { DASHBOARD_SIDEBAR_REQUEST } from '../lib/dashboardSidebar';

// The dashboard lives outside the widget's shadow root. Keep this override
// scoped to its containing dashboard and leave the host's sidebar state alone.
const previewLayout = `
  [data-copilot-document-preview]:not([data-copilot-preview-sessions]) > .personal-dashboard-sidebar,
  [data-copilot-document-preview]:not([data-copilot-preview-sessions]) > .personal-dashboard-backdrop {
    display: none !important;
  }
  [data-copilot-document-preview] {
    min-width: 0;
  }
  [data-copilot-document-preview] > .personal-dashboard-content {
    flex: 1 1 0%;
    min-width: 0;
    max-width: 100%;
  }
  [data-copilot-document-preview] .personal-dashboard-chat {
    min-width: 0;
    max-width: 100%;
  }
`;

export function useDashboardPreviewLayout(
  container: HTMLElement | null | undefined,
  previewOpen: boolean
) {
  useLayoutEffect(() => {
    if (!previewOpen) return;
    const dashboard = container?.closest('.dashboard-main-container');
    if (!dashboard) return;

    const attribute = 'data-copilot-document-preview';
    const sessionsAttribute = 'data-copilot-preview-sessions';
    const previous = dashboard.getAttribute(attribute);
    const previousSessions = dashboard.getAttribute(sessionsAttribute);
    const style = dashboard.ownerDocument.createElement('style');
    style.textContent = previewLayout;
    dashboard.ownerDocument.head.appendChild(style);
    dashboard.setAttribute(attribute, '');
    dashboard.removeAttribute(sessionsAttribute);

    const revealSessions = (event: Event) => {
      if (dashboard.hasAttribute(sessionsAttribute)) return;
      dashboard.setAttribute(sessionsAttribute, '');
      // The host may still consider its automatically hidden sidebar open.
      // Handle that first request without asking the host to close it.
      if (
        dashboard
          .querySelector(':scope > .personal-dashboard-sidebar')
          ?.classList.contains('-open')
      )
        event.preventDefault();
    };
    window.addEventListener(DASHBOARD_SIDEBAR_REQUEST, revealSessions);

    return () => {
      window.removeEventListener(DASHBOARD_SIDEBAR_REQUEST, revealSessions);
      style.remove();
      if (previous === null) dashboard.removeAttribute(attribute);
      else dashboard.setAttribute(attribute, previous);
      if (previousSessions === null)
        dashboard.removeAttribute(sessionsAttribute);
      else dashboard.setAttribute(sessionsAttribute, previousSessions);
    };
  }, [container, previewOpen]);
}
