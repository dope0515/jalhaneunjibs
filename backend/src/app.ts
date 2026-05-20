import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import authRouter from './routes/auth'
import restaurantsRouter from './routes/restaurants'
import reviewsRouter from './routes/reviews'
import commentsRouter from './routes/comments'
import menuRouter from './routes/menu'
import mypageRouter from './routes/mypage'

const app = express()

// ─── 미들웨어 ──────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ─── 라우터 ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/restaurants', restaurantsRouter)
app.use('/api/reviews', reviewsRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/menu', menuRouter)
app.use('/api/mypage', mypageRouter)

// ─── 헬스 체크 ────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── 404 처리 ─────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: '요청한 API를 찾을 수 없습니다.' })
})

// ─── 전역 에러 핸들러 ──────────────────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err)
  res.status(err.status || err.statusCode || 500).json({
    message: err.message || '서버 오류가 발생했습니다.',
  })
})

export default app
