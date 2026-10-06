const { Client } = require("pg")

const additions = {
  super_admin: ["manual_transfers.read", "manual_transfers.review"],
  general_manager: ["manual_transfers.read", "manual_transfers.review"],
  finance_manager: ["manual_transfers.read", "manual_transfers.review"],
  accountant: ["manual_transfers.read"],
  sales_manager: ["manual_transfers.read"],
  auditor: ["manual_transfers.read"],
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  try {
    await client.query("BEGIN")
    let updated = 0
    for (const [slug, permissions] of Object.entries(additions)) {
      const result = await client.query(
        `UPDATE rbac_role
         SET permissions = (
           SELECT jsonb_agg(DISTINCT item)
           FROM jsonb_array_elements(COALESCE(permissions, '[]'::jsonb) || $2::jsonb) item
         ), updated_at = now()
         WHERE slug = $1 AND is_system = true AND deleted_at IS NULL`,
        [slug, JSON.stringify(permissions)]
      )
      updated += result.rowCount
    }
    await client.query("COMMIT")
    const check = await client.query(
      `SELECT count(*)::int AS count FROM rbac_role
       WHERE slug = ANY($1::text[]) AND deleted_at IS NULL
       AND permissions ? 'manual_transfers.read'`,
      [Object.keys(additions)]
    )
    console.log(`RBAC_SYNC_OK updated=${updated} verified_read=${check.rows[0].count}`)
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
