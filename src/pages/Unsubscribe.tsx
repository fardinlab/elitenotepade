import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const supabaseUrl = 'https://zpwmeoujlgglwttsebup.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd21lb3VqbGdnbHd0dHNlYnVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMzk3MzEsImV4cCI6MjA5MDgxNTczMX0.YY7aCZccFInxa5_jxHc9IJq_Fbm7LQoMfrs5tBOR19o';

type Status = 'loading' | 'valid' | 'already_unsubscribed' | 'invalid' | 'success' | 'error';

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    fetch(`${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`, {
      headers: { apikey: supabaseAnonKey },
    })
      .then(res => res.json())
      .then(data => {
        if (data.valid === false && data.reason === 'already_unsubscribed') {
          setStatus('already_unsubscribed');
        } else if (data.valid) {
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      })
      .catch(() => setStatus('invalid'));
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-lg p-8 text-center space-y-4">
        {status === 'loading' && (
          <p className="text-muted-foreground">Loading...</p>
        )}
        {status === 'valid' && (
          <>
            <h1 className="text-xl font-bold text-foreground">Unsubscribe</h1>
            <p className="text-muted-foreground">
              আপনি কি নিশ্চিত যে আপনি আর emails পেতে চান না?
            </p>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to unsubscribe from future emails?
            </p>
            <button
              onClick={handleUnsubscribe}
              className="w-full py-3 px-4 bg-destructive text-destructive-foreground rounded-xl font-semibold"
            >
              Confirm Unsubscribe
            </button>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-xl font-bold text-foreground">✅ Unsubscribed</h1>
            <p className="text-muted-foreground">
              আপনি সফলভাবে আনসাবস্ক্রাইব করেছেন।
            </p>
            <p className="text-sm text-muted-foreground">
              You have been successfully unsubscribed.
            </p>
          </>
        )}
        {status === 'already_unsubscribed' && (
          <>
            <h1 className="text-xl font-bold text-foreground">Already Unsubscribed</h1>
            <p className="text-muted-foreground">
              আপনি ইতিমধ্যে আনসাবস্ক্রাইব করেছেন।
            </p>
          </>
        )}
        {status === 'invalid' && (
          <>
            <h1 className="text-xl font-bold text-foreground">Invalid Link</h1>
            <p className="text-muted-foreground">
              এই লিংকটি বৈধ নয় বা মেয়াদ শেষ হয়ে গেছে।
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-xl font-bold text-foreground">Error</h1>
            <p className="text-muted-foreground">
              কিছু সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
