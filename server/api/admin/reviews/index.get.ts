import { requireAdmin } from '~/server/utils/admin'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(String(query.pageSize ?? '20'), 10) || 20))
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

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        content: true,
        images: true,
        createdAt: true,
        user: { select: { id: true, nickname: true, email: true } },
        restaurant: { select: { id: true, name: true } },
      },
    }),
    prisma.review.count({ where }),
  ])

  return {
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  }
})
