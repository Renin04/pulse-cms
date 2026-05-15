import { ImageResponse } from 'next/og';
import { prisma } from '../../../lib/db';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface Props {
  params: { slug: string };
}

export default async function BlogPostOGImage({ params }: Props) {
  const entry = await prisma.entry.findFirst({
    where: { slug: params.slug, status: 'published' },
    select: { title: true, metadata: true, author: { select: { displayName: true } } },
  });

  const meta = entry?.metadata ? JSON.parse(entry.metadata) : {};
  const title = entry?.title ?? 'Pulse Blog';
  const excerpt = meta.seoDescription ?? '';
  const author = entry?.author?.displayName ?? 'Pulse Team';

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0d0e',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#FF2800',
            marginBottom: '32px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Pulse Blog
        </div>
        <div
          style={{
            fontSize: '56px',
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: '1000px',
            marginBottom: '24px',
          }}
        >
          {title}
        </div>
        {excerpt && (
          <div
            style={{
              fontSize: '24px',
              opacity: 0.7,
              maxWidth: '900px',
              lineHeight: 1.4,
            }}
          >
            {excerpt.slice(0, 140)}
            {excerpt.length > 140 ? '...' : ''}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: '48px',
            fontSize: '20px',
            opacity: 0.6,
          }}
        >
          By {author}
        </div>
      </div>
    ),
    { ...size }
  );
}
