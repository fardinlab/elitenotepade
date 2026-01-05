import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Notepad } from '@/types/member';

interface DbNotepad {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const mapDbNotepadToNotepad = (db: DbNotepad): Notepad => ({
  id: db.id,
  title: db.title,
  content: db.content || '',
  createdAt: db.created_at,
  updatedAt: db.updated_at,
});

export function useNotepads() {
  const { user } = useAuth();
  const [notepads, setNotepads] = useState<Notepad[]>([]);
  const [activeNotepadId, setActiveNotepadId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchNotepads = useCallback(async () => {
    if (!user) {
      setNotepads([]);
      setIsLoaded(true);
      return;
    }

    const { data, error } = await supabase
      .from('notepads')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching notepads:', error);
      setNotepads([]);
    } else {
      setNotepads((data || []).map(mapDbNotepadToNotepad));
    }
    setIsLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchNotepads();
  }, [fetchNotepads]);

  const createNotepad = useCallback(async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('notepads')
      .insert({
        user_id: user.id,
        title: 'Untitled Note',
        content: '',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notepad:', error);
      return null;
    }

    const newNotepad = mapDbNotepadToNotepad(data);
    setNotepads((prev) => [newNotepad, ...prev]);
    setActiveNotepadId(newNotepad.id);
    return newNotepad;
  }, [user]);

  const updateNotepad = useCallback(async (id: string, updates: Partial<Pick<Notepad, 'title' | 'content'>>) => {
    const { error } = await supabase
      .from('notepads')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating notepad:', error);
      return;
    }

    setNotepads((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }, []);

  const deleteNotepad = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('notepads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notepad:', error);
      return;
    }

    setNotepads((prev) => prev.filter((n) => n.id !== id));
    if (activeNotepadId === id) {
      setActiveNotepadId(null);
    }
  }, [activeNotepadId]);

  const activeNotepad = notepads.find((n) => n.id === activeNotepadId) || null;

  // Already sorted by updated_at from query, but re-sort for local updates
  const sortedNotepads = [...notepads].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return {
    notepads: sortedNotepads,
    activeNotepad,
    activeNotepadId,
    isLoaded,
    setActiveNotepadId,
    createNotepad,
    updateNotepad,
    deleteNotepad,
  };
}
