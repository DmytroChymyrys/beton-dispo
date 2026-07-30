# Images

All site imagery lives here, committed to the repository and served from the
site's own origin. Nothing is loaded from a CDN or third-party host.

The active BétonDispo page photography is in `public/images/betondispo/`.
These are representative images only. Do not write captions, headings or copy
that suggest BétonDispo owns the pictured trucks, pumps or equipment.

Alt text lives in `src/messages/{fr,en}.json`; do not hardcode it in components.

## Slots

| Key | File | Used on |
| --- | --- | --- |
| `heroPour` | `betondispo/betondispo-concrete-delivery-residential.webp` | Home hero |
| `mixerTruck` | `betondispo/betondispo-concrete-delivery-residential.webp` | Services delivery |
| `volumetricMixer` | `betondispo/betondispo-mobile-concrete-mixer.webp` | Services mobile concrete |
| `pumpHose` | `betondispo/betondispo-concrete-pump-foundation.webp` | Services pumping |
| `slabFinishing` | `betondispo/betondispo-concrete-slab-finishing.webp` | Home audience |
| `boomPump` | `betondispo/betondispo-concrete-pump-foundation.webp` | Home final CTA |
| `foundationPour` | `betondispo/betondispo-foundation-concrete-pour.webp` | Supporting content |
| `reinforcedSlab` | `betondispo/betondispo-reinforced-concrete-slab.webp` | Supporting content |
| `manholeRing` | `betondispo/betondispo-concrete-manhole-ring.webp` | Supporting content |

## Rules

- No competitor branding.
- Nothing that implies ownership: avoid phrases like "our fleet", "our trucks"
  or "our equipment".
- Use `next/image` through the shared `<Photo>` component for site imagery.
- Keep below-the-fold images lazy-loaded; only the homepage hero should be
  priority-loaded.
