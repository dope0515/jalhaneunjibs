import { defineEventHandler, readFormData, createError } from 'h3'
import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '~/server/utils/prisma'
import { tryGetUserId } from '~/server/utils/auth'

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

    // 등록자 userId
    const registeredById = tryGetUserId(event)

    // 데이터 추출
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
    const thumbnailFile = formData.get('thumbnail') // 레거시 지원용
    const restaurantImages = formData.getAll('restaurantImages').slice(0, 5) // 새 이미지 배열
    
    // 상태 추출 (기본값 ACTIVE)
    const status = (formData.get('status')?.toString() as any) || 'ACTIVE'
    
    // 필수 필드 체크 (기미상궁일 경우 주소/좌표 필수 해제 가능)
    if (!name || (!address && status !== 'TASTER')) {
      throw createError({ statusCode: 400, statusMessage: '필수 정보(이름 등)가 누락되었습니다.' })
    }

    const lat = latStr ? parseFloat(latStr) : null
    const lng = lngStr ? parseFloat(lngStr) : null

    // 1. 식당 이미지 업로드 (Cloudinary)
    let uploadedImages: string[] = []
    
    // 여러 이미지 처리
    if (restaurantImages.length > 0) {
      for (const file of restaurantImages) {
        if (file instanceof File && file.size > 0) {
          try {
            const url = await uploadToCloudinary(file, 'restaurants')
            uploadedImages.push(url)
          } catch (e) {
            console.error('[Cloudinary] Image upload failed:', e)
          }
        }
      }
    } else if (thumbnailFile && thumbnailFile instanceof File && thumbnailFile.size > 0) {
      // 레거시 대응: 하나만 보낸 경우
      try {
        const url = await uploadToCloudinary(thumbnailFile, 'restaurants')
        uploadedImages.push(url)
      } catch (e) {
        console.error('[Cloudinary] Thumbnail upload failed:', e)
      }
    }

    let thumbnailPath = uploadedImages.length > 0 ? uploadedImages[0] : null

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
          menuItems = await Promise.all(parsed.map(async (item: any, index: number) => {
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

    const { region1, region2, region3 } = parseAddress(address || '')

    // 4. 중복 식당 체크 (placeId가 있을 때만)
    if (placeId) {
      const existing = await prisma.restaurant.findUnique({ where: { placeId } })
      if (existing) {
        throw createError({ statusCode: 409, statusMessage: '이미 등록된 식당입니다.' })
      }
    }

    // 5. DB 저장
    const restaurant = await prisma.restaurant.create({
      data: {
        placeId,
        name,
        description,
        thumbnail: thumbnailPath,
        images: uploadedImages,
        foodCategory: category,
        status: status,
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
