import { requireAdmin } from '~/server/utils/admin'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = parseInt(getRouterParam(event, 'id') ?? '')

  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: '유효하지 않은 사용자 ID입니다.' })
  }

  const body = await readBody(event)
  const role = body?.role

  if (role !== 'USER' && role !== 'ADMIN') {
    throw createError({ statusCode: 400, statusMessage: 'role은 USER 또는 ADMIN이어야 합니다.' })
  }

  if (id === admin.id && role !== 'ADMIN') {
    throw createError({ statusCode: 400, statusMessage: '본인의 관리자 권한은 해제할 수 없습니다.' })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      email: true,
      nickname: true,
      role: true,
    },
  })

  return { success: true, user }
})
