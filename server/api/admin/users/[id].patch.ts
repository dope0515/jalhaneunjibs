import { requireAdmin } from '~/server/utils/admin'
import { prisma } from '~/server/utils/prisma'

const VALID_STATUSES = ['ACTIVE', 'SUSPENDED'] as const

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: '유효하지 않은 사용자 ID입니다.' })
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, status: true },
  })

  if (!target) {
    throw createError({ statusCode: 404, statusMessage: '사용자를 찾을 수 없습니다.' })
  }

  if (target.status === 'WITHDRAWN') {
    throw createError({ statusCode: 400, statusMessage: '탈퇴한 계정은 변경할 수 없습니다.' })
  }

  const body = await readBody(event)
  const { role, status, suspendedReason } = body ?? {}
  const updateData: Record<string, unknown> = {}

  if (role !== undefined) {
    if (role !== 'USER' && role !== 'ADMIN') {
      throw createError({ statusCode: 400, statusMessage: 'role은 USER 또는 ADMIN이어야 합니다.' })
    }
    if (id === admin.id && role !== 'ADMIN') {
      throw createError({ statusCode: 400, statusMessage: '본인의 관리자 권한은 해제할 수 없습니다.' })
    }
    updateData.role = role
  }

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      throw createError({ statusCode: 400, statusMessage: 'status는 ACTIVE 또는 SUSPENDED여야 합니다.' })
    }
    if (id === admin.id && status === 'SUSPENDED') {
      throw createError({ statusCode: 400, statusMessage: '본인 계정은 정지할 수 없습니다.' })
    }
    if (status === 'SUSPENDED') {
      const reason = String(suspendedReason ?? '').trim()
      if (!reason) {
        throw createError({ statusCode: 400, statusMessage: '정지 사유를 입력해 주세요.' })
      }
      updateData.status = 'SUSPENDED'
      updateData.suspendedReason = reason
      await prisma.refreshToken.deleteMany({ where: { userId: id } })
    } else {
      updateData.status = 'ACTIVE'
      updateData.suspendedReason = null
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw createError({ statusCode: 400, statusMessage: '변경할 항목이 없습니다.' })
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
      status: true,
      suspendedReason: true,
    },
  })

  return { success: true, user }
})
