import { defineEventHandler, readFormData, createError } from 'h3'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '~/server/utils/prisma'

// Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// 이미지 업로드 헬퍼 함수
const uploadToCloudinary = async (file: File, folder: string) => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: `jalhaneunjib/${folder}` },
      (error, result) => {
        if (error) reject(error)
        else resolve(result?.secure_url || '')
      }
    ).end(buffer)
  })
}

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

    // 데이터 추출
    const name = formData.get('name')?.toString()
    const description = formData.get('description')?.toString() || null
    const category = formData.get('category')?.toString()
    const address = formData.get('address')?.toString()
    const phoneNumber = formData.get('phoneNumber')?.toString() || null
    const lat = formData.get('lat')?.toString()
    const lng = formData.get('lng')?.toString()
    const placeId = formData.get('placeId')?.toString()
    const keywordsString = formData.get('keywords')?.toString()
    const menuItemsString = formData.get('menuItems')?.toString()
    const thumbnailFile = formData.get('thumbnail')

    // 필수 정보 유효성 검사
    if (!name || !address || !category || !lat || !lng || !placeId) {
      throw createError({
        statusCode: 400,
        statusMessage: '필수 정보가 누락되었습니다. (이름, 주소, 카테고리, 위치 정보)',
      })
    }

    // 1. 썸네일 업로드 (Cloudinary)
    let thumbnailPath: string | null = null
    if (thumbnailFile && thumbnailFile instanceof File && thumbnailFile.size > 0) {
      try {
        thumbnailPath = await uploadToCloudinary(thumbnailFile, 'restaurants')
      } catch (e) {
        console.error('[Cloudinary] Thumbnail upload failed:', e)
      }
    }

    // 2. 키워드 파싱
    let keywords: string[] = []
    if (keywordsString) {
      try {
        const parsed = JSON.parse(keywordsString)
        if (Array.isArray(parsed)) keywords = parsed
      } catch (e) {
        console.error('[Parser] Keywords parsing failed:', e)
      }
    }

    // 3. 메뉴 아이템 파싱 및 이미지 처리
    let menuItems: any[] = []
    if (menuItemsString) {
      try {
        const parsed = JSON.parse(menuItemsString)
        if (Array.isArray(parsed)) {
          menuItems = await Promise.all(parsed.map(async (item, index) => {
            let itemImagePath: string | null = null
            
            // 메뉴 이미지가 있는 경우 업로드
            if (item.hasImage) {
              const itemImageFile = formData.get(`menuImage_${index}`)
              if (itemImageFile && itemImageFile instanceof File && itemImageFile.size > 0) {
                try {
                  itemImagePath = await uploadToCloudinary(itemImageFile, 'menus')
                } catch (e) {
                  console.error(`[Cloudinary] Menu image ${index} upload failed:`, e)
                }
              }
            }

            return {
              name: item.name?.trim() || '',
              price: item.price ? parseInt(item.price.toString().replace(/[^0-9]/g, ''), 10) : null,
              description: item.description?.trim() || null,
              isRecommended: item.isRecommended ?? false,
              image: itemImagePath,
            }
          }))
        }
      } catch (e) {
        console.error('[Parser] Menu items parsing failed:', e)
      }
    }

    const { region1, region2, region3 } = parseAddress(address)

    // 4. 중복 식당 체크 (같은 placeId)
    const existing = await prisma.restaurant.findUnique({ where: { placeId } })
    if (existing) {
      throw createError({ statusCode: 409, statusMessage: '이미 등록된 식당입니다.' })
    }

    // 5. DB 저장
    const restaurant = await prisma.restaurant.create({
      data: {
        placeId,
        name,
        description,
        thumbnail: thumbnailPath,
        foodCategory: category,
        address,
        region1,
        region2,
        region3,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        phoneNumber: phoneNumber || null,
        keywords,
        menus: menuItems.length > 0
          ? {
              create: menuItems.filter(item => item.name),
            }
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
