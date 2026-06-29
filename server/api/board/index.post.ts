import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)

  const body = await readBody(event)
  const { title, content } = body

  if (!title || !content) {
    throw createError({ statusCode: 400, statusMessage: '제목과 내용을 입력해주세요.' })
  }

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        userId
      }
    })

    return {
      success: true,
      post
    }
  } catch (error) {
    console.error('[Board API Error]:', error)
    throw createError({ statusCode: 500, statusMessage: '게시글 등록 중 오류가 발생했습니다.' })
  }
})
