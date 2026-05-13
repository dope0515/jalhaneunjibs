import { defineEventHandler, readFormData, createError } from 'h3'
import { GoogleGenerativeAI } from '@google/generative-ai'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (!config.geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Gemini API 키가 설정되어 있지 않습니다.',
    })
  }

  const formData = await readFormData(event)
  const imageFile = formData.get('menuBoard') as File

  if (!imageFile || typeof imageFile === 'string') {
    throw createError({ statusCode: 400, statusMessage: '이미지 파일이 필요합니다.' })
  }

  const buffer = Buffer.from(await imageFile.arrayBuffer())
  const base64 = buffer.toString('base64')
  const mimeType = (imageFile.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

  const genAI = new GoogleGenerativeAI(config.geminiApiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const result = await model.generateContent([
    {
      inlineData: { data: base64, mimeType },
    },
    `이 식당 메뉴판 이미지를 분석해서 메뉴 항목들을 추출해주세요.
각 메뉴 항목에 대해 다음 정보를 추출하세요:
- name: 메뉴 이름 (문자열, 한국어 그대로)
- price: 가격 (숫자만, 콤마/원 제거. 가격이 없으면 null)
- description: 메뉴 설명이 있으면 문자열, 없으면 null

반드시 순수 JSON 배열만 반환하세요. 마크다운이나 설명 텍스트 없이.
예: [{"name":"김치찌개","price":9000,"description":"직접 담근 묵은지 사용"}]`,
  ])

  const content = result.response.text() || '[]'

  try {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const menuItems = JSON.parse(cleaned)

    if (!Array.isArray(menuItems)) {
      throw new Error('배열이 아닌 응답')
    }

    return {
      success: true,
      menuItems: menuItems.map((item: { name?: string; price?: number | null; description?: string | null }) => ({
        name: item.name || '',
        price: item.price != null ? String(item.price) : '',
        description: item.description || '',
        isRecommended: false,
      })),
    }
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: '메뉴 분석 결과를 파싱하는 데 실패했습니다.',
    })
  }
})
