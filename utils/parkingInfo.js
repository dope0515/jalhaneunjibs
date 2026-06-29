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
