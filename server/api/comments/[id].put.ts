import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: '유효한 댓글 ID가 필요합니다.' })
  }

  const body = await readBody(event)
  const { content } = body

  if (!content?.trim()) {
    throw createError({ statusCode: 400, message: '내용을 입력해주세요.' })
  }

  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) {
    throw createError({ statusCode: 404, message: '댓글을 찾을 수 없습니다.' })
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content: content.trim() },
  })

  return { success: true, comment: updated }
})
