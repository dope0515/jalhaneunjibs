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
const allowedOrigins = [
  'http://localhost:3000',
  'https://jalhaneunjibs.vercel.app',
  'https://jalhaneunjibs-o2ms.vercel.app'
]

app.use(cors({
  origin: (origin, callback) => {
    // 로컬 개발 환경이나 허용된 도메인에서 오는 요청을 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
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
