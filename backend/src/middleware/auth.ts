import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: number
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token =
    req.headers.authorization?.replace('Bearer ', '') ||
    (req.cookies as Record<string, string>)?.accessToken ||
    ''

  if (!token) {
    res.status(401).json({ message: '로그인이 필요합니다.' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as { userId: number }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ message: '유효하지 않은 토큰입니다.' })
  }
}
