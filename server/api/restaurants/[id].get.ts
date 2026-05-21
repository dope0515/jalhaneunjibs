import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || isNaN(parseInt(id))) {
    throw createError({
      statusCode: 400,
      message: '유효한 식당 ID가 필요합니다.',
    })
  }

  try {
    const restaurant = await prisma.restaurant.update({
      where: { id: parseInt(id) },
      data: { viewCount: { increment: 1 } },
      include: {
        menus: {
          orderBy: { id: 'asc' }
        },
        reviews: {
          include: { 
            user: {
              select: {
                id: true,
                nickname: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        comments: {
          where: { parentId: null },
          include: {
            user: {
              select: {
                id: true,
                nickname: true
              }
            },
            replies: {
              include: { 
                user: {
                  select: {
                    id: true,
                    nickname: true
                  }
                }
              },
              orderBy: { createdAt: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return restaurant
  } catch (error: any) {
    if (error.statusCode) throw error

    // Prisma P2025: 레코드 없음
    if (error.code === 'P2025') {
      throw createError({ statusCode: 404, message: '식당을 찾을 수 없습니다.' })
    }

    console.error('Restaurant Detail API Error:', error)
    throw createError({
      statusCode: 500,
      message: '식당 정보를 불러오는 중 서버 오류가 발생했습니다.',
      data: error.message,
    })
  }
})