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
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: parseInt(id) },
      include: {
        menus: {
          orderBy: { id: 'asc' }
        },
        reviews: {
          include: { 
            user: {
              select: {
                id: true,
                username: true,
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
                username: true,
                nickname: true
              }
            },
            replies: {
              include: { 
                user: {
                  select: {
                    id: true,
                    username: true,
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

    if (!restaurant) {
      throw createError({
        statusCode: 404,
        message: '식당을 찾을 수 없습니다.',
      })
    }

    return restaurant
  } catch (error: any) {
    console.error('Restaurant Detail API Error:', error)

    if (error.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: '식당 정보를 불러오는 중 서버 오류가 발생했습니다.',
      data: error.message
    })
  }
})