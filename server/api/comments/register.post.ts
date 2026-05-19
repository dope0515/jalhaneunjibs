import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { content, restaurantId, userId, parentId } = body

  if (!content || !restaurantId || !userId) {
    throw createError({
      statusCode: 400,
      statusMessage: '필수 정보가 누락되었습니다.',
    })
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      restaurantId: parseInt(restaurantId),
      userId: parseInt(userId),
      parentId: parentId ? parseInt(parentId) : null,
    },
    include: {
      user: true,
      replies: {
        include: { user: true }
      }
    }
  })

  return {
    success: true,
    comment
  }
})