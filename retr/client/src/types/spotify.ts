export interface SpotifyTrack {
  id: string;
  name: string;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  artists: Array<{
    name: string;
    id: string;
  }>;
  duration_ms: number;
  uri: string;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlayerState {
  device: {
    id: string;
    is_active: boolean;
    is_private_session: boolean;
    is_restricted: boolean;
    name: string;
    type: string;
    volume_percent: number;
  };
  repeat_state: 'off' | 'track' | 'context';
  shuffle_state: boolean;
  context: {
    type: 'album' | 'artist' | 'playlist';
    uri: string;
    // External URLs would be here in a real implementation
  } | null;
  timestamp: number;
  progress_ms: number;
  is_playing: boolean;
  item: SpotifyTrack | null;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
  actions: {
    disallows: {
      pausing: boolean;
      skipping_next: boolean;
      skipping_prev: boolean;
      seeking: boolean;
    };
  };
}

export interface SpotifySearchResults {
  tracks: {
    items: SpotifyTrack[];
    total: number;
    limit: number;
    offset: number;
    previous: string | null;
    next: string | null;
    href: string;
  };
}