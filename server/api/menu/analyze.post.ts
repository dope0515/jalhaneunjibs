import { defineEventHandler, readFormData, createError } from 'h3'
import Groq from 'groq-sdk'

export default defineEventHandler(async (event) => {
  // Groq API 키 직접 사용 (보안을 위해 실제 운영 환경에서는 .env 권장)
  const groqApiKey = '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'

  const formData = await readFormData(event)
  const imageFiles = formData.getAll('menuBoard') as File[]

  if (!imageFiles || imageFiles.length === 0 || typeof imageFiles[0] === 'string') {
    throw createError({ statusCode: 400, statusMessage: '이미지 파일이 필요합니다.' })
  }

  const groq = new Groq({ apiKey: groqApiKey })
  let allMenuItems: any[] = []

  try {
    for (const imageFile of imageFiles) {
      if (typeof imageFile === 'string') continue;
      
      const buffer = Buffer.from(await imageFile.arrayBuffer())
      const base64 = buffer.toString('base64')
      const dataUrl = `data:${imageFile.type || 'image/jpeg'};base64,${base64}`

      const response = await groq.chat.completions.create({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
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

추가 조건:
- 메뉴 설명(description)이 한글과 영어가 같이 적혀 있는 경우, 한글 설명만 추출하여 반환하세요.

반드시 다음 JSON 형식의 객체로 답변하세요. "menus" 키 안에 배열을 넣어야 합니다. 마크다운이나 다른 설명은 절대 포함하지 마세요.

형식:
{
  "menus": [
    {
      "name": "메뉴 이름 (한국어)",
      "price": 가격 (반드시 숫자로만 변환, 예: 10000),
      "description": "설명이 있다면 문자열(한글만), 없으면 null"
    }
  ]
}`
              },
              {
                type: "image_url",
                image_url: {
                  url: dataUrl
                }
              }
            ] as any
          }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })

      const content = response.choices[0]?.message?.content || '{"menus": []}'
      
      let menuItems = []
      try {
        const parsed = JSON.parse(content)
        menuItems = Array.isArray(parsed) ? parsed : (parsed.menus || parsed.menu || parsed.items || [])
      } catch (e) {
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        menuItems = Array.isArray(parsed) ? parsed : (parsed.menus || parsed.menu || parsed.items || [])
      }

      allMenuItems = allMenuItems.concat(menuItems)
    }

    return {
      success: true,
      menuItems: allMenuItems.map((item: any) => ({
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
