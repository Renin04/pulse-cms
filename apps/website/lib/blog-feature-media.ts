import type { BlogStudioEntry, BlogStudioEntrySnapshot, StudioBlock } from './blog-studio'

type EntryLike = Partial<BlogStudioEntry> &
  Partial<BlogStudioEntrySnapshot> & {
    title: string
    blocks?: StudioBlock[]
    html?: string
  }

interface FeaturedMedia {
  src: string
  alt: string
}

const MEDIA_FIELD_CANDIDATES = [
  'featuredImage',
  'featuredImageUrl',
  'coverImage',
  'coverImageUrl',
  'heroImage',
  'heroImageUrl',
  'ogImage',
] as const

const MEDIA_ALT_CANDIDATES = [
  'featuredImageAlt',
  'coverImageAlt',
  'heroImageAlt',
  'imageAlt',
  'ogImageAlt',
] as const

const BLOCK_IMAGE_KEYS = ['src', 'imageUrl', 'backgroundUrl', 'coverImage', 'thumbnailUrl'] as const

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function looksLikeImageUrl(value: string): boolean {
  return (
    value.startsWith('/') ||
    value.startsWith('data:image/') ||
    /^https?:\/\//i.test(value)
  )
}

function getEntryField(entry: EntryLike, keys: readonly string[]): string | undefined {
  const record = entry as Record<string, unknown>

  for (const key of keys) {
    const value = asOptionalString(record[key])
    if (value && looksLikeImageUrl(value)) {
      return value
    }
  }

  return undefined
}

function getEntryAlt(entry: EntryLike): string | undefined {
  const record = entry as Record<string, unknown>

  for (const key of MEDIA_ALT_CANDIDATES) {
    const value = asOptionalString(record[key])
    if (value) {
      return value
    }
  }

  return undefined
}

function getBlockMedia(blocks: StudioBlock[], title: string): FeaturedMedia | null {
  for (const block of blocks) {
    const data = (block.data ?? {}) as Record<string, unknown>

    if (block.type === 'image') {
      const src = asOptionalString(data.src)
      if (src && looksLikeImageUrl(src)) {
        return {
          src,
          alt: asOptionalString(data.alt) ?? `${title} featured image`,
        }
      }
    }

    if (block.type === 'gallery' && Array.isArray(data.images)) {
      const firstImage = data.images.find(
        (image): image is Record<string, unknown> =>
          typeof image === 'object' && image !== null && !Array.isArray(image),
      )

      if (firstImage) {
        const src = asOptionalString(firstImage.src)
        if (src && looksLikeImageUrl(src)) {
          return {
            src,
            alt: asOptionalString(firstImage.alt) ?? `${title} featured image`,
          }
        }
      }
    }

    for (const key of BLOCK_IMAGE_KEYS) {
      const src = asOptionalString(data[key])
      if (src && looksLikeImageUrl(src)) {
        return {
          src,
          alt: asOptionalString(data.alt) ?? `${title} featured image`,
        }
      }
    }
  }

  return null
}

function getHtmlMedia(html: string, title: string): FeaturedMedia | null {
  const imgMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/i)
  if (imgMatch?.[1]) {
    return {
      src: imgMatch[1],
      alt: imgMatch[2] || `${title} featured image`,
    }
  }

  const backgroundMatch = html.match(/background-image:url\('([^']+)'\)/i)
  if (backgroundMatch?.[1]) {
    return {
      src: backgroundMatch[1],
      alt: `${title} featured image`,
    }
  }

  return null
}

export function getBlogFeaturedMedia(entry: EntryLike): FeaturedMedia | null {
  const directSrc = getEntryField(entry, MEDIA_FIELD_CANDIDATES)
  if (directSrc) {
    return {
      src: directSrc,
      alt: getEntryAlt(entry) ?? `${entry.title} featured image`,
    }
  }

  if (Array.isArray(entry.blocks)) {
    const blockMedia = getBlockMedia(entry.blocks, entry.title)
    if (blockMedia) {
      return blockMedia
    }
  }

  if (typeof entry.html === 'string' && entry.html.trim()) {
    return getHtmlMedia(entry.html, entry.title)
  }

  return null
}
