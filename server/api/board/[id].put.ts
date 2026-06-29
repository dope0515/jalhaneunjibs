import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const id = Number(getRouterParam(event, 'id'))

  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: '잘못된 요청입니다.' })
  }

  const { title, content } = await readBody(event)

  if (!title || !content || !title.trim() || !content.trim()) {
    throw createError({ statusCode: 400, statusMessage: '제목과 내용을 모두 입력해주세요.' })
  }

  const post = await prisma.post.findUnique({
    where: { id }
  })

  if (!post) {
    throw createError({ statusCode: 404, statusMessage: '게시글을 찾을 수 없습니다.' })
  }

  if (post.userId !== userId) {
    throw createError({ statusCode: 403, statusMessage: '수정 권한이 없습니다.' })
  }

  const updatedPost = await prisma.post.update({
    where: { id },
    data: { title, content }
  })

  return { success: true, post: updatedPost }
})
