import { defineEventHandler, readFormData, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { getUserId } from '~/server/utils/auth'

// "서울특별시 강남구 역삼동 ..." → { region1, region2, region3 }
const parseAddress = (address: string) => {
  const parts = address.trim().split(/\s+/)
  return {
    region1: parts[0] ?? null,
    region2: parts[1] ?? null,
    region3: parts[2] ?? null,
  }
}

export default defineEventHandler(async (event) => {
  try {
    const formData = await readFormData(event)

    // 등록자 userId
    const registeredById = await getUserId(event)

    // 기본 필드
    const name = formData.get('name')?.toString()
    const description = formData.get('description')?.toString() || null
    const category = formData.get('category')?.toString()
    const address = formData.get('address')?.toString()
    const phoneNumber = formData.get('phoneNumber')?.toString() || null
    const latStr = formData.get('lat')?.toString()
    const lngStr = formData.get('lng')?.toString()
    const placeId = formData.get('placeId')?.toString() || null
    const keywordsString = formData.get('keywords')?.toString()
    const menuItemsString = formData.get('menuItems')?.toString()
    const openingHours = formData.get('openingHours')?.toString() || null
    const parkingInfo = formData.get('parkingInfo')?.toString() || null
    const status = (formData.get('status')?.toString() as any) || 'ACTIVE'

    // 이미지: pre-upload된 URL 배열을 받음
    const restaurantImageUrlsString = formData.get('restaurantImageUrls')?.toString()
    let uploadedImages: string[] = []
    if (restaurantImageUrlsString) {
      try {
        const parsed = JSON.parse(restaurantImageUrlsString)
        if (Array.isArray(parsed)) uploadedImages = parsed.filter(Boolean)
      } catch (e) {
        console.error('[Parser] restaurantImageUrls parsing failed:', e)
      }
    }

    const thumbnailPath = uploadedImages[0] ?? null

    if (!name || !address) {
      throw createError({ statusCode: 400, statusMessage: '필수 정보(이름 등)가 누락되었습니다.' })
    }

    const lat = latStr ? parseFloat(latStr) : null
    const lng = lngStr ? parseFloat(lngStr) : null

    // 키워드 파싱
    let keywords: string[] = []
    if (keywordsString) {
      try {
        const parsed = JSON.parse(keywordsString)
        if (Array.isArray(parsed)) keywords = parsed
      } catch (e) {
        console.error('[Parser] Keywords parsing failed:', e)
      }
    }

    // 메뉴 아이템 파싱 — 이미지도 pre-upload URL로 수신
    let menuItems: any[] = []
    if (menuItemsString) {
      try {
        const parsed = JSON.parse(menuItemsString)
        if (Array.isArray(parsed)) {
          menuItems = parsed.map((item: any, index: number) => ({
            name: item.name?.trim() || '',
            price: item.price ? parseInt(item.price.toString().replace(/[^0-9]/g, ''), 10) : null,
            description: item.description?.trim() || null,
            isRecommended: item.isRecommended ?? false,
            // pre-upload된 URL 사용
            image: formData.get(`menuImageUrl_${index}`)?.toString() || null,
          }))
        }
      } catch (e) {
        console.error('[Parser] Menu items parsing failed:', e)
      }
    }

    const { region1, region2, region3 } = parseAddress(address || '')

    // 중복 식당 체크
    if (placeId) {
      const existing = await prisma.restaurant.findUnique({ where: { placeId } })
      if (existing) {
        throw createError({ statusCode: 409, statusMessage: '이미 등록된 식당입니다.' })
      }
    }

    const restaurant = await prisma.restaurant.create({
      data: {
        placeId,
        name,
        description,
        thumbnail: thumbnailPath,
        images: uploadedImages,
        foodCategory: category,
        status,
        address: address || '주소 미상',
        region1,
        region2,
        region3,
        lat,
        lng,
        phoneNumber: phoneNumber || null,
        openingHours,
        parkingInfo,
        keywords,
        registeredById,
        menus: menuItems.length > 0
          ? { create: menuItems.filter(item => item.name) }
          : undefined,
      },
    })

    return {
      success: true,
      message: '식당이 성공적으로 등록되었습니다!',
      restaurantId: restaurant.id,
    }
  } catch (error: any) {
    console.error('[Registration API Error]:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || '서버 처리 중 오류가 발생했습니다.',
    })
  }
})
