import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const CLIENT_ID = '524078761036-5l0mn6k51jim0eu75q1bb9oiclbamdeq.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'elite-notepade-backup.json';
const STORAGE_KEY_TOKEN = 'google_drive_access_token';
const STORAGE_KEY_EMAIL = 'google_drive_email';
const STORAGE_KEY_FILE_ID = 'google_drive_file_id';
const STORAGE_KEY_EXPIRY = 'google_drive_token_expiry';

interface GoogleDriveState {
  isConnected: boolean;
  email: string | null;
  isLoading: boolean;
}

export function useGoogleDrive() {
  const [state, setState] = useState<GoogleDriveState>({
    isConnected: false,
    email: null,
    isLoading: true,
  });

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const email = localStorage.getItem(STORAGE_KEY_EMAIL);
    const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);

    if (token && email && expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() < expiryTime) {
        setState({ isConnected: true, email, isLoading: false });
      } else {
        // Token expired, clear storage
        clearStoredCredentials();
        setState({ isConnected: false, email: null, isLoading: false });
      }
    } else {
      setState({ isConnected: false, email: null, isLoading: false });
    }
  }, []);

  // Handle OAuth redirect
  useEffect(() => {
    const handleRedirect = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');

        if (accessToken) {
          try {
            // Fetch user info
            const userInfoResponse = await fetch(
              'https://www.googleapis.com/oauth2/v2/userinfo',
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
            const userInfo = await userInfoResponse.json();

            // Calculate expiry time
            const expiryTime = Date.now() + (parseInt(expiresIn || '3600', 10) * 1000);

            // Store credentials
            localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
            localStorage.setItem(STORAGE_KEY_EMAIL, userInfo.email);
            localStorage.setItem(STORAGE_KEY_EXPIRY, expiryTime.toString());

            setState({ isConnected: true, email: userInfo.email, isLoading: false });
            toast.success('Google account connected successfully!');

            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
          } catch (error) {
            console.error('Error fetching user info:', error);
            toast.error('Failed to connect Google account');
            setState({ isConnected: false, email: null, isLoading: false });
          }
        }
      }
    };

    handleRedirect();
  }, []);

  const clearStoredCredentials = () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    localStorage.removeItem(STORAGE_KEY_FILE_ID);
    localStorage.removeItem(STORAGE_KEY_EXPIRY);
  };

  const connect = useCallback(() => {
    const redirectUri = window.location.origin + window.location.pathname;
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('prompt', 'consent');

    // Use redirect for Android WebView compatibility
    window.location.href = authUrl.toString();
  }, []);

  const disconnect = useCallback(() => {
    clearStoredCredentials();
    setState({ isConnected: false, email: null, isLoading: false });
    toast.success('Google account disconnected');
  }, []);

  const getAccessToken = (): string | null => {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiry = localStorage.getItem(STORAGE_KEY_EXPIRY);

    if (token && expiry && Date.now() < parseInt(expiry, 10)) {
      return token;
    }

    // Token expired
    clearStoredCredentials();
    setState({ isConnected: false, email: null, isLoading: false });
    toast.error('Session expired. Please reconnect your Google account.');
    return null;
  };

  const findBackupFile = async (accessToken: string): Promise<string | null> => {
    // Check stored file ID first
    const storedFileId = localStorage.getItem(STORAGE_KEY_FILE_ID);
    if (storedFileId) {
      // Verify the file still exists
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${storedFileId}?fields=id,name,trashed`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        if (response.ok) {
          const file = await response.json();
          if (!file.trashed) {
            return storedFileId;
          }
        }
      } catch {
        // File not found or error, continue to search
      }
    }

    // Search for the file by name
    const query = `name='${BACKUP_FILENAME}' and trashed=false`;
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to search for backup file');
    }

    const data = await response.json();
    if (data.files && data.files.length > 0) {
      const fileId = data.files[0].id;
      localStorage.setItem(STORAGE_KEY_FILE_ID, fileId);
      return fileId;
    }

    return null;
  };

  const backup = useCallback(async (data: object): Promise<boolean> => {
    const accessToken = getAccessToken();
    if (!accessToken) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const fileId = await findBackupFile(accessToken);
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });

      if (fileId) {
        // Update existing file
        const response = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: blob,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to update backup file');
        }

        toast.success('Backup updated successfully!');
      } else {
        // Create new file
        const metadata = {
          name: BACKUP_FILENAME,
          mimeType: 'application/json',
        };

        const formData = new FormData();
        formData.append(
          'metadata',
          new Blob([JSON.stringify(metadata)], { type: 'application/json' })
        );
        formData.append('file', blob);

        const response = await fetch(
          'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Failed to create backup file');
        }

        const result = await response.json();
        localStorage.setItem(STORAGE_KEY_FILE_ID, result.id);
        toast.success('Backup created successfully!');
      }

      setState(prev => ({ ...prev, isLoading: false }));
      return true;
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to backup to Google Drive');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const restore = useCallback(async (): Promise<object | null> => {
    const accessToken = getAccessToken();
    if (!accessToken) return null;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const fileId = await findBackupFile(accessToken);

      if (!fileId) {
        toast.error('No backup file found on Google Drive');
        setState(prev => ({ ...prev, isLoading: false }));
        return null;
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download backup file');
      }

      const data = await response.json();
      toast.success('Data restored from Google Drive!');
      setState(prev => ({ ...prev, isLoading: false }));
      return data;
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore from Google Drive');
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }
  }, []);

  return {
    isConnected: state.isConnected,
    email: state.email,
    isLoading: state.isLoading,
    connect,
    disconnect,
    backup,
    restore,
  };
}
