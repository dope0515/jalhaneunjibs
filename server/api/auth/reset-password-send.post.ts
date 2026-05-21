import nodemailer from 'nodemailer'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email } = body

    if (!email) {
      throw createError({
        statusCode: 400,
        statusMessage: '이메일을 입력해주세요.',
      })
    }

    // 1. 가입된 회원인지 확인
    const user = await prisma.user.findUnique({
      where: { email: email.trim() }
    })

    if (!user) {
      throw createError({
        statusCode: 400,
        statusMessage: '가입되지 않은 이메일 주소입니다.',
      })
    }

    // 2. 6자리 인증 코드 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5분 유효

    console.log(`[Password Reset] Saving code and sending email to ${email}...`)

    // 3. 인증 토큰 생성
    await prisma.verificationToken.create({
      data: {
        email: email.trim(),
        code,
        expiresAt,
      },
    })

    // 4. 메일 발송
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })

    await transporter.sendMail({
      from: `"잘하는 집" <${process.env.MAIL_USER}>`,
      to: email.trim(),
      subject: '[잘하는 집] 비밀번호 재설정 인증 코드입니다.',
      html: `
        <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0d4a3e; margin-bottom: 20px;">미식의 새로운 기준, 잘하는 집</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">안녕하세요! 비밀번호 재설정을 위한 인증 번호가 발송되었습니다.<br>아래의 인증 번호를 입력창에 입력하여 비밀번호를 재설정해 주세요.</p>
          <div style="margin: 30px 0; background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #666;">* 이 코드는 5분 동안 유효합니다.<br>* 본인이 요청하지 않은 경우 비밀번호를 안전하게 보관하고 고객센터로 문의해 주세요.</p>
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2026 잘하는 집. All rights reserved.</p>
        </div>
      `,
    })

    return {
      success: true,
      message: '비밀번호 재설정 코드가 이메일로 전송되었습니다.',
    }
  } catch (error: any) {
    console.error('[Password Reset Send Error]:', error.message || error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || '서버 오류가 발생했습니다.',
    })
  }
})
