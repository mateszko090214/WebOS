import React, { useState, useEffect } from 'react';
import { SpotifyTrack, SpotifyPlayerState } from '../types/spotify';
import { spotifyService } from '../services/spotifyService';

const MusicPlayer = () => {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [playerState, setPlayerState] = useState<SpotifyPlayerState | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = spotifyService.isAuthenticated();
      setIsAuthenticated(isAuth);

      if (isAuth) {
        // Initialize the player state
        loadPlayerState();
      }
    };

    checkAuth();

    // Also check for hash in URL (callback from Spotify auth)
    if (window.location.hash.includes('access_token')) {
      spotifyService.handleCallback();
      setIsAuthenticated(true);
    }
  }, []);

  // Load the current player state
  const loadPlayerState = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const state = await spotifyService.getCurrentlyPlaying();
      setPlayerState(state);

      if (state && state.item) {
        setCurrentTrack(state.item);
      }
    } catch (err) {
      console.error('Error loading player state:', err);
      setError('Failed to load player state. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update player state periodically
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(loadPlayerState, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleLogin = () => {
    window.location.href = spotifyService.getLoginUrl();
  };

  const handleLogout = () => {
    spotifyService.logout();
    setIsAuthenticated(false);
    setCurrentTrack(null);
    setPlayerState(null);
  };

  const handlePlayPause = async () => {
    try {
      if (playerState?.is_playing) {
        await spotifyService.pause();
      } else {
        await spotifyService.resume();
      }
      await loadPlayerState();
    } catch (err) {
      console.error('Error toggling play/pause:', err);
      setError('Failed to toggle play/pause. Please try again.');
    }
  };

  const handleNextTrack = async () => {
    try {
      await spotifyService.nextTrack();
      await loadPlayerState();
    } catch (err) {
      console.error('Error skipping to next track:', err);
      setError('Failed to skip to next track. Please try again.');
    }
  };

  const handlePreviousTrack = async () => {
    try {
      await spotifyService.previousTrack();
      await loadPlayerState();
    } catch (err) {
      console.error('Error skipping to previous track:', err);
      setError('Failed to skip to previous track. Please try again.');
    }
  };

  const handleSearchAndPlay = async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const tracks = await spotifyService.searchTracks(query, 1);
      if (tracks.length > 0) {
        await spotifyService.playTrack(tracks[0].uri);
        await loadPlayerState();
      } else {
        setError('No tracks found for your search.');
      }
    } catch (err) {
      console.error('Error searching and playing track:', err);
      setError('Failed to search and play track. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Music Player</h2>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="mb-4">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h11a2 2 0 012 2v8a2 2 0 01-2 2z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l4-4m0 0l-4-4m4 4H7"></path>
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Spotify Music Player</h3>
          <p className="text-gray-600 mb-4">
            Connect your Spotify account to play music in your Web OS desktop.
          </p>
          <button
            onClick={handleLogin}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Connect Spotify
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Music Player</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-b-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Music Player</h2>
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
          {error}
          <button
            onClick={() => setError(null)}
            className="mt-2 px-3 py-1 bg-red-200 text-red-800 rounded text-xs"
          >
            Dismiss
          </button>
        </div>

        {/* Show controls anyway so user can retry */}
        <div className="mt-4">
          <button
            onClick={loadPlayerState}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Format milliseconds to MM:SS
  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const getProgressPercent = (): number => {
    if (!playerState?.item || !playerState.progress_ms) return 0;
    return (playerState.progress_ms / playerState.item.duration_ms) * 100;
  };

  return (
    <div className="p-4">
      <div className="flex items-center space-x-4">
        <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
          Logout
        </button>
        <h2 className="text-xl font-bold flex-1">Music Player</h2>
        <div className="text-sm text-gray-500">
          {isAuthenticated ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
          {error}
        </div>
      )}

      {currentTrack && playerState !== null && (
        <div className="mt-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-lg overflow-hidden shadow-md">
              <img
                src={currentTrack.album.images[0]?.url || ''}
                alt={`${currentTrack.name} album art`}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{currentTrack.name}</h3>
              <p className="text-sm text-gray-500">
                {currentTrack.artists.map((artist) => artist.name).join(', ')} •
                {currentTrack.album.name}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-xs text-gray-400">0:00</span>
              <div className="flex-1 h-1 bg-gray-300 rounded mx-2">
                <div
                  className={`h-1 bg-green-500 rounded transition-all duration-200`}
                  style={{ width: `${getProgressPercent()}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-400">{formatTime(playerState.duration_ms)}</span>
            </div>
          </div>

          <div className="mt-4 flex space-x-3">
            <button
              onClick={handlePreviousTrack}
              className="p-2 rounded hover:bg-gray-200"
              disabled={!playerState?.is_playing}
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>

            <button
              onClick={handlePlayPause}
              className="flex-1 items-center justify-center space-x-2"
              disabled={!playerState}
            >
              {playerState?.is_playing ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l4 3"/>
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v14l11-7z"/>
                </svg>
              )}
              <span className="ml-2">{playerState?.is_playing ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={handleNextTrack}
              className="p-2 rounded hover:bg-gray-200"
              disabled={!playerState?.is_playing}
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

          <div className="mt-4">
            <button
              onClick={() => {
                const query = prompt('Search for a track to play:');
                if (query) {
                  handleSearchAndPlay(query);
                }
              }}
              className="w-full px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Search and Play
            </button>
          </div>
        </div>
      )}

      {!currentTrack && playerState === null && (
        <div className="mt-6 text-center py-8">
          <p className="text-gray-500">
            No music is currently playing. Search for a track to get started.
          </p>
          <button
            onClick={() => {
              const query = prompt('Search for a track to play:');
              if (query) {
                handleSearchAndPlay(query);
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Search and Play
          </button>
        </div>
      )}
    </div>
  );
};

export { MusicPlayer };