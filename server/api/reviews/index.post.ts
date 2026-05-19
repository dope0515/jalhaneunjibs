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

  // 이미지 업로드 (최대 3장)
  const imageFiles = formData.getAll('reviewImages') as File[]
  const uploadedImages: string[] = []

  for (const file of imageFiles.slice(0, 3)) {
    if (file instanceof File && file.size > 0) {
      try {
        const url = await uploadToCloudinary(file, 'reviews')
        uploadedImages.push(url)
      } catch (e) {
        console.error('[Cloudinary] Review image upload failed:', e)
      }
    }
  }

  // 기존 리뷰가 있으면 이미지 처리 (수정 시 기존 이미지 유지 또는 교체)
  const existingReview = await prisma.review.findUnique({
    where: { userId_restaurantId: { userId, restaurantId } },
  })

  // 이미지 없이 수정할 경우: 기존 이미지 유지
  const finalImages =
    uploadedImages.length > 0
      ? uploadedImages
      : (existingReview?.images ?? [])

  // 1인 1리뷰 upsert
  const review = await prisma.review.upsert({
    where: { userId_restaurantId: { userId, restaurantId } },
    create: { userId, restaurantId, rating, content, images: finalImages },
    update: { rating, content, images: finalImages },
    include: {
      user: { select: { id: true, username: true, nickname: true } },
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
