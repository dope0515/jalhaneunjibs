import { requireAdmin } from '~/server/utils/admin'
import { parseAdminPagination, buildAdminPaginationMeta } from '~/server/utils/adminPagination'
import { buildAdminOrderBy, RESTAURANT_SORT_FIELDS } from '~/server/utils/adminSort'
import { prisma } from '~/server/utils/prisma'

const VALID_STATUSES = ['ACTIVE', 'CLOSED', 'HIDDEN'] as const

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const { page, pageSize, skip } = parseAdminPagination(query as Record<string, unknown>)
  const q = String(query.q ?? '').trim()
  const status = String(query.status ?? '').trim()

  const where: Record<string, unknown> = {}

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
    ]
  }

  if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    where.status = status
  }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: buildAdminOrderBy(query as Record<string, unknown>, RESTAURANT_SORT_FIELDS, 'createdAt', 'desc'),
      select: {
        id: true,
        name: true,
        foodCategory: true,
        status: true,
        address: true,
        region2: true,
        viewCount: true,
        reviewCount: true,
        averageRating: true,
        createdAt: true,
        registeredBy: { select: { id: true, nickname: true, email: true } },
        _count: { select: { menus: true, comments: true } },
      },
    }),
    prisma.restaurant.count({ where }),
  ])

  return {
    restaurants,
    ...buildAdminPaginationMeta(total, page, pageSize),
  }
})
