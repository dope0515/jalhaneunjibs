import { defineEventHandler, getQuery } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { tryGetActiveUserId } from '~/server/utils/auth'

const REGION_VARIATIONS: Record<string, string[]> = {
  '서울': ['서울', '서울특별시'],
  '부산': ['부산', '부산광역시'],
  '대구': ['대구', '대구광역시'],
  '인천': ['인천', '인천광역시'],
  '광주': ['광주', '광주광역시'],
  '대전': ['대전', '대전광역시'],
  '울산': ['울산', '울산광역시'],
  '세종': ['세종', '세종시', '세종특별자치시'],
  '경기': ['경기', '경기도'],
  '강원': ['강원', '강원도', '강원특별자치도'],
  '충북': ['충북', '충청북도'],
  '충남': ['충남', '충청남도'],
  '전북': ['전북', '전라북도', '전북특별자치도'],
  '전남': ['전남', '전라남도'],
  '경북': ['경북', '경상북도'],
  '경남': ['경남', '경상남도'],
  '제주': ['제주', '제주도', '제주특별자치도'],
}

export default defineEventHandler(async (event) => {
  const { category, region1, region2, keyword, priceMin, priceMax, page = '1', sort = 'latest' } = getQuery(event)
  const userId = await tryGetActiveUserId(event)

  const pageNum = Math.max(1, parseInt(page as string))
  const pageSize = 6
  const skip = (pageNum - 1) * pageSize

  const where: Record<string, any> = {
    status: (getQuery(event).status as any) || 'ACTIVE'
  }
  if (category) {
    const categories = (category as string).split(',')
    if (categories.length > 1) {
      where.foodCategory = { in: categories }
    } else {
      where.foodCategory = category
    }
  }
  if (region1) {
    const variations = REGION_VARIATIONS[region1 as string] ?? [region1 as string]
    where.region1 = { in: variations }
  }
  if (region2) where.region2 = region2
  if (keyword) {
    where.OR = [
      { name: { contains: keyword as string, mode: 'insensitive' } },
      { keywords: { has: keyword as string } },
    ]
  }
  if (priceMin !== undefined || priceMax !== undefined) {
    const priceFilter: Record<string, number> = {}
    if (priceMin !== undefined) priceFilter.gte = parseInt(priceMin as string)
    if (priceMax !== undefined) priceFilter.lte = parseInt(priceMax as string)
    where.menus = {
      some: {
        price: priceFilter,
      },
    }
  }

  const [restaurants, total] = await Promise.all([
    prisma.restaurant.findMany({
      where,
      select: {
        id: true,
        name: true,
        thumbnail: true,
        foodCategory: true,
        address: true,
        region2: true,
        region3: true,
        keywords: true,
        averageRating: true,
        reviewCount: true,
        likes: true,
        viewCount: true,
        placeId: true,
        menus: {
          where: { isRecommended: true },
          select: { name: true, price: true },
          take: 3,
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy:
        sort === 'rating'  ? { averageRating: 'desc' } :
        sort === 'views'   ? { viewCount: 'desc' } :
        sort === 'reviews' ? { reviewCount: 'desc' } :
        { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.restaurant.count({ where }),
  ])

  // 로그인 상태라면 찜 상태 추가
  let results = restaurants as any[]
  if (userId) {
    const favorites = await prisma.favorite.findMany({
      where: {
        userId,
        restaurantId: { in: restaurants.map((r) => r.id) },
      },
      select: { restaurantId: true },
    })
    const savedIds = new Set(favorites.map((f) => f.restaurantId))
    results = restaurants.map((r) => ({
      ...r,
      isSaved: savedIds.has(r.id),
    }))
  }

  return {
    restaurants: results,
    total,
    page: pageNum,
    totalPages: Math.ceil(total / pageSize),
  }
})
