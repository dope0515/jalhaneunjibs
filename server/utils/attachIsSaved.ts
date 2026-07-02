import { prisma } from '~/server/utils/prisma'

export async function attachIsSavedToRestaurants<T extends { id: number }>(
  userId: number,
  restaurants: T[],
): Promise<(T & { isSaved: boolean })[]> {
  if (restaurants.length === 0) return []

  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      restaurantId: { in: restaurants.map((r) => r.id) },
    },
    select: { restaurantId: true },
  })
  const savedIds = new Set(favorites.map((f) => f.restaurantId))

  return restaurants.map((r) => ({
    ...r,
    isSaved: savedIds.has(r.id),
  }))
}
