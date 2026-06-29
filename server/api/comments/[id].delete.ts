import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: '유효한 댓글 ID가 필요합니다.' })
  }

  const [comment, user] = await Promise.all([
    prisma.comment.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ])

  if (!comment) {
    throw createError({ statusCode: 404, message: '댓글을 찾을 수 없습니다.' })
  }

  const isAdmin = user?.role === 'ADMIN'
  if (comment.userId !== userId && !isAdmin) {
    throw createError({ statusCode: 403, message: '삭제 권한이 없습니다.' })
  }

  await prisma.comment.delete({ where: { id } })

  return { success: true }
})
