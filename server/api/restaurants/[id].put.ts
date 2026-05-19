import { prisma } from '~/server/utils/prisma'
import { uploadToCloudinary } from '~/server/utils/cloudinary'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: '유효한 식당 ID가 필요합니다.' })
  }

  const formData = await readFormData(event)

  const description       = formData.get('description')?.toString() ?? null
  const phoneNumber       = formData.get('phoneNumber')?.toString() || null
  const openingHours      = formData.get('openingHours')?.toString() || null
  const keywordsRaw       = formData.get('keywords')?.toString()
  const menusRaw          = formData.get('menus')?.toString()
  const existingImagesRaw = formData.get('existingImages')?.toString()

  const keywords: string[]     = keywordsRaw       ? JSON.parse(keywordsRaw)       : []
  const menusPayload: any[]    = menusRaw           ? JSON.parse(menusRaw)           : []
  const existingImages: string[] = existingImagesRaw ? JSON.parse(existingImagesRaw) : []

  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant) {
    throw createError({ statusCode: 404, message: '식당을 찾을 수 없습니다.' })
  }

  // 1. 신규 매장 이미지 업로드
  const newRestaurantImageFiles = formData.getAll('restaurantImages') as File[]
  const uploadedImages: string[] = []
  for (const file of newRestaurantImageFiles) {
    if (file instanceof File && file.size > 0) {
      try {
        uploadedImages.push(await uploadToCloudinary(file, 'restaurants'))
      } catch (e) {
        console.error('[Cloudinary] Restaurant image upload failed:', e)
      }
    }
  }

  // 최종 이미지 배열: 유지한 기존 URL + 새로 업로드된 URL (최대 5장)
  const finalImages = [...existingImages, ...uploadedImages].slice(0, 5)
  const finalThumbnail = finalImages[0] ?? restaurant.thumbnail ?? null

  // 2. 식당 기본 정보 업데이트
  await prisma.restaurant.update({
    where: { id },
    data: {
      description,
      phoneNumber,
      openingHours,
      keywords,
      images: finalImages,
      thumbnail: finalThumbnail,
    },
  })

  // 2. 메뉴 처리
  const existingMenus = await prisma.menu.findMany({
    where: { restaurantId: id },
    select: { id: true },
  })
  const existingIds  = new Set(existingMenus.map((m) => m.id))
  const incomingIds  = new Set(
    menusPayload.filter((m) => m.id).map((m) => Number(m.id))
  )

  // 삭제된 메뉴 제거
  const toDeleteIds = [...existingIds].filter((dbId) => !incomingIds.has(dbId))
  if (toDeleteIds.length > 0) {
    await prisma.menu.deleteMany({ where: { id: { in: toDeleteIds } } })
  }

  for (const menu of menusPayload) {
    const price =
      menu.price !== '' && menu.price != null
        ? parseInt(String(menu.price).replace(/[^0-9]/g, ''), 10) || null
        : null

    // 새 이미지 업로드
    let imagePath: string | null = menu.existingImage ?? null
    if (menu.hasNewImage) {
      const file = formData.get(`menuImage_${menu.imageIndex}`) as File | null
      if (file instanceof File && file.size > 0) {
        try {
          imagePath = await uploadToCloudinary(file, 'menus')
        } catch (e) {
          console.error(`[Cloudinary] Menu image upload failed (index ${menu.imageIndex}):`, e)
        }
      }
    }

    if (menu.id && existingIds.has(Number(menu.id))) {
      // 기존 메뉴 업데이트
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
      // 신규 메뉴 생성
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

  return { success: true, restaurant: updated }
})
