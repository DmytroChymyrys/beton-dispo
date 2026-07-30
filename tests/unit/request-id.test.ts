import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';

/**
 * Request-ID generation is a Postgres concern — `public_id` is a stored
 * generated column fed by a sequence — so it can only be verified against a
 * real database.
 *
 * Runs against a local Postgres (`DATABASE_URL` pointing at localhost) and is
 * skipped otherwise, so `npm test` stays green on a machine with no database.
 */
const url = process.env.DATABASE_URL ?? '';
const isLocal = /^postgres(ql)?:\/\/[^/]*@?(localhost|127\.0\.0\.1)/.test(url);

/**
 * A local URL in `.env.local` doesn't mean a database is actually running, so
 * the suite probes first. Otherwise `npm test` fails on a machine that simply
 * has no Postgres started, which is not a defect in the code under test.
 */
async function isReachable(): Promise<boolean> {
  if (!isLocal) return false;
  const probe = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 1500 });
  try {
    await probe.query('select 1');
    return true;
  } catch {
    return false;
  } finally {
    await probe.end().catch(() => {});
  }
}

const reachable = await isReachable();

const insert = `
  insert into quote_requests
    (customer_type, name, email, phone, preferred_contact_method,
     address, city, postal_code, project_type, desired_date)
  values ('INDIVIDUAL', $1, 'id-test@example.com', '450-555-0100', 'EMAIL',
          '1 rue Test', 'Test-ID-City', 'J4W 1A1', 'SLAB', current_date + 7)
  returning public_id, reference_number
`;

describe.skipIf(!reachable)('public_id generation', () => {
  let pool: Pool;

  beforeAll(() => {
    pool = new Pool({ connectionString: url, max: 1 });
  });

  afterAll(async () => {
    await pool.query(`delete from quote_requests where city = 'Test-ID-City'`);
    await pool.end();
  });

  it('formats the reference as BD- plus six zero-padded digits', async () => {
    const { rows } = await pool.query<{ public_id: string; reference_number: string }>(insert, [
      'ID Test A',
    ]);
    expect(rows[0]?.public_id).toMatch(/^BD-\d{6}$/);
  });

  it('increments and never repeats a reference', async () => {
    const a = await pool.query<{ public_id: string; reference_number: string }>(insert, ['A']);
    const b = await pool.query<{ public_id: string; reference_number: string }>(insert, ['B']);

    const first = Number(a.rows[0]?.reference_number);
    const second = Number(b.rows[0]?.reference_number);
    expect(second).toBe(first + 1);
    expect(a.rows[0]?.public_id).not.toBe(b.rows[0]?.public_id);
  });

  it('derives public_id from reference_number', async () => {
    const { rows } = await pool.query<{ public_id: string; reference_number: string }>(insert, [
      'ID Test C',
    ]);
    const reference = Number(rows[0]?.reference_number);
    expect(rows[0]?.public_id).toBe(`BD-${String(reference).padStart(6, '0')}`);
  });

  it('cannot be overwritten by a client — the column is GENERATED ALWAYS', async () => {
    await expect(
      pool.query(
        `insert into quote_requests
           (public_id, customer_type, name, email, phone, preferred_contact_method,
            address, city, postal_code, project_type, desired_date)
         values ('BD-999999', 'INDIVIDUAL', 'Spoof', 's@example.com', '450-555-0100', 'EMAIL',
                 '1 rue Test', 'Test-ID-City', 'J4W 1A1', 'SLAB', current_date + 7)`,
      ),
    ).rejects.toThrow();
  });
});
