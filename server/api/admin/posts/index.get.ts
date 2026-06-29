import { requireAdmin } from '~/server/utils/admin'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const query = getQuery(event)
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(String(query.pageSize ?? '20'), 10) || 20))
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
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
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
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  }
})
