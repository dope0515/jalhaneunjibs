import { Router, Request, Response } from 'express'
import { prisma } from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// ─── POST /api/comments/register ──────────────────────────────────────────────
router.post('/register', authMiddleware, async (req: Request, res: Response) => {
  const { content, restaurantId, userId, parentId } = req.body

  if (!content || !restaurantId || !userId) {
    res.status(400).json({ message: '필수 정보가 누락되었습니다.' })
    return
  }

  try {
    const comment = await prisma.comment.create({
      data: {
        content,
        restaurantId: parseInt(restaurantId),
        userId: parseInt(userId),
        parentId: parentId ? parseInt(parentId) : null,
      },
      include: {
        user: true,
        replies: { include: { user: true } },
      },
    })

    res.status(201).json({ success: true, comment })
  } catch (err: any) {
    console.error('[Comment POST Error]:', err)
    res.status(500).json({ message: err.message || '서버 오류가 발생했습니다.' })
  }
})

// ─── PUT /api/comments/:id ────────────────────────────────────────────────────
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) {
    res.status(400).json({ message: '유효한 댓글 ID가 필요합니다.' })
    return
  }

  const { content } = req.body
  if (!content?.trim()) {
    res.status(400).json({ message: '내용을 입력해주세요.' })
    return
  }

  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) {
    res.status(404).json({ message: '댓글을 찾을 수 없습니다.' })
    return
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content: content.trim() },
  })

  res.json({ success: true, comment: updated })
})

// ─── DELETE /api/comments/:id ─────────────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string)
  if (isNaN(id)) {
    res.status(400).json({ message: '유효한 댓글 ID가 필요합니다.' })
    return
  }

  const comment = await prisma.comment.findUnique({ where: { id } })
  if (!comment) {
    res.status(404).json({ message: '댓글을 찾을 수 없습니다.' })
    return
  }

  await prisma.comment.delete({ where: { id } })

  res.json({ success: true })
})

export default router
