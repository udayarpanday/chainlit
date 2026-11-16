export const DASHBOARD_SIDEBAR_REQUEST = 'copilot-dashboard-sidebar-request';

export function toggleDashboardSidebar() {
  const request = new CustomEvent(DASHBOARD_SIDEBAR_REQUEST, {
    cancelable: true
  });
  if (window.dispatchEvent(request))
    window.dispatchEvent(new CustomEvent('copilot-dashboard-sidebar'));
}
