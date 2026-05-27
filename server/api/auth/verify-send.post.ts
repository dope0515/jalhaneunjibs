import nodemailer from 'nodemailer'

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

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now

    console.log(`[Verification] Saving token and sending email to ${email}...`)

    // Save to database
    await prisma.verificationToken.create({
      data: {
        email,
        code,
        expiresAt,
      },
    })

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    })

    // Send mail
    await transporter.sendMail({
      from: `"잘하는 집" <${process.env.MAIL_USER}>`,
      to: email,
      subject: '[잘하는 집] 회원가입 인증 코드입니다.',
      html: `
        <div style="font-family: 'Noto Sans KR', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #0d4a3e; margin-bottom: 20px;">당신만 알고 있던, 잘하는 집</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">안녕하세요! 잘하는 집 서비스 이용을 위한 인증 코드입니다.<br>아래의 인증 번호를 가입 화면에 입력해 주세요.</p>
          <div style="margin: 30px 0; background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 8px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #000;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #666;">* 이 코드는 5분 동안 유효합니다.<br>* 본인이 요청하지 않은 경우 이 메일을 무시해 주세요.</p>
          <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2026 잘하는 집. All rights reserved.</p>
        </div>
      `,
    })

    return {
      success: true,
      message: '인증 메일이 발송되었습니다.',
    }
  } catch (error: any) {
    console.error('[Verification Error]:', error.message || error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || '서버 오류가 발생했습니다.',
    })
  }
})
