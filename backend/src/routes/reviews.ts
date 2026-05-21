import { Router, Response } from 'express'
import multer from 'multer'
import { prisma } from '../utils/prisma'
import { uploadToCloudinary } from '../utils/cloudinary'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// ─── POST /api/reviews ─────────────────────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  upload.fields([{ name: 'reviewImages', maxCount: 3 }]),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]>

      const restaurantId = parseInt(req.body.restaurantId)
      const userId       = parseInt(req.body.userId)
      const rating       = parseInt(req.body.rating)
      const content      = req.body.content?.trim() || null

      if (isNaN(restaurantId) || isNaN(userId) || isNaN(rating)) {
        res.status(400).json({ message: '필수 정보가 누락되었습니다.' })
        return
      }

      if (rating < 1 || rating > 5) {
        res.status(400).json({ message: '별점은 1~5 사이여야 합니다.' })
        return
      }

      const existingImages: string[] = req.body.existingImages ? JSON.parse(req.body.existingImages) : []

      const uploadedImages: string[] = []
      const remaining = 3 - existingImages.length
      for (const file of (files?.reviewImages || []).slice(0, remaining)) {
        try {
          uploadedImages.push(await uploadToCloudinary(file.buffer, 'reviews'))
        } catch (e) {
          console.error('[Cloudinary] Review image upload failed:', e)
        }
      }

      const finalImages = [...existingImages, ...uploadedImages].slice(0, 3)

      const review = await prisma.review.upsert({
        where: { userId_restaurantId: { userId, restaurantId } },
        create: { userId, restaurantId, rating, content, images: finalImages },
        update: { rating, content, images: finalImages },
        include: {
          user: { select: { id: true, nickname: true } },
        },
      })

      const stats = await prisma.review.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
        _count: { id: true },
      })

      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: {
          averageRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
          reviewCount: stats._count.id,
        },
      })

      res.json({ success: true, review })
    } catch (err: any) {
      console.error('[Review POST Error]:', err)
      res.status(500).json({ message: err.message || '서버 오류가 발생했습니다.' })
    }
  }
)

// ─── DELETE /api/reviews/:id ───────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) {
    res.status(400).json({ message: '유효하지 않은 ID입니다.' })
    return
  }

  const review = await prisma.review.findUnique({ where: { id } })
  if (!review) {
    res.status(404).json({ message: '리뷰를 찾을 수 없습니다.' })
    return
  }

  await prisma.review.delete({ where: { id } })

  const stats = await prisma.review.aggregate({
    where: { restaurantId: review.restaurantId },
    _avg: { rating: true },
    _count: { id: true },
  })

  await prisma.restaurant.update({
    where: { id: review.restaurantId },
    data: {
      averageRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
      reviewCount: stats._count.id,
    },
  })

  res.json({ success: true })
})

export default router
