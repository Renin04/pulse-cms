import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Pulse — The Blog Engine That Comes Alive',
    short_name: 'Pulse',
    description: 'A modular, AI-powered, interactive blog engine.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#FF2800',
    icons: [
      {
        src: '/brand/pulse-mark.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/brand/pulse-mark.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
