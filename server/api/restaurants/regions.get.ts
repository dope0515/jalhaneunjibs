import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async () => {
  const results = await prisma.restaurant.findMany({
    where: {
      region1: { not: null },
      status: 'ACTIVE',
    },
    select: { region1: true, region2: true },
    orderBy: [{ region1: 'asc' }, { region2: 'asc' }],
  })

  // { "서울특별시": ["강남구", "마포구", ...], "부산광역시": [...], ... }
  const map: Record<string, string[]> = {}
  for (const { region1, region2 } of results) {
    if (!region1) continue
    if (!map[region1]) map[region1] = []
    if (region2 && !map[region1].includes(region2)) {
      map[region1].push(region2)
    }
  }

  return map
})
