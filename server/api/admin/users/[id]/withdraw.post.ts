import { requireAdmin } from '~/server/utils/admin'
import { withdrawUser } from '~/server/utils/userAccount'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: '유효하지 않은 사용자 ID입니다.' })
  }

  if (id === admin.id) {
    throw createError({ statusCode: 400, statusMessage: '본인 계정은 강제 탈퇴할 수 없습니다.' })
  }

  const body = await readBody(event)
  const reason = String(body?.reason ?? '').trim()

  if (!reason) {
    throw createError({ statusCode: 400, statusMessage: '탈퇴 사유를 입력해 주세요.' })
  }

  await withdrawUser(id)

  return { success: true }
})
