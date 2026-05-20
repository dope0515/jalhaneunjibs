import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { prisma } from '../utils/prisma'

const router = Router()

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login: loginId, password: rawPassword } = req.body
    const password = rawPassword?.trim()
    const identifier = loginId?.trim()

    if (!identifier || !password) {
      res.status(400).json({ message: '이메일(아이디)와 비밀번호를 입력해주세요.' })
      return
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: identifier }, { email: identifier }],
      },
    })

    if (!user) {
      res.status(401).json({ message: '이메일(아이디) 또는 비밀번호가 일치하지 않습니다.' })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      res.status(401).json({ message: '이메일(아이디) 또는 비밀번호가 일치하지 않습니다.' })
      return
    }

    const accessToken = jwt.sign({ userId: user.id }, process.env.ACCESS_TOKEN_SECRET!, {
      expiresIn: '7d',
    })

    const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET!, {
      expiresIn: '7d',
    })

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      },
    })

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 * 1000,
    })

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('[Login Error]:', err)
    res.status(500).json({ message: '서버 오류가 발생했습니다.' })
  }
})

// ─── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, email, password: rawPassword, nickname } = req.body
    const password = rawPassword?.trim()

    if (!username || !email || !password) {
      res.status(400).json({ message: 'ID, Email, 비밀번호는 필수입니다.' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, nickname, emailVerified: true },
    })

    res.status(201).json({
      message: '회원가입이 완료되었습니다!',
      user: { id: user.id, email: user.email, nickname: user.nickname },
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      const field = err.meta?.target?.includes('email') ? '이메일' : '아이디'
      res.status(400).json({ message: `이미 사용 중인 ${field}입니다.` })
      return
    }
    console.error('[Signup Error]:', err)
    res.status(500).json({ message: err.message || '서버 오류가 발생했습니다.' })
  }
})

// ─── GET /api/auth/check-email?email=xxx ──────────────────────────────────────
router.get('/check-email', async (req: Request, res: Response) => {
  const { email } = req.query

  if (!email) {
    res.status(400).json({ message: '이메일을 입력해주세요.' })
    return
  }

  const user = await prisma.user.findUnique({ where: { email: email as string } })
  res.json({ isAvailable: !user })
})

// ─── POST /api/auth/verify-send ───────────────────────────────────────────────
router.post('/verify-send', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      res.status(400).json({ message: '이메일을 입력해주세요.' })
      return
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await prisma.verificationToken.create({ data: { email, code, expiresAt } })

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
    })

    await transporter.sendMail({
      from: `"잘하는 집" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '[잘하는 집] 회원가입 인증 코드입니다.',
      html: `
        <div style="font-family:'Noto Sans KR',sans-serif;max-width:500px;margin:0 auto;padding:40px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#0d4a3e;">미식의 새로운 기준, 잘하는 집</h2>
          <p>인증 코드를 가입 화면에 입력해 주세요.</p>
          <div style="margin:30px 0;background:#f9f9f9;padding:20px;text-align:center;border-radius:8px;">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;">${code}</span>
          </div>
          <p style="font-size:14px;color:#666;">* 이 코드는 5분 동안 유효합니다.</p>
        </div>
      `,
    })

    res.json({ success: true, message: '인증 메일이 발송되었습니다.' })
  } catch (err: any) {
    console.error('[VerifySend Error]:', err)
    res.status(err.status || 500).json({ message: err.message || '서버 오류가 발생했습니다.' })
  }
})

// ─── POST /api/auth/verify-code ───────────────────────────────────────────────
router.post('/verify-code', async (req: Request, res: Response) => {
  const { email, code } = req.body

  if (!email || !code) {
    res.status(400).json({ message: '이메일과 인증 코드를 입력해주세요.' })
    return
  }

  const token = await prisma.verificationToken.findFirst({
    where: { email, code, expiresAt: { gt: new Date() } },
  })

  if (!token) {
    res.status(400).json({ message: '유효하지 않거나 만료된 인증 코드입니다.' })
    return
  }

  await prisma.verificationToken.delete({ where: { id: token.id } })

  res.json({ success: true, message: '이메일 인증이 완료되었습니다.' })
})

export default router
