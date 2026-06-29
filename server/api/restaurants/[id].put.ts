import { defineEventHandler, readFormData, createError, getRouterParam } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, message: '유효한 식당 ID가 필요합니다.' })
  }

  // 0. 권한 체크
  const restaurant = await prisma.restaurant.findUnique({ where: { id } })
  if (!restaurant) {
    throw createError({ statusCode: 404, message: '식당을 찾을 수 없습니다.' })
  }

  const userId = await getUserId(event)
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const isOwner = restaurant.registeredById === userId
  const isAdmin = user?.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, message: '수정 권한이 없습니다.' })
  }

  const formData = await readFormData(event)

  // 1. 텍스트 필드
  const description = formData.get('description')?.toString() || null
  const phoneNumber = formData.get('phoneNumber')?.toString() || null
  const openingHours = formData.get('openingHours')?.toString() || null
  const parkingInfo = formData.get('parkingInfo')?.toString() || null

  let keywords: string[] = []
  const keywordsString = formData.get('keywords')?.toString()
  if (keywordsString) {
    try {
      const parsed = JSON.parse(keywordsString)
      if (Array.isArray(parsed)) keywords = parsed
    } catch (e) {
      console.error('[Parser] Keywords parsing failed:', e)
    }
  }

  // 2. 이미지: 유지할 기존 URL + pre-upload된 신규 URL 배열
  let existingImages: string[] = []
  const existingImagesString = formData.get('existingImages')?.toString()
  if (existingImagesString) {
    try {
      const parsed = JSON.parse(existingImagesString)
      if (Array.isArray(parsed)) existingImages = parsed
    } catch (e) {
      console.error('[Parser] Existing images parsing failed:', e)
    }
  }

  let newImageUrls: string[] = []
  const newImageUrlsString = formData.get('newRestaurantImageUrls')?.toString()
  if (newImageUrlsString) {
    try {
      const parsed = JSON.parse(newImageUrlsString)
      if (Array.isArray(parsed)) newImageUrls = parsed.filter(Boolean)
    } catch (e) {
      console.error('[Parser] newRestaurantImageUrls parsing failed:', e)
    }
  }

  const finalImages = [...existingImages, ...newImageUrls].slice(0, 5)
  const finalThumbnail = finalImages[0] ?? null

  // 3. 식당 기본 정보 업데이트
  await prisma.restaurant.update({
    where: { id },
    data: {
      description,
      phoneNumber,
      openingHours,
      parkingInfo,
      keywords,
      images: finalImages,
      thumbnail: finalThumbnail,
    },
  })

  // 4. 메뉴 처리
  let menusPayload: any[] = []
  const menusString = formData.get('menus')?.toString()
  if (menusString) {
    try {
      const parsed = JSON.parse(menusString)
      if (Array.isArray(parsed)) menusPayload = parsed
    } catch (e) {
      console.error('[Parser] Menus parsing failed:', e)
    }
  }

  const existingMenus = await prisma.menu.findMany({
    where: { restaurantId: id },
    select: { id: true },
  })
  const existingIds = new Set(existingMenus.map((m) => m.id))
  const incomingIds = new Set(
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

    // 메뉴 이미지: pre-upload URL 또는 기존 URL
    const menuImageUrl = formData.get(`menuImageUrl_${menu.imageIndex}`)?.toString() || null
    const imagePath = menuImageUrl || (menu.removeImage ? null : (menu.existingImage ?? null))

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

  return { success: true, restaurant: updated }
})
