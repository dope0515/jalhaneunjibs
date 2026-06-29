import { requireAdmin } from '~/server/utils/admin'
import { parseAdminPagination, buildAdminPaginationMeta } from '~/server/utils/adminPagination'
import { buildAdminOrderBy, POST_SORT_FIELDS } from '~/server/utils/adminSort'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const { page, pageSize, skip } = parseAdminPagination(query as Record<string, unknown>)
  const q = String(query.q ?? '').trim()
  const pendingOnly = query.pending === 'true'

  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
      { user: { nickname: { contains: q, mode: 'insensitive' } } },
    ]
  }

  if (pendingOnly) {
    where.reply = null
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: buildAdminOrderBy(query as Record<string, unknown>, POST_SORT_FIELDS, 'createdAt', 'desc'),
      select: {
        id: true,
        title: true,
        content: true,
        reply: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, nickname: true, email: true } },
      },
    }),
    prisma.post.count({ where }),
  ])

  return {
    posts,
    ...buildAdminPaginationMeta(total, page, pageSize),
  }
})
