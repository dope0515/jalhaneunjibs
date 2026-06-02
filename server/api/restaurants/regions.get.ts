import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

// DB에 저장된 행정구역 전체명 → 줄인 이름 매핑
const REGION_SHORT_NAMES: Record<string, string> = {
  '서울특별시': '서울',
  '부산광역시': '부산',
  '대구광역시': '대구',
  '인천광역시': '인천',
  '광주광역시': '광주',
  '대전광역시': '대전',
  '울산광역시': '울산',
  '세종특별자치시': '세종',
  '경기도': '경기도',
  '강원특별자치도': '강원도',
  '충청북도': '충청북도',
  '충청남도': '충청남도',
  '전북특별자치도': '전라북도',
  '전라남도': '전라남도',
  '경상북도': '경상북도',
  '경상남도': '경상남도',
  '제주특별자치도': '제주도',
}

export default defineEventHandler(async () => {
  const results = await prisma.restaurant.findMany({
    where: {
      region1: { not: null },
      status: 'ACTIVE',
    },
    select: { region1: true, region2: true },
    orderBy: [{ region1: 'asc' }, { region2: 'asc' }],
  })

  // { "서울": ["강남구", "마포구", ...], "부산": [...], ... }
  const map: Record<string, string[]> = {}
  for (const { region1, region2 } of results) {
    if (!region1) continue
    const displayName = REGION_SHORT_NAMES[region1] ?? region1
    if (!map[displayName]) map[displayName] = []
    if (region2 && !map[displayName].includes(region2)) {
      map[displayName].push(region2)
    }
  }

  return map
})
