import Image from 'next/image';
import { photos, type PhotoKey } from '@/lib/images';
import { cn } from '@/lib/cn';

type Props = {
  photo: PhotoKey;
  /** Descriptive, localized alt text. Comes from the dictionary. */
  alt: string;
  /** Tailwind aspect-ratio class, e.g. `aspect-[4/3]`. Reserves the space. */
  aspect: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  imageClassName?: string;
};

/**
 * Renders an image slot from `src/lib/images.ts`.
 *
 * Assets live in `public/images/`, so they are served from this origin — no CDN
 * and no third-party request. Vector assets skip the image optimizer: there is
 * nothing to resize, and it avoids having to enable Next's `dangerouslyAllowSVG`
 * escape hatch. Raster assets go through the optimizer as usual and are emitted
 * as AVIF/WebP.
 */
export function Photo({
  photo,
  alt,
  aspect,
  className,
  sizes,
  priority = false,
  imageClassName,
}: Props) {
  const asset = photos[photo];
  const isVector = asset.src.endsWith('.svg');

  return (
    <div
      className={cn(
        'rounded-card border-line bg-surface-sunken shadow-card relative overflow-hidden border',
        aspect,
        className,
      )}
    >
      <Image
        src={asset.src}
        alt={alt}
        fill
        priority={priority}
        unoptimized={isVector}
        sizes={sizes ?? '(min-width: 1024px) 50vw, 100vw'}
        className={cn('object-cover', imageClassName)}
      />
    </div>
  );
}
