export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

export function createDaySchedules(openTime = '11:30', closeTime = '21:30') {
  return Object.fromEntries(
    WEEKDAYS.map((day) => [day, { closed: false, openTime, closeTime }])
  )
}

export function createDefaultOpData() {
  return {
    hasOpeningHours: false,
    scheduleMode: 'uniform',
    dayType: 'everyday',
    customDays: [...WEEKDAYS],
    openTime: '11:30',
    closeTime: '21:30',
    hasBreakTime: false,
    breakStartTime: '14:00',
    breakEndTime: '17:00',
    hasLastOrder: false,
    lastOrderTime: '20:00',
    hasClosedDays: false,
    closedDays: [],
    daySchedules: createDaySchedules(),
  }
}

export function expandDaysLabel(daysPart) {
  const part = daysPart.trim()
  if (!part) return []

  if (part.includes('~')) {
    const [start, end] = part.split('~').map((s) => s.trim())
    const startIndex = WEEKDAYS.indexOf(start)
    const endIndex = WEEKDAYS.indexOf(end)
    if (startIndex >= 0 && endIndex >= 0 && startIndex <= endIndex) {
      return WEEKDAYS.slice(startIndex, endIndex + 1)
    }
  }

  if (part.includes(',')) {
    return part
      .split(',')
      .map((day) => day.trim())
      .filter((day) => WEEKDAYS.includes(day))
  }

  return WEEKDAYS.includes(part) ? [part] : []
}

export function formatDaysLabel(days) {
  if (!days.length) return ''

  const indices = days.map((day) => WEEKDAYS.indexOf(day)).sort((a, b) => a - b)
  const isConsecutive = indices.every((index, i) => i === 0 || index === indices[i - 1] + 1)

  if (isConsecutive && days.length > 1) {
    return `${WEEKDAYS[indices[0]]} ~ ${WEEKDAYS[indices[indices.length - 1]]}`
  }

  return days.join(', ')
}

function formatUniformDays(opData) {
  if (opData.dayType === 'everyday') return '월 ~ 일'
  if (opData.dayType === 'weekdays') return '월 ~ 금'
  if (opData.dayType === 'weekends') return '토 ~ 일'

  const selected = WEEKDAYS.filter((day) => opData.customDays.includes(day))
  if (!selected.length) return '요일 선택 없음'
  return formatDaysLabel(selected)
}

function appendExtras(result, opData) {
  let next = result

  if (opData.hasBreakTime) {
    next += `\n브레이크 타임 : ${opData.breakStartTime} ~ ${opData.breakEndTime}`
  }

  if (opData.hasLastOrder) {
    next += `\n라스트 오더 : ${opData.lastOrderTime}`
  }

  if (opData.scheduleMode === 'uniform' && opData.hasClosedDays && opData.closedDays.length > 0) {
    const selectedClosed = WEEKDAYS.filter((day) => opData.closedDays.includes(day))
    next += `\n휴무일 : 매주 ${selectedClosed.join(', ')}요일`
  }

  return next
}

function formatPerDaySchedules(opData) {
  const lines = []
  let currentGroup = null

  const flushGroup = () => {
    if (!currentGroup) return

    const label = formatDaysLabel(currentGroup.days)
    if (currentGroup.closed) {
      lines.push(`${label} : 휴무`)
    } else {
      lines.push(`${label} : ${currentGroup.openTime} ~ ${currentGroup.closeTime}`)
    }
    currentGroup = null
  }

  WEEKDAYS.forEach((day) => {
    const schedule = opData.daySchedules?.[day] || { closed: false, openTime: '11:30', closeTime: '21:30' }
    const signature = schedule.closed
      ? 'closed'
      : `${schedule.openTime}-${schedule.closeTime}`

    if (!currentGroup || currentGroup.signature !== signature) {
      flushGroup()
      currentGroup = {
        days: [day],
        signature,
        closed: schedule.closed,
        openTime: schedule.openTime,
        closeTime: schedule.closeTime,
      }
      return
    }

    currentGroup.days.push(day)
  })

  flushGroup()
  return lines.join('\n')
}

export function formatOpeningHours(opData) {
  if (!opData?.hasOpeningHours) return ''

  const scheduleText =
    opData.scheduleMode === 'perDay'
      ? formatPerDaySchedules(opData)
      : `${formatUniformDays(opData)} : ${opData.openTime} ~ ${opData.closeTime}`

  return appendExtras(scheduleText, opData)
}

export function parseOpeningHours(str) {
  const data = createDefaultOpData()
  if (!str) return data

  data.hasOpeningHours = true

  const lines = str.split('\n').map((line) => line.trim()).filter(Boolean)
  const scheduleLines = []

  for (const line of lines) {
    if (line.includes('브레이크 타임')) {
      const match = line.match(/브레이크 타임\s*:\s*(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)
      if (match) {
        data.hasBreakTime = true
        data.breakStartTime = match[1]
        data.breakEndTime = match[2]
      }
      continue
    }

    if (line.includes('라스트 오더')) {
      const match = line.match(/라스트 오더\s*:\s*(\d{2}:\d{2})/)
      if (match) {
        data.hasLastOrder = true
        data.lastOrderTime = match[1]
      }
      continue
    }

    if (line.includes('휴무일')) {
      const match = line.match(/휴무일\s*:\s*매주\s*(.*?)요일/)
      if (match) {
        data.hasClosedDays = true
        data.closedDays = match[1].split(',').map((day) => day.trim())
      }
      continue
    }

    const match = line.match(/^(.+?)\s*:\s*(.+)$/)
    if (!match) continue

    scheduleLines.push({
      daysPart: match[1].trim(),
      timePart: match[2].trim(),
    })
  }

  if (!scheduleLines.length) return data

  const isPerDay =
    scheduleLines.length > 1 ||
    expandDaysLabel(scheduleLines[0].daysPart).length === 1

  if (isPerDay) {
    data.scheduleMode = 'perDay'
    data.daySchedules = createDaySchedules()

    scheduleLines.forEach(({ daysPart, timePart }) => {
      const days = expandDaysLabel(daysPart)
      const isClosed = timePart.includes('휴무')
      const timeMatch = timePart.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)

      days.forEach((day) => {
        data.daySchedules[day] = {
          closed: isClosed,
          openTime: timeMatch?.[1] || data.openTime,
          closeTime: timeMatch?.[2] || data.closeTime,
        }
      })
    })

    return data
  }

  const { daysPart, timePart } = scheduleLines[0]
  const timeMatch = timePart.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/)
  if (timeMatch) {
    data.openTime = timeMatch[1]
    data.closeTime = timeMatch[2]
  }

  if (daysPart === '월 ~ 일') {
    data.dayType = 'everyday'
    data.customDays = [...WEEKDAYS]
  } else if (daysPart === '월 ~ 금') {
    data.dayType = 'weekdays'
    data.customDays = ['월', '화', '수', '목', '금']
  } else if (daysPart === '토 ~ 일') {
    data.dayType = 'weekends'
    data.customDays = ['토', '일']
  } else {
    data.dayType = 'custom'
    data.customDays = expandDaysLabel(daysPart)
  }

  return data
}

const DAY_ALIASES = {
  월: '월',
  월요일: '월',
  화: '화',
  화요일: '화',
  수: '수',
  수요일: '수',
  목: '목',
  목요일: '목',
  금: '금',
  금요일: '금',
  토: '토',
  토요일: '토',
  일: '일',
  일요일: '일',
}

function normalizeTimeToken(raw) {
  if (!raw) return null
  const cleaned = String(raw).replace(/\s/g, '')
  const match = cleaned.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function extractTimeRange(text) {
  if (!text) return null
  const match = String(text).match(/(\d{1,2}:\d{2})\s*[~\-–—]\s*(\d{1,2}:\d{2})/)
  if (!match) return null
  const openTime = normalizeTimeToken(match[1])
  const closeTime = normalizeTimeToken(match[2])
  if (!openTime || !closeTime) return null
  return { openTime, closeTime, index: match.index ?? 0, length: match[0].length }
}

function extractWeeklyClosedDays(restText) {
  if (!restText) return []
  // 매월/격주 등 위젯에 없는 규칙은 제외
  if (/매월|격주|임시|가변|공지|별도/.test(restText)) return []

  const weekly = restText.match(/매주\s*([월화수목금토일,\s요일및과와~·\/\-]+)/)
  const source = weekly?.[1] || (/매주/.test(restText) ? restText : '')
  if (!source && !/휴무|휴일|Closed/i.test(restText)) {
    // "화요일 휴무" 형태
    const single = restText.match(/([월화수목금토일](?:요일)?)\s*(?:휴무|휴일)/)
    if (!single) return []
    const day = DAY_ALIASES[single[1]] || DAY_ALIASES[`${single[1]}요일`]
    return day ? [day] : []
  }

  const days = []
  const tokens = (source || restText).match(/[월화수목금토일](?:요일)?/g) || []
  for (const token of tokens) {
    const day = DAY_ALIASES[token] || DAY_ALIASES[`${token}요일`]
    if (day && !days.includes(day)) days.push(day)
  }
  return days
}

/**
 * TourAPI 음식점 영업/휴무 원문 → 등록 폼 opData
 * @returns {{ opData: ReturnType<typeof createDefaultOpData>, unparsedNotes: string, parsed: boolean }}
 */
export function parseTourOpeningHours(openTimeFood, restDateFood) {
  const data = createDefaultOpData()
  const notes = []
  const openRaw = (openTimeFood || '').trim()
  const restRaw = (restDateFood || '').trim()

  if (!openRaw && !restRaw) {
    return { opData: data, unparsedNotes: '', parsed: false }
  }

  let parsedSomething = false

  // 브레이크/준비시간 먼저 분리
  const breakMatch = openRaw.match(
    /\((?:준비시간|브레이크(?:\s*타임)?|break(?:\s*time)?)\s*([^)]+)\)/i,
  )
  let openForHours = openRaw
  if (breakMatch) {
    const breakRange = extractTimeRange(breakMatch[1])
    if (breakRange) {
      data.hasBreakTime = true
      data.breakStartTime = breakRange.openTime
      data.breakEndTime = breakRange.closeTime
      parsedSomething = true
    } else {
      notes.push(breakMatch[0])
    }
    openForHours = openRaw.replace(breakMatch[0], ' ').trim()
  } else {
    const inlineBreak = openRaw.match(
      /(?:준비시간|브레이크(?:\s*타임)?)\s*[:\s]*(\d{1,2}:\d{2}\s*[~\-–—]\s*\d{1,2}:\d{2})/i,
    )
    if (inlineBreak) {
      const breakRange = extractTimeRange(inlineBreak[1])
      if (breakRange) {
        data.hasBreakTime = true
        data.breakStartTime = breakRange.openTime
        data.breakEndTime = breakRange.closeTime
        parsedSomething = true
        openForHours = openRaw.replace(inlineBreak[0], ' ').trim()
      }
    }
  }

  const mainRange = extractTimeRange(openForHours)
  if (mainRange) {
    data.hasOpeningHours = true
    data.scheduleMode = 'uniform'
    data.dayType = 'everyday'
    data.customDays = [...WEEKDAYS]
    data.openTime = mainRange.openTime
    data.closeTime = mainRange.closeTime
    data.daySchedules = createDaySchedules(mainRange.openTime, mainRange.closeTime)
    parsedSomething = true

    const leftover = openForHours
      .replace(openForHours.slice(mainRange.index, mainRange.index + mainRange.length), ' ')
      .replace(/[()]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (leftover && leftover.length > 1) notes.push(leftover)
  } else if (openRaw) {
    notes.push(openRaw)
  }

  const closedDays = extractWeeklyClosedDays(restRaw)
  if (closedDays.length) {
    data.hasOpeningHours = true
    data.hasClosedDays = true
    data.closedDays = closedDays
    parsedSomething = true
  } else if (restRaw) {
    notes.push(restRaw)
  }

  if (!parsedSomething && (openRaw || restRaw)) {
    // 파싱 실패해도 원문이 있으면 토글만 켜고 노트 보존 — 위젯 기본 시간은 쓰지 않음
    return {
      opData: data,
      unparsedNotes: [openRaw, restRaw].filter(Boolean).join(' / '),
      parsed: false,
    }
  }

  return {
    opData: data,
    unparsedNotes: notes.filter(Boolean).join(' / '),
    parsed: parsedSomething,
  }
}
