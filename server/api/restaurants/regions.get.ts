import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

// DB에 저장된 행정구역 명칭 → 표준 축약 이름 매핑
const REGION_SHORT_NAMES: Record<string, string> = {
  '서울': '서울',
  '서울특별시': '서울',
  '부산': '부산',
  '부산광역시': '부산',
  '대구': '대구',
  '대구광역시': '대구',
  '인천': '인천',
  '인천광역시': '인천',
  '광주': '광주',
  '광주광역시': '광주',
  '대전': '대전',
  '대전광역시': '대전',
  '울산': '울산',
  '울산광역시': '울산',
  '세종': '세종',
  '세종시': '세종',
  '세종특별자치시': '세종',
  '경기': '경기',
  '경기도': '경기',
  '강원': '강원',
  '강원도': '강원',
  '강원특별자치도': '강원',
  '충북': '충북',
  '충청북도': '충북',
  '충남': '충남',
  '충청남도': '충남',
  '전북': '전북',
  '전라북도': '전북',
  '전북특별자치도': '전북',
  '전남': '전남',
  '전라남도': '전남',
  '경북': '경북',
  '경상북도': '경북',
  '경남': '경남',
  '경상남도': '경남',
  '제주': '제주',
  '제주도': '제주',
  '제주특별자치도': '제주',
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
