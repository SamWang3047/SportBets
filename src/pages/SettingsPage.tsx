import AppShell from '../components/AppShell';
import DevControlsPanel from '../components/DevControlsPanel';

export default function SettingsPage() {
  return (
    <AppShell activePage="Settings">
      <div className="workspace-page">
        <div className="page-title-row">
          <div>
            <h1>Settings</h1>
            <p>Manage development tools for horse race betting.</p>
          </div>
        </div>

        <DevControlsPanel />
      </div>
    </AppShell>
  );
}
