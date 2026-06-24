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
