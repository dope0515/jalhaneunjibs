import { requireAdmin } from '~/server/utils/admin'
import { parseAdminPagination, buildAdminPaginationMeta } from '~/server/utils/adminPagination'
import { buildAdminOrderBy, USER_SORT_FIELDS } from '~/server/utils/adminSort'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const { page, pageSize, skip } = parseAdminPagination(query as Record<string, unknown>)
  const q = String(query.q ?? '').trim()

  const where = {
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { nickname: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: buildAdminOrderBy(query as Record<string, unknown>, USER_SORT_FIELDS, 'createdAt', 'desc'),
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        status: true,
        suspendedReason: true,
        withdrawnAt: true,
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
    ...buildAdminPaginationMeta(total, page, pageSize),
  }
})
