'use client'

import { useEffect, useState } from 'react'
import {
  BLOG_STUDIO_STORAGE_KEY,
  isBootstrapBlogStudioSnapshot,
  loadBlogStudioSnapshot,
  sanitizeBlogStudioSnapshot,
  saveBlogStudioSnapshot,
  type BlogStudioSnapshot,
} from './blog-studio'

const BLOG_STUDIO_PUBLIC_SNAPSHOT_PATH = '/blog-snapshot.json'
const BLOG_STUDIO_SYNC_EVENT = 'pulse:blog-studio-sync'

let pendingSnapshotPromise: Promise<BlogStudioSnapshot> | null = null

export function emitBrowserBlogStudioSync(): void {
  window.dispatchEvent(new CustomEvent(BLOG_STUDIO_SYNC_EVENT))
}

export function saveBrowserBlogStudioSnapshot(snapshot: BlogStudioSnapshot): void {
  saveBlogStudioSnapshot(snapshot, window.localStorage)
  emitBrowserBlogStudioSync()
}

async function fetchPublishedBlogStudioSnapshot(): Promise<BlogStudioSnapshot> {
  const response = await fetch(BLOG_STUDIO_PUBLIC_SNAPSHOT_PATH, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Unable to load ${BLOG_STUDIO_PUBLIC_SNAPSHOT_PATH} (${response.status})`)
  }

  return sanitizeBlogStudioSnapshot(await response.json())
}

export async function ensureBrowserBlogStudioSnapshot(): Promise<BlogStudioSnapshot> {
  if (pendingSnapshotPromise) {
    return pendingSnapshotPromise
  }

  pendingSnapshotPromise = (async () => {
    const hasStoredSnapshot = window.localStorage.getItem(BLOG_STUDIO_STORAGE_KEY) !== null
    const localSnapshot = loadBlogStudioSnapshot(window.localStorage)

    if (hasStoredSnapshot && !isBootstrapBlogStudioSnapshot(localSnapshot)) {
      saveBlogStudioSnapshot(localSnapshot, window.localStorage)
      return localSnapshot
    }

    try {
      const publishedSnapshot = await fetchPublishedBlogStudioSnapshot()
      saveBlogStudioSnapshot(publishedSnapshot, window.localStorage)
      emitBrowserBlogStudioSync()
      return publishedSnapshot
    } catch (error) {
      console.warn('Could not bootstrap the published blog snapshot from disk:', error)
      return localSnapshot
    }
  })()

  try {
    return await pendingSnapshotPromise
  } finally {
    pendingSnapshotPromise = null
  }
}

export function useBlogStudioSnapshot(): BlogStudioSnapshot | null {
  const [snapshot, setSnapshot] = useState<BlogStudioSnapshot | null>(null)

  useEffect(() => {
    let isActive = true

    const syncFromStorage = () => {
      if (!isActive) {
        return
      }

      setSnapshot(loadBlogStudioSnapshot(window.localStorage))
    }

    void ensureBrowserBlogStudioSnapshot().then((nextSnapshot) => {
      if (isActive) {
        setSnapshot(nextSnapshot)
      }
    })

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== BLOG_STUDIO_STORAGE_KEY) {
        return
      }

      syncFromStorage()
    }

    window.addEventListener(BLOG_STUDIO_SYNC_EVENT, syncFromStorage)
    window.addEventListener('storage', handleStorage)

    return () => {
      isActive = false
      window.removeEventListener(BLOG_STUDIO_SYNC_EVENT, syncFromStorage)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return snapshot
}
