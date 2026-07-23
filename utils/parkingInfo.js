const PARKING_TYPES = ['자체주차장', '발렛파킹', '공영주차장', '건물주차장']

export function createDefaultParkingData() {
  return {
    hasParking: false,
    available: true,
    type: '자체주차장',
    isFree: true,
    memo: '',
  }
}

function joinMemo(...parts) {
  return parts
    .filter((p) => p && String(p).trim() && String(p).trim() !== '유료')
    .map((p) => String(p).trim())
    .join('\n')
}

export function parseParkingInfo(str) {
  const data = createDefaultParkingData()
  if (!str) return data

  data.hasParking = true

  if (str === '주차 불가') {
    data.available = false
    return data
  }

  if (str.trimStart().startsWith('{')) {
    try {
      const parsed = JSON.parse(str)
      if (parsed.type && PARKING_TYPES.includes(parsed.type)) data.type = parsed.type
      data.isFree = !!parsed.isFree
      data.memo = joinMemo(!parsed.isFree ? parsed.feeDesc : '', parsed.memo)
      return data
    } catch {}
  }

  const parts = str.split(' · ').map((p) => p.trim())
  if (parts[0] && PARKING_TYPES.includes(parts[0])) data.type = parts[0]

  if (parts[1] === '무료') {
    data.isFree = true
    data.memo = parts[2] || ''
  } else if (parts[1] === '유료') {
    data.isFree = false
    data.memo = parts[2] || ''
  } else if (parts[1]) {
    data.isFree = false
    data.memo = joinMemo(parts[1], parts[2])
  } else if (parts[2]) {
    data.memo = parts[2]
  }

  return data
}

export function formatParkingInfo(data) {
  if (!data.hasParking) return ''
  if (!data.available) return '주차 불가'

  return JSON.stringify({
    type: data.type,
    isFree: data.isFree,
    memo: data.memo?.trim() || '',
  })
}

export function parseParkingInfoForDisplay(str) {
  if (!str) return null
  if (str === '주차 불가') return { available: false }

  const parsed = parseParkingInfo(str)
  if (!parsed.hasParking) return null
  if (!parsed.available) return { available: false }

  return {
    available: true,
    type: parsed.type,
    isFree: parsed.isFree,
    fee: parsed.isFree ? '무료' : '유료',
    memo: parsed.memo || null,
  }
}

/**
 * TourAPI parkingfood 원문 → 등록 폼 parkingData
 * @returns {ReturnType<typeof createDefaultParkingData> | null}
 */
export function parseTourParking(raw) {
  const text = (raw || '').trim()
  if (!text) return null

  const data = createDefaultParkingData()
  data.hasParking = true
  data.memo = text

  if (/불가|없음|금지|어려움|좁아|곤란/.test(text) && !/가능/.test(text)) {
    data.available = false
    return data
  }

  if (/가능|있음|완비|제공/.test(text) || text === 'Y' || text === 'y') {
    data.available = true
  }

  if (/발렛/.test(text)) data.type = '발렛파킹'
  else if (/공영/.test(text)) data.type = '공영주차장'
  else if (/건물|지하|주차타워|타워/.test(text)) data.type = '건물주차장'
  else if (/자체|전용|매장|가게|식당\s*앞|앞마당/.test(text)) data.type = '자체주차장'

  if (/무료/.test(text) && !/유료/.test(text)) data.isFree = true
  else if (/유료|요금|원\b|시간당/.test(text)) data.isFree = false

  return data
}
