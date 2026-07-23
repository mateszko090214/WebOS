import { SpotifyTrack, SpotifyPlayerState, SpotifyAuthResponse } from '../types/spotify';

// In a real app, you would get these from environment variables or a secure config
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'your-client-id';
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || window.location.origin + '/callback';
const SPOTIFY_SCOPES = 'user-read-private user-read-email user-modify-playback-state user-read-currently-playing user-read-playback-state streaming app-remote-control';

// Spotify API base URL
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

// Spotify Accounts URL
const SPOTIFY_ACCOUNTS_URL = 'https://accounts.spotify.com';

/**
 * Spotify service for handling authentication and API calls
 */
export class SpotifyService {
  private accessToken: string | null = null;
  private expiresAt: number = 0;

  constructor() {
    // Check if we have a token in local storage
    const savedToken = localStorage.getItem('spotify_access_token');
    const expiresAt = localStorage.getItem('spotify_expires_at');

    if (savedToken && expiresAt) {
      this.accessToken = savedToken;
      this.expiresAt = parseInt(expiresAt, 10);
    }
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken && Date.now() < this.expiresAt;
  }

  /**
   * Get the login URL for Spotify authentication
   */
  getLoginUrl(): string {
    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: 'token',
      redirect_uri: SPOTIFY_REDIRECT_URI,
      scope: SPOTIFY_SCOPES,
      show_dialog: 'true',
    });

    return `${SPOTIFY_ACCOUNTS_URL}/authorize?${params.toString()}`;
  }

  /**
   * Handle the callback from Spotify authentication
   */
  handleCallback(): void {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (accessToken && expiresIn) {
      this.accessToken = accessToken;
      this.expiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;

      // Save to local storage
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_expires_at', this.expiresAt.toString());

      // Remove the hash from the URL
      window.history.pushState('', document.title, window.location.pathname);
    }
  }

  /**
   * Log out the user
   */
  logout(): void {
    this.accessToken = null;
    this.expiresAt = 0;
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_expires_at');
  }

  /**
   * Get the authorization header for API requests
   */
  private getAuthHeaders(): HeadersInit {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Spotify');
    }
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get the currently playing track
   */
  async getCurrentlyPlaying(): Promise<SpotifyPlayerState | null> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me/player/currently-playing`, {
        headers: this.getAuthHeaders(),
      });

      if (response.status === 204) {
        // No content - nothing is playing
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to get currently playing track: ${response.status}`);
      }

      const data: SpotifyPlayerState = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting currently playing track:', error);
      throw error;
    }
  }

  /**
   * Get a track by its ID
   */
  async getTrack(trackId: string): Promise<SpotifyTrack> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/tracks/${trackId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to get track: ${response.status}`);
      }

      const data: SpotifyTrack = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting track:', error);
      throw error;
    }
  }

  /**
   * Search for tracks
   */
  async searchTracks(query: string, limit: number = 10): Promise<SpotifyTrack[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to search tracks: ${response.status}`);
      }

      const data = await response.json();
      return data.tracks.items;
    } catch (error) {
      console.error('Error searching tracks:', error);
      throw error;
    }
  }

  /**
   * Play a track
   */
  async playTrack(trackUri: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me/player/play`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ uris: [trackUri] }),
      });

      if (!response.ok) {
        throw new Error(`Failed to play track: ${response.status}`);
      }
    } catch (error) {
      console.error('Error playing track:', error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me/player/pause`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to pause: ${response.status}`);
      }
    } catch (error) {
      console.error('Error pausing:', error);
      throw error;
    }
  }

  /**
   * Resume playback
   */
  async resume(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me/player/play`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to resume: ${response.status}`);
      }
    } catch (error) {
      console.error('Error resuming:', error);
      throw error;
    }
  }

  /**
   * Skip to next track
   */
  async nextTrack(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me/player/next`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to skip to next track: ${response.status}`);
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
      throw error;
    }
  }

  /**
   * Skip to previous track
   */
  async previousTrack(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me/player/previous`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to skip to previous track: ${response.status}`);
      }
    } catch (error) {
      console.error('Error skipping to previous track:', error);
      throw error;
    }
  }

  /**
   * Set volume
   */
  async setVolume(volumePercent: number): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated with Spotify');
    }

    try {
      const response = await fetch(`${SPOTIFY_API_URL}/me/player/volume?volume_percent=${volumePercent}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to set volume: ${response.status}`);
      }
    } catch (error) {
      console.error('Error setting volume:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const spotifyService = new SpotifyService();