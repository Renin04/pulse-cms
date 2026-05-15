import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Pulse — The Blog Engine That Comes Alive';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #FF2800 0%, #CC2000 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: '72px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            lineHeight: 1.1,
            marginBottom: '24px',
          }}
        >
          Pulse
        </div>
        <div
          style={{
            fontSize: '32px',
            fontWeight: 400,
            opacity: 0.9,
            textAlign: 'center',
            maxWidth: '800px',
          }}
        >
          The Blog Engine That Comes Alive
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            fontSize: '18px',
            opacity: 0.7,
          }}
        >
          pulse.studio
        </div>
      </div>
    ),
    { ...size }
  );
}
