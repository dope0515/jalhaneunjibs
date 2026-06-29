import { requireAdmin } from '~/server/utils/admin'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    userCount,
    newUsersWeek,
    restaurantCount,
    newRestaurantsWeek,
    reviewCount,
    commentCount,
    postCount,
    pendingPosts,
    tasterCount,
    hiddenCount,
    recentRestaurants,
    recentReviews,
    recentPosts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.restaurant.count(),
    prisma.restaurant.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.review.count(),
    prisma.comment.count(),
    prisma.post.count(),
    prisma.post.count({ where: { reply: null } }),
    prisma.restaurant.count({ where: { status: 'TASTER' } }),
    prisma.restaurant.count({ where: { status: 'HIDDEN' } }),
    prisma.restaurant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        foodCategory: true,
        createdAt: true,
        registeredBy: { select: { nickname: true, email: true } },
      },
    }),
    prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        content: true,
        createdAt: true,
        user: { select: { nickname: true } },
        restaurant: { select: { id: true, name: true } },
      },
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        reply: true,
        createdAt: true,
        user: { select: { nickname: true } },
      },
    }),
  ])

  return {
    stats: {
      userCount,
      newUsersWeek,
      restaurantCount,
      newRestaurantsWeek,
      reviewCount,
      commentCount,
      postCount,
      pendingPosts,
      tasterCount,
      hiddenCount,
    },
    recent: {
      restaurants: recentRestaurants,
      reviews: recentReviews,
      posts: recentPosts,
    },
  }
})
