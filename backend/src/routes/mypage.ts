import { Router, Response } from 'express'
import bcrypt from 'bcrypt'
import { prisma } from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// 모든 마이페이지 API는 로그인 필요
router.use(authMiddleware)

// ─── GET /api/mypage/profile ───────────────────────────────────────────────────
router.get('/profile', async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, username: true, email: true, nickname: true, role: true, createdAt: true },
  })

  if (!user) {
    res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
    return
  }

  res.json(user)
})

// ─── PUT /api/mypage/profile ───────────────────────────────────────────────────
router.put('/profile', async (req: AuthRequest, res: Response) => {
  const { nickname, currentPassword, newPassword } = req.body
  const updateData: Record<string, any> = {}

  if (nickname !== undefined) {
    if (!nickname.trim()) {
      res.status(400).json({ message: '닉네임을 입력해 주세요.' })
      return
    }
    updateData.nickname = nickname.trim()
  }

  if (newPassword) {
    if (!currentPassword) {
      res.status(400).json({ message: '현재 비밀번호를 입력해 주세요.' })
      return
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId! } })
    if (!user) {
      res.status(404).json({ message: '사용자를 찾을 수 없습니다.' })
      return
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' })
      return
    }
    if (newPassword.length < 6) {
      res.status(400).json({ message: '비밀번호는 6자 이상이어야 합니다.' })
      return
    }
    updateData.password = await bcrypt.hash(newPassword, 10)
  }

  if (Object.keys(updateData).length === 0) {
    res.status(400).json({ message: '변경할 항목이 없습니다.' })
    return
  }

  const updated = await prisma.user.update({
    where: { id: req.userId! },
    data: updateData,
    select: { id: true, username: true, email: true, nickname: true, role: true },
  })

  res.json(updated)
})

// ─── GET /api/mypage/reviews ───────────────────────────────────────────────────
router.get('/reviews', async (req: AuthRequest, res: Response) => {
  const reviews = await prisma.review.findMany({
    where: { userId: req.userId! },
    include: {
      restaurant: {
        select: {
          id: true, name: true, thumbnail: true, foodCategory: true,
          address: true, region2: true, region3: true, keywords: true,
          averageRating: true, reviewCount: true, viewCount: true, likes: true,
          menus: { where: { isRecommended: true }, select: { name: true, price: true }, take: 3 },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(reviews)
})

// ─── GET /api/mypage/my-restaurants ───────────────────────────────────────────
router.get('/my-restaurants', async (req: AuthRequest, res: Response) => {
  const restaurants = await prisma.restaurant.findMany({
    where: { registeredById: req.userId! },
    select: {
      id: true, name: true, thumbnail: true, foodCategory: true,
      address: true, region2: true, region3: true, keywords: true,
      averageRating: true, reviewCount: true, viewCount: true, likes: true,
      status: true, createdAt: true,
      menus: { where: { isRecommended: true }, select: { name: true, price: true }, take: 3 },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(restaurants)
})

// ─── GET /api/mypage/collections ──────────────────────────────────────────────
router.get('/collections', async (req: AuthRequest, res: Response) => {
  const collections = await prisma.collection.findMany({
    where: { userId: req.userId! },
    include: {
      favorites: {
        include: { restaurant: { select: { id: true, thumbnail: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 4,
      },
      _count: { select: { favorites: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  res.json(collections)
})

// ─── POST /api/mypage/collections ─────────────────────────────────────────────
router.post('/collections', async (req: AuthRequest, res: Response) => {
  const { name, isPrivate = true } = req.body

  if (!name?.trim()) {
    res.status(400).json({ message: '목록 이름을 입력해 주세요.' })
    return
  }

  const collection = await prisma.collection.create({
    data: { name: name.trim(), isPrivate, userId: req.userId! },
    include: {
      _count: { select: { favorites: true } },
      favorites: {
        include: { restaurant: { select: { id: true, thumbnail: true, name: true } } },
        take: 4,
      },
    },
  })

  res.status(201).json(collection)
})

// ─── PUT /api/mypage/collections/:id ──────────────────────────────────────────
router.put('/collections/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  const { name, isPrivate } = req.body

  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection) {
    res.status(404).json({ message: '목록을 찾을 수 없습니다.' })
    return
  }
  if (collection.userId !== req.userId!) {
    res.status(403).json({ message: '권한이 없습니다.' })
    return
  }

  const updated = await prisma.collection.update({
    where: { id },
    data: {
      ...(name?.trim() && { name: name.trim() }),
      ...(isPrivate !== undefined && { isPrivate }),
    },
  })

  res.json(updated)
})

// ─── DELETE /api/mypage/collections/:id ───────────────────────────────────────
router.delete('/collections/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)

  const collection = await prisma.collection.findUnique({ where: { id } })
  if (!collection) {
    res.status(404).json({ message: '목록을 찾을 수 없습니다.' })
    return
  }
  if (collection.userId !== req.userId!) {
    res.status(403).json({ message: '권한이 없습니다.' })
    return
  }

  await prisma.favorite.deleteMany({ where: { collectionId: id } })
  await prisma.collection.delete({ where: { id } })

  res.json({ success: true })
})

// ─── GET /api/mypage/collections/:id/restaurants ──────────────────────────────
router.get('/collections/:id/restaurants', async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      favorites: {
        include: {
          restaurant: {
            select: {
              id: true, name: true, thumbnail: true, foodCategory: true,
              address: true, averageRating: true, reviewCount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!collection) {
    res.status(404).json({ message: '목록을 찾을 수 없습니다.' })
    return
  }
  if (collection.userId !== req.userId!) {
    res.status(403).json({ message: '권한이 없습니다.' })
    return
  }

  res.json(collection)
})

// ─── GET /api/mypage/favorites/status?restaurantId=xxx ────────────────────────
router.get('/favorites/status', async (req: AuthRequest, res: Response) => {
  const restaurantId = parseInt(req.query.restaurantId as string)

  if (!restaurantId) {
    res.status(400).json({ message: 'restaurantId가 필요합니다.' })
    return
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: req.userId!, restaurantId },
    select: { collectionId: true },
  })

  const savedCollectionIds = favorites.map((f) => f.collectionId).filter(Boolean) as number[]

  res.json({ savedCollectionIds, isSaved: savedCollectionIds.length > 0 })
})

// ─── POST /api/mypage/favorites/toggle ────────────────────────────────────────
router.post('/favorites/toggle', async (req: AuthRequest, res: Response) => {
  const { restaurantId, collectionId } = req.body

  if (!restaurantId) {
    res.status(400).json({ message: 'restaurantId가 필요합니다.' })
    return
  }
  if (!collectionId) {
    res.status(400).json({ message: '저장할 목록을 선택해 주세요.' })
    return
  }

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } })
  if (!restaurant) {
    res.status(404).json({ message: '식당을 찾을 수 없습니다.' })
    return
  }

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } })
  if (!collection || collection.userId !== req.userId!) {
    res.status(403).json({ message: '권한이 없습니다.' })
    return
  }

  const existing = await prisma.favorite.findFirst({
    where: { userId: req.userId!, restaurantId, collectionId },
  })

  const totalBefore = await prisma.favorite.count({ where: { userId: req.userId!, restaurantId } })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    const totalAfter = await prisma.favorite.count({ where: { userId: req.userId!, restaurantId } })
    if (totalBefore > 0 && totalAfter === 0) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { likes: { decrement: 1 } },
      })
    }
    res.json({ action: 'removed' })
  } else {
    await prisma.favorite.create({ data: { userId: req.userId!, restaurantId, collectionId } })
    if (totalBefore === 0) {
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { likes: { increment: 1 } },
      })
    }
    res.json({ action: 'added' })
  }
})

export default router
