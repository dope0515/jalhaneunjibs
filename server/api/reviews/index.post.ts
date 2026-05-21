import { prisma } from '~/server/utils/prisma'
import { uploadToCloudinary } from '~/server/utils/cloudinary'

export default defineEventHandler(async (event) => {
  const formData = await readFormData(event)

  const restaurantId = parseInt(formData.get('restaurantId')?.toString() ?? '')
  const userId       = parseInt(formData.get('userId')?.toString() ?? '')
  const rating       = parseInt(formData.get('rating')?.toString() ?? '')
  const content      = formData.get('content')?.toString()?.trim() || null

  if (isNaN(restaurantId) || isNaN(userId) || isNaN(rating)) {
    throw createError({ statusCode: 400, statusMessage: '필수 정보가 누락되었습니다.' })
  }

  if (rating < 1 || rating > 5) {
    throw createError({ statusCode: 400, statusMessage: '별점은 1~5 사이여야 합니다.' })
  }

  // 유지할 기존 이미지 URL (프론트에서 명시적으로 전달)
  const existingImagesRaw = formData.get('existingImages')?.toString()
  const existingImages: string[] = existingImagesRaw ? JSON.parse(existingImagesRaw) : []

  // 새로 추가한 이미지 업로드 (최대 3장 - 기존 이미지 수 고려)
  const imageFiles = formData.getAll('reviewImages') as File[]
  const uploadedImages: string[] = []
  const remaining = 3 - existingImages.length

  for (const file of imageFiles.slice(0, remaining)) {
    if (file instanceof File && file.size > 0) {
      try {
        const url = await uploadToCloudinary(file, 'reviews')
        uploadedImages.push(url)
      } catch (e) {
        console.error('[Cloudinary] Review image upload failed:', e)
      }
    }
  }

  // 최종 이미지 = 유지한 기존 URL + 새로 업로드한 URL
  const finalImages = [...existingImages, ...uploadedImages].slice(0, 3)

  // 1인 1리뷰 upsert
  const review = await prisma.review.upsert({
    where: { userId_restaurantId: { userId, restaurantId } },
    create: { userId, restaurantId, rating, content, images: finalImages },
    update: { rating, content, images: finalImages },
    include: {
      user: { select: { id: true, nickname: true } },
    },
  })

  // 평균 별점 & 리뷰 수 갱신
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

  return { success: true, review }
})
