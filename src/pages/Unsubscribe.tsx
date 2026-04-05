import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

type Status = 'loading' | 'valid' | 'already_unsubscribed' | 'invalid' | 'success' | 'error';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    // Validate token via GET
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: anonKey },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid === false && data.reason === 'already_unsubscribed') {
          setStatus('already_unsubscribed');
        } else if (data.valid) {
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => setStatus('error'));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      if (data?.success) {
        setStatus('success');
      } else if (data?.reason === 'already_unsubscribed') {
        setStatus('already_unsubscribed');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Tech Subx BD</h1>

        {status === 'loading' && (
          <p className="text-muted-foreground">Verifying...</p>
        )}

        {status === 'valid' && (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to unsubscribe from email notifications?
            </p>
            <button
              onClick={handleUnsubscribe}
              disabled={processing}
              className="px-6 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Confirm Unsubscribe'}
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">✅ Unsubscribed Successfully</p>
            <p className="text-sm text-muted-foreground">You will no longer receive emails from us.</p>
          </div>
        )}

        {status === 'already_unsubscribed' && (
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Already Unsubscribed</p>
            <p className="text-sm text-muted-foreground">You have already unsubscribed from our emails.</p>
          </div>
        )}

        {status === 'invalid' && (
          <p className="text-destructive">Invalid or expired unsubscribe link.</p>
        )}

        {status === 'error' && (
          <p className="text-destructive">Something went wrong. Please try again later.</p>
        )}
      </div>
    </div>
  );
}
