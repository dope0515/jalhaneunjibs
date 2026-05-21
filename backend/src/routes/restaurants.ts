import { Router, Request, Response } from 'express'
import multer from 'multer'
import { prisma } from '../utils/prisma'
import { uploadToCloudinary } from '../utils/cloudinary'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// ─── 주소 파싱 헬퍼 ────────────────────────────────────────────────────────────
const parseAddress = (address: string) => {
  const parts = address.trim().split(/\s+/)
  return {
    region1: parts[0] ?? null,
    region2: parts[1] ?? null,
    region3: parts[2] ?? null,
  }
}

// ─── GET /api/restaurants ──────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, region1, region2, keyword, page = '1', sort = 'latest' } = req.query

    const pageNum = Math.max(1, parseInt(page as string))
    const pageSize = 6
    const skip = (pageNum - 1) * pageSize

    const where: Record<string, unknown> = {}
    if (category) where.foodCategory = category
    if (region1) where.region1 = region1
    if (region2) where.region2 = region2
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string, mode: 'insensitive' } },
        { keywords: { has: keyword as string } },
      ]
    }

    const orderBy =
      sort === 'likes'   ? { likes: 'desc' as const } :
      sort === 'views'   ? { viewCount: 'desc' as const } :
      sort === 'reviews' ? { reviewCount: 'desc' as const } :
      { createdAt: 'desc' as const }

    const [restaurants, total] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        select: {
          id: true, name: true, thumbnail: true, foodCategory: true,
          address: true, region2: true, region3: true, keywords: true,
          averageRating: true, reviewCount: true, likes: true, viewCount: true, placeId: true,
          menus: { where: { isRecommended: true }, select: { name: true, price: true }, take: 3 },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
      prisma.restaurant.count({ where }),
    ])

    res.json({ restaurants, total, page: pageNum, totalPages: Math.ceil(total / pageSize) })
  } catch (err) {
    console.error('[Restaurants GET Error]:', err)
    res.status(500).json({ message: '식당 목록을 불러오는 중 오류가 발생했습니다.' })
  }
})

// ─── GET /api/restaurants/regions ─────────────────────────────────────────────
router.get('/regions', async (_req: Request, res: Response) => {
  try {
    const results = await prisma.restaurant.findMany({
      where: { region1: { not: null }, status: 'ACTIVE' },
      select: { region1: true, region2: true },
      orderBy: [{ region1: 'asc' }, { region2: 'asc' }],
    })

    const map: Record<string, string[]> = {}
    for (const { region1, region2 } of results) {
      if (!region1) continue
      if (!map[region1]) map[region1] = []
      if (region2 && !map[region1].includes(region2)) map[region1].push(region2)
    }

    res.json(map)
  } catch (err) {
    console.error('[Regions Error]:', err)
    res.status(500).json({ message: '지역 목록을 불러오는 중 오류가 발생했습니다.' })
  }
})

// ─── POST /api/restaurants/register ───────────────────────────────────────────
router.post(
  '/register',
  upload.fields([
    { name: 'restaurantImages', maxCount: 5 },
    { name: 'thumbnail', maxCount: 1 },
    ...Array.from({ length: 20 }, (_, i) => ({ name: `menuImage_${i}`, maxCount: 1 })),
  ]),
  async (req: AuthRequest, res: Response) => {
    try {
      // 옵셔널 로그인 (로그인 없이도 등록 가능)
      let registeredById: number | null = null
      const token =
        req.headers.authorization?.replace('Bearer ', '') ||
        (req.cookies as Record<string, string>)?.accessToken || ''
      if (token) {
        try {
          const jwt = await import('jsonwebtoken')
          const payload = jwt.default.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: number }
          registeredById = payload.userId
        } catch { /* 비로그인 */ }
      }

      const files = req.files as Record<string, Express.Multer.File[]>

      const {
        name, description, category, address, phoneNumber, lat, lng, placeId,
        keywords: keywordsString, menuItems: menuItemsString,
      } = req.body

      if (!name || !address || !lat || !lng || !placeId) {
        res.status(400).json({ message: '필수 정보가 누락되었습니다.' })
        return
      }

      // 1. 이미지 업로드
      const uploadedImages: string[] = []
      const restaurantImageFiles = files?.restaurantImages || files?.thumbnail || []
      for (const file of restaurantImageFiles) {
        try {
          uploadedImages.push(await uploadToCloudinary(file.buffer, 'restaurants'))
        } catch (e) {
          console.error('[Cloudinary] Restaurant image upload failed:', e)
        }
      }

      // 2. 키워드 파싱
      let keywords: string[] = []
      if (keywordsString) {
        try {
          keywords = JSON.parse(keywordsString)
        } catch { /* 파싱 실패 무시 */ }
      }

      // 3. 메뉴 파싱 및 이미지 업로드
      let menuItems: any[] = []
      if (menuItemsString) {
        try {
          const parsed = JSON.parse(menuItemsString)
          if (Array.isArray(parsed)) {
            menuItems = await Promise.all(
              parsed.map(async (item: any, index: number) => {
                let imagePath: string | null = null
                if (item.hasImage) {
                  const menuFile = files?.[`menuImage_${index}`]?.[0]
                  if (menuFile) {
                    try {
                      imagePath = await uploadToCloudinary(menuFile.buffer, 'menus')
                    } catch (e) {
                      console.error(`[Cloudinary] Menu image ${index} upload failed:`, e)
                    }
                  }
                }
                return {
                  name: item.name?.trim() || '',
                  price: item.price ? parseInt(String(item.price).replace(/[^0-9]/g, ''), 10) : null,
                  description: item.description?.trim() || null,
                  isRecommended: item.isRecommended ?? false,
                  image: imagePath,
                }
              })
            )
          }
        } catch { /* 파싱 실패 무시 */ }
      }

      const { region1, region2, region3 } = parseAddress(address)

      const existing = await prisma.restaurant.findUnique({ where: { placeId } })
      if (existing) {
        res.status(409).json({ message: '이미 등록된 식당입니다.' })
        return
      }

      const restaurant = await prisma.restaurant.create({
        data: {
          placeId, name, description: description || null,
          thumbnail: uploadedImages[0] || null,
          images: uploadedImages,
          foodCategory: category,
          address, region1, region2, region3,
          lat: parseFloat(lat), lng: parseFloat(lng),
          phoneNumber: phoneNumber || null,
          keywords,
          registeredById,
          menus: menuItems.length > 0
            ? { create: menuItems.filter((m: any) => m.name) }
            : undefined,
        },
      })

      res.status(201).json({
        success: true,
        message: '식당이 성공적으로 등록되었습니다!',
        restaurantId: restaurant.id,
      })
    } catch (err: any) {
      console.error('[Register API Error]:', err)
      res.status(err.statusCode || 500).json({ message: err.message || '서버 오류가 발생했습니다.' })
    }
  }
)

// ─── GET /api/restaurants/:id ──────────────────────────────────────────────────
router.get('/:id', async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) {
    res.status(400).json({ message: '유효한 식당 ID가 필요합니다.' })
    return
  }

  try {
    const restaurant = await prisma.restaurant.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
      include: {
        menus: { orderBy: { id: 'asc' } },
        reviews: {
          include: { user: { select: { id: true, nickname: true } } },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          where: { parentId: null },
          include: {
            user: { select: { id: true, nickname: true } },
            replies: {
              include: { user: { select: { id: true, nickname: true } } },
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    res.json(restaurant)
  } catch (err: any) {
    if (err.code === 'P2025') {
      res.status(404).json({ message: '식당을 찾을 수 없습니다.' })
      return
    }
    console.error('[Restaurant Detail Error]:', err)
    res.status(500).json({ message: '식당 정보를 불러오는 중 오류가 발생했습니다.' })
  }
})

// ─── PUT /api/restaurants/:id ─────────────────────────────────────────────────
router.put(
  '/:id',
  authMiddleware,
  upload.fields([
    { name: 'restaurantImages', maxCount: 5 },
    ...Array.from({ length: 20 }, (_, i) => ({ name: `menuImage_${i}`, maxCount: 1 })),
  ]),
  async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id as string)
    if (isNaN(id)) {
      res.status(400).json({ message: '유효한 식당 ID가 필요합니다.' })
      return
    }

    try {
      const files = req.files as Record<string, Express.Multer.File[]>
      const { description, phoneNumber, openingHours, keywords: keywordsRaw, menus: menusRaw, existingImages: existingImagesRaw } = req.body

      const keywords: string[]        = keywordsRaw       ? JSON.parse(keywordsRaw)       : []
      const menusPayload: any[]       = menusRaw           ? JSON.parse(menusRaw)           : []
      const existingImages: string[]  = existingImagesRaw  ? JSON.parse(existingImagesRaw)  : []

      const restaurant = await prisma.restaurant.findUnique({ where: { id } })
      if (!restaurant) {
        res.status(404).json({ message: '식당을 찾을 수 없습니다.' })
        return
      }

      // 신규 매장 이미지 업로드
      const uploadedImages: string[] = []
      for (const file of (files?.restaurantImages || [])) {
        try {
          uploadedImages.push(await uploadToCloudinary(file.buffer, 'restaurants'))
        } catch (e) {
          console.error('[Cloudinary] Restaurant image upload failed:', e)
        }
      }

      const finalImages = [...existingImages, ...uploadedImages].slice(0, 5)
      const finalThumbnail = finalImages[0] ?? restaurant.thumbnail ?? null

      await prisma.restaurant.update({
        where: { id },
        data: {
          description: description ?? null,
          phoneNumber: phoneNumber || null,
          openingHours: openingHours || null,
          keywords,
          images: finalImages,
          thumbnail: finalThumbnail,
        },
      })

      // 메뉴 처리
      const existingMenus = await prisma.menu.findMany({
        where: { restaurantId: id },
        select: { id: true },
      })
      const existingIds = new Set(existingMenus.map((m) => m.id))
      const incomingIds = new Set(menusPayload.filter((m: any) => m.id).map((m: any) => Number(m.id)))

      const toDeleteIds = [...existingIds].filter((dbId) => !incomingIds.has(dbId))
      if (toDeleteIds.length > 0) {
        await prisma.menu.deleteMany({ where: { id: { in: toDeleteIds } } })
      }

      for (const menu of menusPayload) {
        const price =
          menu.price !== '' && menu.price != null
            ? parseInt(String(menu.price).replace(/[^0-9]/g, ''), 10) || null
            : null

        let imagePath: string | null = menu.existingImage ?? null
        if (menu.hasNewImage) {
          const file = files?.[`menuImage_${menu.imageIndex}`]?.[0]
          if (file) {
            try {
              imagePath = await uploadToCloudinary(file.buffer, 'menus')
            } catch (e) {
              console.error(`[Cloudinary] Menu image upload failed:`, e)
            }
          }
        }

        if (menu.id && existingIds.has(Number(menu.id))) {
          await prisma.menu.update({
            where: { id: Number(menu.id) },
            data: {
              name: menu.name?.trim() || '',
              price,
              description: menu.description?.trim() || null,
              isRecommended: !!menu.isRecommended,
              image: imagePath,
            },
          })
        } else if (!menu.id && menu.name?.trim()) {
          await prisma.menu.create({
            data: {
              restaurantId: id,
              name: menu.name.trim(),
              price,
              description: menu.description?.trim() || null,
              isRecommended: !!menu.isRecommended,
              image: imagePath,
            },
          })
        }
      }

      const updated = await prisma.restaurant.findUnique({
        where: { id },
        include: { menus: { orderBy: { id: 'asc' } } },
      })

      res.json({ success: true, restaurant: updated })
    } catch (err: any) {
      console.error('[Restaurant PUT Error]:', err)
      res.status(500).json({ message: err.message || '서버 오류가 발생했습니다.' })
    }
  }
)

export default router
