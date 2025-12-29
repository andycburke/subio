const { Client } = require('pg');

async function resetDB() {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  process.stdout.write('Dropping migration tracking table...\n');
  await client.query('DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE');

  process.stdout.write('Done! Now run: npm run db:migrate\n');
  await client.end();
}

resetDB().catch((err) => {
  process.stderr.write(`${String(err)}\n`);
  process.exitCode = 1;
});
