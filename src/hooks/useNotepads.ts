import { useState, useEffect, useCallback } from 'react';
import { Notepad } from '@/types/member';

const STORAGE_KEY = 'elite_notepade_notepads';

export function useNotepads() {
  const [notepads, setNotepads] = useState<Notepad[]>([]);
  const [activeNotepadId, setActiveNotepadId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setNotepads(parsed.notepads || []);
        setActiveNotepadId(parsed.activeNotepadId || null);
      } catch {
        setNotepads([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notepads, activeNotepadId }));
    }
  }, [notepads, activeNotepadId, isLoaded]);

  const createNotepad = useCallback(() => {
    const newNotepad: Notepad = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotepads((prev) => [newNotepad, ...prev]);
    setActiveNotepadId(newNotepad.id);
    return newNotepad;
  }, []);

  const updateNotepad = useCallback((id: string, updates: Partial<Pick<Notepad, 'title' | 'content'>>) => {
    setNotepads((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, ...updates, updatedAt: new Date().toISOString() }
          : n
      )
    );
  }, []);

  const deleteNotepad = useCallback((id: string) => {
    setNotepads((prev) => prev.filter((n) => n.id !== id));
    if (activeNotepadId === id) {
      setActiveNotepadId(null);
    }
  }, [activeNotepadId]);

  const activeNotepad = notepads.find((n) => n.id === activeNotepadId) || null;

  // Sort by updatedAt descending
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
