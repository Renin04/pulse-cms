'use client';

import { useEffect } from 'react';
import { ensureBrowserBlogStudioSnapshot } from '../../lib/browser-blog-studio';

export default function BlogStudioInitializer() {
  useEffect(() => {
    void ensureBrowserBlogStudioSnapshot();
  }, []);

  return null;
}
