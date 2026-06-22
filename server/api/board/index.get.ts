import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { tryGetUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const userId = tryGetUserId(event)

  if (!userId) {
    return {
      success: true,
      posts: []
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    const posts = await prisma.post.findMany({
      where: user?.role === 'ADMIN' ? {} : { userId },
      include: {
        user: {
          select: {
            nickname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return {
      success: true,
      posts,
      isAdmin: user?.role === 'ADMIN'
    }
  } catch (error) {
    console.error('[Board GET API Error]:', error)
    return {
      success: false,
      posts: []
    }
  }
})
