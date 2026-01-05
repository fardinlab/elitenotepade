import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setAvatarUrl(profile?.avatar_url || '');
  }, [profile?.full_name, profile?.avatar_url]);

  const email = useMemo(() => user?.email || profile?.email || '', [user?.email, profile?.email]);

  const onSave = async () => {
    setSaving(true);
    await updateProfile({
      full_name: fullName.trim() || undefined,
      avatar_url: avatarUrl.trim() || undefined,
    });
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-[100dvh]">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="container mx-auto flex items-center gap-3">
          <Button variant="secondary" size="icon" onClick={() => navigate('/')}
            aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-foreground truncate">Profile</h1>
            <p className="text-xs text-muted-foreground truncate">Manage your account details</p>
          </div>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="ml-2">Save</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <section className="max-w-xl mx-auto space-y-6">
          <div className="space-y-2">
            <Label>Email</Label>
            <div className="p-3 rounded-xl bg-secondary/50 text-sm text-muted-foreground truncate">
              {email || '—'}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url">Avatar URL (optional)</Label>
            <Input
              id="avatar_url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
            {avatarUrl.trim() ? (
              <div className="flex items-center gap-3 pt-2">
                <img
                  src={avatarUrl}
                  alt="Profile avatar preview"
                  className="w-12 h-12 rounded-full object-cover"
                  loading="lazy"
                />
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  );
}
