export const OPERATION_TYPES = ['yearRound', 'seasonal', 'irregular']
export const OFF_SEASON_ACTIONS = ['closed', 'call']

export function createDefaultSeasonData() {
  return {
    hasOperationInfo: false,
    type: 'yearRound',
    repeatYearly: true,
    startMonth: 9,
    startDay: 1,
    endMonth: 11,
    endDay: 30,
    offSeasonAction: 'closed',
    memo: '',
  }
}

function clampMonth(value) {
  const n = parseInt(value, 10)
  if (!Number.isFinite(n)) return 1
  return Math.min(12, Math.max(1, n))
}

function clampDay(value) {
  const n = parseInt(value, 10)
  if (!Number.isFinite(n)) return 1
  return Math.min(31, Math.max(1, n))
}

export function formatPeriodLabel(data) {
  if (data.type !== 'seasonal') return ''
  const prefix = data.repeatYearly ? '매년 ' : ''
  return `${prefix}${data.startMonth}월 ${data.startDay}일 ~ ${data.endMonth}월 ${data.endDay}일`
}

export function isDateInSeason(data, date = new Date()) {
  if (data.type !== 'seasonal') return true

  const month = date.getMonth() + 1
  const day = date.getDate()
  const current = month * 100 + day
  const start = clampMonth(data.startMonth) * 100 + clampDay(data.startDay)
  const end = clampMonth(data.endMonth) * 100 + clampDay(data.endDay)

  if (start <= end) {
    return current >= start && current <= end
  }

  return current >= start || current <= end
}

export function parseSeasonInfo(str) {
  const data = createDefaultSeasonData()
  if (!str) return data

  if (str.trimStart().startsWith('{')) {
    try {
      const parsed = JSON.parse(str)
      data.hasOperationInfo = true
      if (OPERATION_TYPES.includes(parsed.type)) data.type = parsed.type
      data.repeatYearly = parsed.repeatYearly !== false
      data.startMonth = clampMonth(parsed.startMonth)
      data.startDay = clampDay(parsed.startDay)
      data.endMonth = clampMonth(parsed.endMonth)
      data.endDay = clampDay(parsed.endDay)
      if (OFF_SEASON_ACTIONS.includes(parsed.offSeasonAction)) {
        data.offSeasonAction = parsed.offSeasonAction
      }
      data.memo = parsed.memo?.trim() || ''
      return data
    } catch {}
  }

  return data
}

export function formatSeasonInfo(data) {
  if (!data?.hasOperationInfo) return ''

  return JSON.stringify({
    type: data.type,
    repeatYearly: !!data.repeatYearly,
    startMonth: clampMonth(data.startMonth),
    startDay: clampDay(data.startDay),
    endMonth: clampMonth(data.endMonth),
    endDay: clampDay(data.endDay),
    offSeasonAction: OFF_SEASON_ACTIONS.includes(data.offSeasonAction)
      ? data.offSeasonAction
      : 'closed',
    memo: data.memo?.trim() || '',
  })
}

export function parseSeasonInfoForDisplay(str) {
  const data = parseSeasonInfo(str)
  if (!data.hasOperationInfo) return null

  if (data.type === 'yearRound') {
    return {
      status: 'year_round',
      label: '연중 영업',
      periodLabel: null,
      memo: data.memo || null,
      hint: null,
    }
  }

  if (data.type === 'irregular') {
    return {
      status: 'unknown',
      label: '수시 운영',
      periodLabel: null,
      memo: data.memo || null,
      hint: '방문 전 공식 채널에서 운영 여부를 확인해 주세요.',
    }
  }

  const periodLabel = formatPeriodLabel(data)
  const inSeason = isDateInSeason(data)
  const offSeasonLabel = data.offSeasonAction === 'call' ? '시즌 외 전화 문의' : '시즌 외 휴업'

  return {
    status: inSeason ? 'in_season' : 'off_season',
    label: inSeason ? '지금 영업 시즌' : '시즌 off',
    periodLabel,
    memo: data.memo || null,
    hint: inSeason ? null : offSeasonLabel,
  }
}
