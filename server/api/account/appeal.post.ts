import bcrypt from 'bcrypt'
import { prisma } from '~/server/utils/prisma'

const APPEAL_TITLE_PREFIX = '[계정정지 해제 요청]'
const APPEAL_COOLDOWN_MS = 24 * 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = String(body?.email ?? '').trim()
  const password = String(body?.password ?? '').trim()
  const content = String(body?.content ?? '').trim()
  const title = String(body?.title ?? '').trim()

  if (!email || !password || !content) {
    throw createError({
      statusCode: 400,
      statusMessage: '이메일, 비밀번호, 요청 내용을 모두 입력해 주세요.',
    })
  }

  if (content.length < 10) {
    throw createError({
      statusCode: 400,
      statusMessage: '요청 내용을 10자 이상 입력해 주세요.',
    })
  }

  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      id: true,
      password: true,
      status: true,
      nickname: true,
      suspendedReason: true,
    },
  })

  const invalidCredentials = () =>
    createError({
      statusCode: 401,
      statusMessage: '이메일 또는 비밀번호가 일치하지 않습니다.',
    })

  if (!user) {
    throw invalidCredentials()
  }

  if (user.status === 'WITHDRAWN') {
    throw invalidCredentials()
  }

  if (user.status !== 'SUSPENDED') {
    throw createError({
      statusCode: 400,
      statusMessage: '정지된 계정만 해제 요청을 할 수 있습니다. 로그인 후 건의·문의를 이용해 주세요.',
    })
  }

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) {
    throw invalidCredentials()
  }

  const recentAppeal = await prisma.post.findFirst({
    where: {
      userId: user.id,
      title: { startsWith: APPEAL_TITLE_PREFIX },
      createdAt: { gte: new Date(Date.now() - APPEAL_COOLDOWN_MS) },
    },
    select: { id: true, createdAt: true },
  })

  if (recentAppeal) {
    throw createError({
      statusCode: 429,
      statusMessage: '이미 해제 요청이 접수되었습니다. 24시간 후 다시 시도해 주세요.',
    })
  }

  const postTitle = title
    ? `${APPEAL_TITLE_PREFIX} ${title}`
    : APPEAL_TITLE_PREFIX

  const appealContent = [
    content,
    '',
    '---',
    `닉네임: ${user.nickname || '-'}`,
    `이메일: ${email}`,
    `정지 사유(관리자 기록): ${user.suspendedReason || '없음'}`,
  ].join('\n')

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      title: postTitle,
      content: appealContent,
    },
    select: { id: true, title: true, createdAt: true },
  })

  return {
    success: true,
    message: '해제 요청이 접수되었습니다. 운영팀 검토 후 답변드리겠습니다.',
    post,
  }
})
