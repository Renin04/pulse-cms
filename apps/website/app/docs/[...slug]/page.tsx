import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { docsLeafPages, getDocLeaf } from '../../../lib/site-content';
import DocLeafContent from '../DocLeafContent';

interface DocLeafPageProps {
  params: {
    slug: string[];
  };
}

export function generateStaticParams() {
  return docsLeafPages.map((page) => ({
    slug: page.slug,
  }));
}

export function generateMetadata({ params }: DocLeafPageProps): Metadata {
  const page = getDocLeaf(params.slug);

  if (!page) {
    return {
      title: 'Doc Not Found - Pulse',
    };
  }

  const slugPath = params.slug.join('/');
  return {
    title: `${page.title} - Pulse Docs`,
    description: page.summary,
    alternates: {
      canonical: `/docs/${slugPath}`,
    },
    openGraph: {
      title: `${page.title} - Pulse Docs`,
      description: page.summary,
      type: 'article',
    },
  };
}

export default function DocLeafPage({ params }: DocLeafPageProps) {
  const page = getDocLeaf(params.slug);

  if (!page) {
    notFound();
  }

  return <DocLeafContent page={page} />;
}
