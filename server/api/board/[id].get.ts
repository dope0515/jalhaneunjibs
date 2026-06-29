import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const id = Number(getRouterParam(event, 'id'))

  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: '잘못된 요청입니다.' })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: {
        select: { nickname: true }
      }
    }
  })

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: '게시글을 찾을 수 없습니다.' })
  }

  if (post.userId !== userId && user?.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: '접근 권한이 없습니다.' })
  }

  return { success: true, post, isAdmin: user?.role === 'ADMIN' }
})
