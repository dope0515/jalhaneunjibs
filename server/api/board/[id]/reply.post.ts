import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
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

  if (user?.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: '관리자 권한이 필요합니다.' })
  }

  const { reply } = await readBody(event)

  if (!reply || !reply.trim()) {
    throw createError({ statusCode: 400, statusMessage: '답변 내용을 입력해주세요.' })
  }

  const post = await prisma.post.update({
    where: { id },
    data: { reply }
  })

  return { success: true, post }
})
