/**
 * Development seed data.
 *
 * Run with `npm run db:seed`. Refuses to run against anything that looks like
 * production: fake customer requests would corrupt the only Phase-1 KPI we
 * have, which is the count of qualified quote requests.
 */
import { config } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { quoteRequests, type NewQuoteRequest } from './schema';

config({ path: '.env.local', quiet: true });
config({ path: '.env', quiet: true });

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
  console.error('Refusing to seed: this is a production environment.');
  process.exit(1);
}

/** Dates are relative to "today" so seeded requests never look stale. */
function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const rows: NewQuoteRequest[] = [
  {
    locale: 'fr',
    customerType: 'BUSINESS',
    name: 'Martin Tremblay',
    companyName: 'Excavation Tremblay inc.',
    email: 'martin@example.com',
    phone: '450-555-0142',
    preferredContactMethod: 'PHONE',
    address: '145 rue des Érables',
    city: 'Brossard',
    postalCode: 'J4W 2K3',
    accessNotes: 'Accès par la ruelle arrière, portail de 3 m.',
    projectType: 'FOUNDATION',
    estimatedVolumeM3: '6.00',
    volumeUnknown: false,
    concreteStrength: 'MPA_30',
    pumpRequired: 'YES',
    pumpNotes: 'Coulée en cour arrière, environ 30 m de boyau.',
    desiredDate: inDays(9),
    preferredTime: 'MORNING',
    scheduleFlexible: false,
    additionalNotes: 'Semelles déjà coulées, coffrage prêt.',
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'beton-rive-sud',
    landingPage: '/fr',
    status: 'NEW',
  },
  {
    locale: 'fr',
    customerType: 'INDIVIDUAL',
    name: 'Julie Lavoie',
    email: 'julie.lavoie@example.com',
    phone: '514-555-0188',
    preferredContactMethod: 'EMAIL',
    address: '8 avenue du Parc',
    city: 'Candiac',
    postalCode: 'J5R 6R2',
    projectType: 'GARAGE',
    estimatedVolumeM3: null,
    volumeUnknown: true,
    concreteStrength: 'UNKNOWN',
    pumpRequired: 'UNKNOWN',
    desiredDate: inDays(21),
    preferredTime: 'FLEXIBLE',
    scheduleFlexible: true,
    additionalNotes: "Dalle de garage d'environ 20 pi x 24 pi. Je ne connais pas le volume exact.",
    utmSource: 'facebook',
    utmMedium: 'social',
    landingPage: '/fr',
    status: 'CONTACTED',
    internalNotes: 'Rappelée le 2 du mois — attend la confirmation de son entrepreneur.',
  },
  {
    locale: 'en',
    customerType: 'BUSINESS',
    name: 'Peter Nolan',
    companyName: 'Nolan Commercial Builders',
    email: 'peter@example.com',
    phone: '450-555-0170',
    preferredContactMethod: 'SMS',
    address: '2200 boulevard Industriel',
    city: 'Longueuil',
    postalCode: 'J4G 1P1',
    accessNotes: 'Loading bay access, site open 6h-18h.',
    projectType: 'COMMERCIAL',
    estimatedVolumeM3: '10.00',
    volumeUnknown: false,
    concreteStrength: 'MPA_35',
    pumpRequired: 'NO',
    desiredDate: inDays(14),
    scheduleFlexible: true,
    additionalNotes: 'Flexible on the date, needs to be a weekday.',
    utmSource: 'google',
    utmMedium: 'organic',
    landingPage: '/en',
    status: 'QUALIFIED',
  },
];

async function main() {
  const pool = new Pool({ connectionString: url, max: 1 });
  const db = drizzle(pool);

  try {
    const inserted = await db
      .insert(quoteRequests)
      .values(rows)
      .returning({ publicId: quoteRequests.publicId, city: quoteRequests.city });

    for (const row of inserted) {
      console.log(`Seeded ${row.publicId} — ${row.city}`);
    }
  } catch (error) {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

void main();
