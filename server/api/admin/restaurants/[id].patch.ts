import { requireAdmin } from '~/server/utils/admin'
import { prisma } from '~/server/utils/prisma'

const VALID_STATUSES = ['ACTIVE', 'CLOSED', 'HIDDEN', 'TASTER'] as const

export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  const id = parseInt(getRouterParam(event, 'id') ?? '')
  if (isNaN(id)) {
    throw createError({ statusCode: 400, statusMessage: '유효하지 않은 매장 ID입니다.' })
  }

  const body = await readBody(event)
  const status = body?.status

  if (!VALID_STATUSES.includes(status)) {
    throw createError({ statusCode: 400, statusMessage: '유효하지 않은 상태입니다.' })
  }

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: { status },
    select: { id: true, name: true, status: true },
  })

  return { success: true, restaurant }
})
