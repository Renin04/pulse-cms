import Image from 'next/image';
import Link from 'next/link';

type BrandVariant = 'full' | 'mark' | 'wordmark';

interface BrandMarkProps {
  href?: string;
  variant?: BrandVariant;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

const assets = {
  full: {
    src: '/brand/pulse-logo-full.png',
    width: 1712,
    height: 2575,
    imageClassName: 'w-[8.75rem] sm:w-[9.5rem]',
  },
  mark: {
    src: '/brand/pulse-mark.png',
    width: 1712,
    height: 1647,
    imageClassName: 'w-11 sm:w-12',
  },
  wordmark: {
    src: '/brand/pulse-wordmark.png',
    width: 1309,
    height: 816,
    imageClassName: 'w-[8.25rem] sm:w-[8.75rem]',
  },
} satisfies Record<
  BrandVariant,
  { src: string; width: number; height: number; imageClassName: string }
>;

export default function BrandMark({
  href = '/',
  variant = 'full',
  className,
  imageClassName,
  priority = false,
}: BrandMarkProps) {
  const asset = assets[variant];

  return (
    <Link
      href={href}
      className={cx('inline-flex items-center', className)}
      aria-label="Pulse home"
    >
      <Image
        src={asset.src}
        alt=""
        aria-hidden="true"
        width={asset.width}
        height={asset.height}
        priority={priority}
        className={cx('h-auto', imageClassName || asset.imageClassName)}
      />
    </Link>
  );
}
