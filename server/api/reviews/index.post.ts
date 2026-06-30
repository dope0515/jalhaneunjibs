import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'
import { processAndUploadImage } from '~/server/utils/processUploadImage'

export default defineEventHandler(async (event) => {
  const userId = await getUserId(event)
  const formData = await readFormData(event)

  const restaurantId = parseInt(formData.get('restaurantId')?.toString() ?? '')
  const rating = parseInt(formData.get('rating')?.toString() ?? '')
  const content = formData.get('content')?.toString()?.trim() || null

  if (isNaN(restaurantId) || isNaN(rating)) {
    throw createError({ statusCode: 400, statusMessage: '필수 정보가 누락되었습니다.' })
  }

  if (rating < 1 || rating > 5) {
    throw createError({ statusCode: 400, statusMessage: '별점은 1~5 사이여야 합니다.' })
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  })
  if (!restaurant) {
    throw createError({ statusCode: 404, statusMessage: '식당을 찾을 수 없습니다.' })
  }

  let existingImages: string[] = []
  const existingImagesRaw = formData.get('existingImages')?.toString()
  if (existingImagesRaw) {
    try {
      existingImages = JSON.parse(existingImagesRaw)
      if (!Array.isArray(existingImages)) existingImages = []
    } catch {
      throw createError({ statusCode: 400, statusMessage: '기존 이미지 정보 형식이 올바르지 않습니다.' })
    }
  }

  const imageFiles = formData.getAll('reviewImages') as File[]
  const uploadedImages: string[] = []
  const remaining = 3 - existingImages.length

  for (const file of imageFiles.slice(0, remaining)) {
    if (file instanceof File && file.size > 0) {
      try {
        const { url } = await processAndUploadImage(file, 'reviews')
        if (url) uploadedImages.push(url)
      } catch (e) {
        console.error('[Cloudinary] Review image upload failed:', e)
      }
    }
  }

  const finalImages = [...existingImages, ...uploadedImages].slice(0, 3)

  try {
    const review = await prisma.$transaction(async (tx) => {
      const saved = await tx.review.upsert({
        where: { userId_restaurantId: { userId, restaurantId } },
        create: { userId, restaurantId, rating, content, images: finalImages },
        update: { rating, content, images: finalImages },
        include: {
          user: { select: { id: true, nickname: true } },
        },
      })

      const stats = await tx.review.aggregate({
        where: { restaurantId },
        _avg: { rating: true },
        _count: { id: true },
      })

      await tx.restaurant.update({
        where: { id: restaurantId },
        data: {
          averageRating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
          reviewCount: stats._count.id,
        },
      })

      return saved
    })

    return { success: true, review }
  } catch (error: any) {
    console.error('[Review POST Error]:', error)
    throw createError({
      statusCode: 500,
      statusMessage: '리뷰 저장 중 오류가 발생했습니다.',
    })
  }
})
