import { defineEventHandler, readBody } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const placeIds: string[] = Array.isArray(body?.placeIds) ? body.placeIds : []

  if (placeIds.length === 0) return { registeredIds: [] }

  const registered = await prisma.restaurant.findMany({
    where: { placeId: { in: placeIds } },
    select: { placeId: true },
  })

  return {
    registeredIds: registered.map((r) => r.placeId).filter(Boolean) as string[],
  }
})
