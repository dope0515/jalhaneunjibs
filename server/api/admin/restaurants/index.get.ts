import { requireAdmin } from '~/server/utils/admin'
import { prisma } from '~/server/utils/prisma'

const VALID_STATUSES = ['ACTIVE', 'CLOSED', 'HIDDEN', 'TASTER'] as const

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(String(query.pageSize ?? '20'), 10) || 20))
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
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
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
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  }
})
