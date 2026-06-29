import { requireAdmin } from '~/server/utils/admin'
import { parseAdminPagination, buildAdminPaginationMeta } from '~/server/utils/adminPagination'
import { buildAdminOrderBy, COMMENT_SORT_FIELDS } from '~/server/utils/adminSort'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const { page, pageSize, skip } = parseAdminPagination(query as Record<string, unknown>)
  const q = String(query.q ?? '').trim()

  const where = q
    ? {
        OR: [
          { content: { contains: q, mode: 'insensitive' as const } },
          { restaurant: { name: { contains: q, mode: 'insensitive' as const } } },
          { user: { nickname: { contains: q, mode: 'insensitive' as const } } },
        ],
      }
    : {}

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: buildAdminOrderBy(query as Record<string, unknown>, COMMENT_SORT_FIELDS, 'createdAt', 'desc'),
      select: {
        id: true,
        content: true,
        parentId: true,
        createdAt: true,
        user: { select: { id: true, nickname: true, email: true } },
        restaurant: { select: { id: true, name: true } },
        _count: { select: { replies: true } },
      },
    }),
    prisma.comment.count({ where }),
  ])

  return {
    comments,
    ...buildAdminPaginationMeta(total, page, pageSize),
  }
})
