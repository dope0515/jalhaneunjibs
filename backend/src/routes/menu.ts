import { Router, Response } from 'express'
import multer from 'multer'
import Groq from 'groq-sdk'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

// ─── POST /api/menu/analyze ────────────────────────────────────────────────────
router.post('/analyze', authMiddleware, upload.single('menuBoard'), async (req: AuthRequest, res: Response) => {
  if (!req.file) {
    res.status(400).json({ message: '이미지 파일이 필요합니다.' })
    return
  }

  const groqApiKey = process.env.GROQ_API_KEY || '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'
  const groq = new Groq({ apiKey: groqApiKey })

  const base64 = req.file.buffer.toString('base64')
  const dataUrl = `data:${req.file.mimetype || 'image/jpeg'};base64,${base64}`

  try {
    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
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
]`,
            },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content || '[]'

    let menuItems: any[] = []
    try {
      const parsed = JSON.parse(content)
      menuItems = Array.isArray(parsed) ? parsed : (parsed.menu || parsed.items || [])
    } catch {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleaned)
      menuItems = Array.isArray(parsed) ? parsed : (parsed.menu || parsed.items || [])
    }

    res.json({
      success: true,
      menuItems: menuItems.map((item: any) => ({
        name: item.name || '',
        price: item.price != null ? String(item.price) : '',
        description: item.description || '',
        isRecommended: false,
      })),
    })
  } catch (err: any) {
    console.error('[Groq API Error]:', err)
    if (err.status === 429) {
      res.status(429).json({ message: 'Groq API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' })
      return
    }
    res.status(500).json({ message: err.message || '메뉴 분석 중 오류가 발생했습니다.' })
  }
})

export default router
