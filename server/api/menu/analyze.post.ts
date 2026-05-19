import { defineEventHandler, readFormData, createError } from 'h3'
import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  // Groq API 키 직접 사용 (보안을 위해 실제 운영 환경에서는 .env 권장)
  const groqApiKey = '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'

  const formData = await readFormData(event)
  const imageFile = formData.get('menuBoard') as File

  if (!imageFile || typeof imageFile === 'string') {
    throw createError({ statusCode: 400, statusMessage: '이미지 파일이 필요합니다.' })
  }

  // 이미지 처리를 위한 Buffer 변환 및 Base64 인코딩
  const buffer = Buffer.from(await imageFile.arrayBuffer())
  const base64 = buffer.toString('base64')
  const dataUrl = `data:${imageFile.type || 'image/jpeg'};base64,${base64}`

  const groq = new Groq({ apiKey: groqApiKey })

  try {
    const response = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct", // 최신 Llama 4 Vision 모델로 변경
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `이 식당 메뉴판 이미지를 분석해서 메뉴 항목들을 추출해주세요.

가격을 분석할 때 다음 한국 식당/카페의 관습을 따르세요:
- '10.0' 또는 '10,0' -> 10000원
- '8.5' -> 8500원
- '20,000' 또는 '20000원' -> 20000원
- 가격 정보가 없거나 '변동'인 경우 null로 반환하세요.

반드시 다음 JSON 형식의 배열로만 답변하세요. 마크다운이나 다른 설명은 절대 포함하지 마세요.

형식:
[
  {
    "name": "메뉴 이름 (한국어)",
    "price": 가격 (반드시 숫자로만 변환, 예: 10000),
    "description": "설명이 있다면 문자열, 없으면 null"
  }
]`
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl
              }
            }
          ]
        }
      ],
      temperature: 0.1, // 정확도를 위해 낮은 온도로 설정
      response_format: { type: "json_object" } // JSON 응답 강제 (지원되는 모델의 경우)
    })

    const content = response.choices[0]?.message?.content || '[]'
    
    // Groq 응답에서 JSON 배열 추출 (때때로 객체로 감싸져 올 수 있음)
    let menuItems = []
    try {
      const parsed = JSON.parse(content)
      menuItems = Array.isArray(parsed) ? parsed : (parsed.menu || parsed.items || [])
    } catch (e) {
      // 마크다운 백틱 제거 시도
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      menuItems = Array.isArray(parsed) ? parsed : (parsed.menu || parsed.items || [])
    }

    return {
      success: true,
      menuItems: menuItems.map((item: any) => ({
        name: item.name || '',
        price: item.price != null ? String(item.price) : '',
        description: item.description || '',
        isRecommended: false,
      })),
    }
  } catch (error: any) {
    console.error('[Groq API Error Detail]:', error)
    
    if (error.status === 429) {
      throw createError({
        statusCode: 429,
        statusMessage: 'Groq API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || '메뉴 분석 중 오류가 발생했습니다.',
    })
  }
})
