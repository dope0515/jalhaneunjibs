import { Router, Response } from 'express'
import multer from 'multer'
import Groq from 'groq-sdk'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

const GROQ_MENU_MODEL = 'qwen/qwen3.6-27b'

const MENU_ANALYSIS_PROMPT = `이 식당 메뉴판 이미지를 분석해서 메뉴 항목들을 추출해주세요.

가격을 분석할 때 다음 한국 식당/카페의 관습을 따르세요:
- '10.0' 또는 '10,0' -> 10000원
- '8.5' -> 8500원
- '20,000' 또는 '20000원' -> 20000원
- 가격 정보가 없거나 '변동'인 경우 null로 반환하세요.

추가 조건:
- 메뉴 설명(description)이 한글과 영어가 같이 적혀 있는 경우, 한글 설명만 추출하여 반환하세요.

반드시 다음 JSON 형식의 객체로만 답변하세요. "menus" 키 안에 배열을 넣어야 합니다. 마크다운이나 다른 설명은 절대 포함하지 마세요.

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

const createMenuAnalysisCompletion = (groq: Groq, dataUrl: string) =>
  groq.chat.completions.create({
    model: GROQ_MENU_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: MENU_ANALYSIS_PROMPT },
          { type: 'image_url', image_url: { url: dataUrl } },
        ] as any,
      },
    ],
    temperature: 0.1,
    max_completion_tokens: 768,
    reasoning_effort: 'none',
    reasoning_format: 'hidden',
    response_format: { type: 'json_object' },
  } as any)

const parseMenuItems = (content: string) => {
  try {
    const parsed = JSON.parse(content)
    return Array.isArray(parsed) ? parsed : (parsed.menus || parsed.menu || parsed.items || [])
  } catch {
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : (parsed.menus || parsed.menu || parsed.items || [])
  }
}

// ─── POST /api/menu/analyze ────────────────────────────────────────────────────
router.post('/analyze', authMiddleware, upload.array('menuBoard', 5), async (req: AuthRequest, res: Response) => {
  const files = req.files as Express.Multer.File[] || [];
  if (!files || files.length === 0) {
    res.status(400).json({ message: '이미지 파일이 필요합니다.' })
    return
  }

  const groqApiKey = process.env.GROQ_API_KEY?.trim()
  if (!groqApiKey) {
    res.status(503).json({ message: '메뉴 분석 서비스가 설정되지 않았습니다.' })
    return
  }
  const groq = new Groq({ apiKey: groqApiKey })

  try {
    let allMenuItems: any[] = []

    for (const file of files) {
      const base64 = file.buffer.toString('base64')
      const dataUrl = `data:${file.mimetype || 'image/jpeg'};base64,${base64}`

      const response = await createMenuAnalysisCompletion(groq, dataUrl)

      const content = response.choices[0]?.message?.content || '{"menus": []}'
      const menuItems = parseMenuItems(content)

      allMenuItems = allMenuItems.concat(menuItems)
    }

    res.json({
      success: true,
      menuItems: allMenuItems.map((item: any) => ({
        name: item.name || '',
        price: item.price != null ? String(item.price) : '',
        description: item.description || '',
        isRecommended: false,
      })),
    })
  } catch (err: any) {
    console.error('[Groq API Error]:', err)

    const status = err?.status ?? err?.statusCode
    const groqError = err?.error ?? err?.body?.error

    if (status === 429) {
      res.status(429).json({ message: 'Groq API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' })
      return
    }

    if (status === 400 && groqError?.code === 'json_validate_failed') {
      res.status(422).json({ message: '메뉴판 분석 결과를 JSON으로 변환하지 못했습니다. 이미지를 더 선명하게 다시 시도해주세요.' })
      return
    }

    const httpStatus = status && status >= 400 && status < 600 ? status : 500
    res.status(httpStatus).json({ message: groqError?.message || err.message || '메뉴 분석 중 오류가 발생했습니다.' })
  }
})

export default router
