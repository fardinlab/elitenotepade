import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      // Profile might not exist yet, create it
      if (error.code === 'PGRST116') {
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert({ id: user.id })
          .select()
          .single();

        if (!insertError && newProfile) {
          setProfile(newProfile);
        }
      } else {
        console.error('Error fetching profile:', error);
      }
    } else {
      setProfile(data);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (updates: { full_name?: string; avatar_url?: string }) => {
    if (!user) return { error: 'Not authenticated' };

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating profile:', error);
      return { error: error.message };
    }

    setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    return { error: null };
  }, [user]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return { error: 'Not authenticated', url: null };

    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return { error: uploadError.message, url: null };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update profile with new avatar URL
    const { error: updateError } = await updateProfile({ avatar_url: publicUrl });

    if (updateError) {
      return { error: updateError, url: null };
    }

    return { error: null, url: publicUrl };
  }, [user, updateProfile]);

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar,
    refetch: fetchProfile,
  };
}
