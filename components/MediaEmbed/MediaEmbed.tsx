import { SOUNDCLOUD_REGEX, SPOTIFY_LINKIFY_REGEX, SPOTIFY_REGEX, TWITTER_REGEX, VIMEO_LINKIFY_REGEX, VIMEO_REGEX, YOUTUBE_ID_REGEX, YOUTUBE_LINKIFY_REGEX } from '@/constants/regex';
import React from 'react';

interface MediaEmbedProps {
  content: string;
  openYouTube?: boolean;
  setOpenYouTube?: (open: boolean) => void;
  className?: string;
}

// YouTube
function extractYouTubeId(url: string): string | null {
  const match = url.match(
    YOUTUBE_ID_REGEX
  );
  return match ? match[1] : null;
}

// Spotify
function extractSpotifyInfo(url: string): { type: 'track' | 'album' | 'playlist' | null, id: string | null } {
  const match = url.match(SPOTIFY_REGEX);
  if (match) {
    return { type: match[1] as 'track' | 'album' | 'playlist', id: match[2] };
  }
  return { type: null, id: null };
}

//SoundCloud (basic detection)
function isSoundCloudUrl(url: string): boolean {
  return SOUNDCLOUD_REGEX.test(url);
}

//Twitter (basic detection)
function isTwitterUrl(url: string): boolean {
  return TWITTER_REGEX.test(url);
}

//Vimeo
function extractVimeoId(url: string): string | null {
  const match = url.match(VIMEO_REGEX);
  return match ? match[1] : null;
}

const MediaEmbed: React.FC<MediaEmbedProps> = ({ content, openYouTube, setOpenYouTube, className }) => {
  const youTubeId = extractYouTubeId(content);
  const spotifyInfo = extractSpotifyInfo(content);
  const vimeoId = extractVimeoId(content);
  const isSoundCloud = isSoundCloudUrl(content);
  const isTwitter = isTwitterUrl(content);

  // YouTube
  if (youTubeId) {
    const youTubeUrl = `https://www.youtube.com/watch?v=${youTubeId}`;
    const linkText = content.match(YOUTUBE_LINKIFY_REGEX)?.[0] || 'YouTube Video';
    return (
      <>
        {(!openYouTube && setOpenYouTube) ? (
          <div className={className + ' youtubePreview'} onClick={() => setOpenYouTube(true)} style={{ cursor: 'pointer' }}>
            <img
              src={`https://img.youtube.com/vi/${youTubeId}/hqdefault.jpg`}
              alt="YouTube thumbnail"
              style={{ width: 320, height: 180, borderRadius: 8, boxShadow: '0 2px 8px #0002' }}
            />
            <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: 40, color: '#fff', textShadow: '0 2px 8px #0008' }}>▶</div>
          </div>
        ) : (
          <div style={{ width: 320, height: 180, borderRadius: 8, overflow: 'hidden', margin: '0 auto' }}>
            <iframe
              width="320"
              height="180"
              src={`https://www.youtube.com/embed/${youTubeId}?autoplay=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="YouTube video"
              style={{ borderRadius: 8, width: '100%', height: '100%' }}
            />
          </div>
        )}
        <a
          href={youTubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1976d2', textDecoration: 'underline', display: 'block', marginTop: 6 }}
        >
          {linkText}
        </a>
      </>
    );
  }

  // Spotify
  if (spotifyInfo.type && spotifyInfo.id) {
    return (
      <>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <iframe
            src={`https://open.spotify.com/embed/${spotifyInfo.type}/${spotifyInfo.id}`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            title="Spotify player"
            style={{ borderRadius: 8, minWidth: 240, maxWidth: 340 }}
          />
        </div>
        <a
          href={content.match(SPOTIFY_LINKIFY_REGEX)?.[0] || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1976d2', textDecoration: 'underline', display: 'block', marginTop: 6 }}
        >
          {content.match(SPOTIFY_LINKIFY_REGEX)?.[0] || 'Spotify Link'}
        </a>
      </>
    );
  }

  // Vimeo
  if (vimeoId) {
    return (
      <>
        <div style={{ width: 320, height: 180, borderRadius: 8, overflow: 'hidden', margin: '0 auto' }}>
          <iframe
            src={`https://player.vimeo.com/video/${vimeoId}`}
            width="320"
            height="180"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Vimeo video"
            style={{ borderRadius: 8, width: '100%', height: '100%' }}
          />
        </div>
        <a
          href={content.match(VIMEO_LINKIFY_REGEX)?.[0] || '#'}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1976d2', textDecoration: 'underline', display: 'block', marginTop: 6 }}
        >
          {content.match(VIMEO_LINKIFY_REGEX)?.[0] || 'Vimeo Link'}
        </a>
      </>
    );
  }

  // SoundCloud (iframe oEmbed)
  if (isSoundCloud) {
    return (
      <>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          <iframe
            width="100%"
            height="120"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(content)}&color=%231976d2&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`}
            title="SoundCloud player"
            style={{ borderRadius: 8, minWidth: 240, maxWidth: 340 }}
          />
        </div>
        <a
          href={content}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1976d2', textDecoration: 'underline', display: 'block', marginTop: 6 }}
        >
          {content}
        </a>
      </>
    );
  }

  // Twitter (show link only, could be extended with oEmbed API)
  if (isTwitter) {
    return (
      <a
        href={content}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#1976d2', textDecoration: 'underline', display: 'block', marginTop: 6 }}
      >
        {content}
      </a>
    );
  }

  return null;
};

export default MediaEmbed; 