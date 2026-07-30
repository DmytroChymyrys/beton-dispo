/**
 * Photography / artwork slots.
 *
 * Every slot points at a real asset committed to `public/images/` and served
 * from the site's own origin — there is no CDN dependency and no third-party
 * request on page load.
 *
 * These representative photographs are served from the project public assets.
 * They must never be captioned or framed in a way that suggests BétonDispo owns
 * the pictured trucks or equipment.
 *
 * See `public/images/README.md` for the subject matter and licensing rules.
 */
export type PhotoKey =
  | 'heroPour'
  | 'slabFinishing'
  | 'boomPump'
  | 'mixerTruck'
  | 'volumetricMixer'
  | 'pumpHose'
  | 'foundationPour'
  | 'reinforcedSlab'
  | 'manholeRing';

type PhotoAsset = {
  /** Path under /public. */
  src: string;
  /** Intrinsic size, so the box is reserved before the asset loads. */
  width: number;
  height: number;
};

export const photos: Record<PhotoKey, PhotoAsset> = {
  heroPour: {
    src: '/images/betondispo/betondispo-concrete-delivery-residential.webp',
    width: 487,
    height: 518,
  },
  slabFinishing: {
    src: '/images/betondispo/betondispo-concrete-slab-finishing.webp',
    width: 357,
    height: 309,
  },
  boomPump: {
    src: '/images/betondispo/betondispo-concrete-pump-foundation.webp',
    width: 485,
    height: 518,
  },
  mixerTruck: {
    src: '/images/betondispo/betondispo-concrete-delivery-residential.webp',
    width: 487,
    height: 518,
  },
  volumetricMixer: {
    src: '/images/betondispo/betondispo-mobile-concrete-mixer.webp',
    width: 484,
    height: 518,
  },
  pumpHose: {
    src: '/images/betondispo/betondispo-concrete-pump-foundation.webp',
    width: 485,
    height: 518,
  },
  foundationPour: {
    src: '/images/betondispo/betondispo-foundation-concrete-pour.webp',
    width: 358,
    height: 309,
  },
  reinforcedSlab: {
    src: '/images/betondispo/betondispo-reinforced-concrete-slab.webp',
    width: 359,
    height: 309,
  },
  manholeRing: {
    src: '/images/betondispo/betondispo-concrete-manhole-ring.webp',
    width: 356,
    height: 309,
  },
};
