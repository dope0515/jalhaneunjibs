import { requireAdmin } from '~/server/utils/admin'
import { prisma } from '~/server/utils/prisma'
import { getCloudinaryUsage } from '~/server/utils/cloudinary'

interface TableSize {
  name: string
  bytes: number
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  // ── DB 용량 ────────────────────────────────────────────────
  let dbUsedBytes: number | null = null
  let tables: TableSize[] = []
  try {
    const sizeRows = await prisma.$queryRaw<{ size: bigint }[]>`
      SELECT pg_database_size(current_database()) AS size
    `
    dbUsedBytes = sizeRows.length ? Number(sizeRows[0].size) : null

    const tableRows = await prisma.$queryRaw<{ name: string; size: bigint }[]>`
      SELECT relname AS name, pg_total_relation_size(relid) AS size
      FROM pg_catalog.pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 8
    `
    tables = tableRows.map((r) => ({ name: r.name, bytes: Number(r.size) }))
  } catch (error) {
    console.error('[Admin Storage] DB size query failed:', error)
  }

  // DB 한도는 자체 호스팅이라 자동 조회 불가 → env로 선택 지정
  const dbLimitMb = Number(process.env.DB_STORAGE_LIMIT_MB)
  const dbLimitBytes = Number.isFinite(dbLimitMb) && dbLimitMb > 0
    ? dbLimitMb * 1024 * 1024
    : null

  // ── Cloudinary 용량 ───────────────────────────────────────
  let cloudinary = null
  try {
    cloudinary = await getCloudinaryUsage()
  } catch (error) {
    console.error('[Admin Storage] Cloudinary usage query failed:', error)
  }

  return {
    db: {
      usedBytes: dbUsedBytes,
      limitBytes: dbLimitBytes,
      tables,
    },
    cloudinary,
    generatedAt: new Date().toISOString(),
  }
})
