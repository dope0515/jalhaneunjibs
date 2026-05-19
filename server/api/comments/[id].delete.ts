import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: '유효한 댓글 ID가 필요합니다.' })
  }

  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) {
    throw createError({ statusCode: 404, message: '댓글을 찾을 수 없습니다.' })
  }

  await prisma.comment.delete({ where: { id } })

  return { success: true }
})
