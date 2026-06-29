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
          { email: { contains: q, mode: 'insensitive' as const } },
          { nickname: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            registeredRestaurants: true,
            reviews: true,
            comments: true,
            posts: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ])

  return {
    users,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  }
})
