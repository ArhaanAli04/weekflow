import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Bell, Database, Info, LogOut } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '@weekflow/shared/stores';
import type { NotificationPrefs } from '@weekflow/shared/types';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { toast } from '../components/ui/Toast';

const APP_VERSION = (import.meta.env['VITE_APP_VERSION'] as string | undefined) ?? '1.0.0';

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-accent' : 'bg-white/20'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
      {icon}
      {label}
    </div>
  );
}

// ── Toggle row ────────────────────────────────────────────────────────────────

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-white">{title}</p>
        <p className="text-xs text-muted">{description}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const navigate = useNavigate();

  const profile = useAuthStore(useShallow((s) => s.profile));
  const user = useAuthStore(useShallow((s) => s.user));
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const signOut = useAuthStore((s) => s.signOut);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    weekly_report: profile?.notification_prefs?.weekly_report ?? true,
    midweek_checkin: profile?.notification_prefs?.midweek_checkin ?? true,
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialized = useRef(false);

  // Sync local state from profile exactly once (on first profile load).
  useEffect(() => {
    if (profile && !hasInitialized.current) {
      hasInitialized.current = true;
      setDisplayName(profile.display_name ?? '');
      setNotifPrefs({
        weekly_report: profile.notification_prefs?.weekly_report ?? true,
        midweek_checkin: profile.notification_prefs?.midweek_checkin ?? true,
      });
    }
  }, [profile]);

  // Clean up debounce timer on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsSaving(true);
    debounceRef.current = setTimeout(() => {
      void updateProfile({ display_name: value }).finally(() => setIsSaving(false));
    }, 700);
  };

  const handleToggle = (key: keyof NotificationPrefs, value: boolean) => {
    const next: NotificationPrefs = { ...notifPrefs, [key]: value };
    setNotifPrefs(next);
    void updateProfile({ notification_prefs: next });
  };

  const handleClearCache = () => {
    const confirmed = window.confirm('Clear all local cache? This will reload the page.');
    if (!confirmed) return;
    localStorage.clear();
    toast.success('Local cache cleared');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex flex-col pb-32 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-5">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex h-9 w-9 items-center justify-center rounded-full text-secondary transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      <div className="flex flex-col gap-5 px-4">
        {/* ── Account ────────────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<User className="h-3.5 w-3.5" />} label="Account" />
          <Card>
            <div className="flex flex-col gap-4">
              <div>
                <Input
                  label="Display name"
                  value={displayName}
                  maxLength={50}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  placeholder="Your name"
                />
                {isSaving && (
                  <p className="mt-1 text-xs text-muted">Saving...</p>
                )}
              </div>
              <Input
                label="Email"
                value={user?.email ?? ''}
                readOnly
                className="opacity-60"
              />
            </div>
          </Card>
        </section>

        {/* ── Notifications ──────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<Bell className="h-3.5 w-3.5" />} label="Notifications" />
          <Card>
            <div className="flex flex-col gap-4">
              <ToggleRow
                title="Sunday report reminder"
                description="8:00 PM every Sunday"
                checked={notifPrefs.weekly_report}
                onChange={(v) => handleToggle('weekly_report', v)}
              />
              <ToggleRow
                title="Wednesday check-in"
                description="7:00 PM every Wednesday"
                checked={notifPrefs.midweek_checkin}
                onChange={(v) => handleToggle('midweek_checkin', v)}
              />
              <div className="flex items-start gap-2 rounded-lg bg-white/5 px-3 py-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted" />
                <p className="text-xs text-muted">
                  Push notifications are not supported in PWA on iOS
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Data ───────────────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<Database className="h-3.5 w-3.5" />} label="Data" />
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-white">Clear local cache</p>
                <p className="text-xs text-muted">Removes all cached data from this browser</p>
              </div>
              <Button variant="secondary" onClick={handleClearCache}>
                Clear
              </Button>
            </div>
          </Card>
        </section>

        {/* ── App ────────────────────────────────────────────────── */}
        <section>
          <SectionLabel icon={<Info className="h-3.5 w-3.5" />} label="App" />
          <Card>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-secondary">Version</p>
                <p className="text-sm font-medium text-white">{APP_VERSION}</p>
              </div>
              <Button
                variant="danger"
                className="w-full"
                onClick={() => void handleSignOut()}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
