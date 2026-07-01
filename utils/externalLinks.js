const LINK_FIELDS = [
  { key: 'instagram', label: '인스타그램' },
  { key: 'naver', label: '네이버' },
  { key: 'website', label: '홈페이지' },
  { key: 'kakaoChannel', label: '카카오채널' },
]

export function createDefaultExternalLinksData() {
  return {
    hasLinks: false,
    instagram: '',
    naver: '',
    website: '',
    kakaoChannel: '',
  }
}

export function normalizeExternalUrl(url) {
  const trimmed = url?.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export function isValidExternalUrl(url) {
  const normalized = normalizeExternalUrl(url)
  if (!normalized) return false
  try {
    const parsed = new URL(normalized)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function parseExternalLinks(str) {
  const data = createDefaultExternalLinksData()
  if (!str) return data

  if (str.trimStart().startsWith('{')) {
    try {
      const parsed = JSON.parse(str)
      data.hasLinks = true
      for (const { key } of LINK_FIELDS) {
        data[key] = parsed[key]?.trim() || ''
      }
      return data
    } catch {}
  }

  return data
}

export function formatExternalLinks(data) {
  if (!data?.hasLinks) return ''

  const payload = {}
  for (const { key } of LINK_FIELDS) {
    const normalized = normalizeExternalUrl(data[key])
    if (normalized && isValidExternalUrl(normalized)) {
      payload[key] = normalized
    }
  }

  if (!Object.keys(payload).length) return ''

  return JSON.stringify(payload)
}

export function parseExternalLinksForDisplay(str) {
  const data = parseExternalLinks(str)
  if (!data.hasLinks) return []

  return LINK_FIELDS
    .map(({ key, label }) => {
      const url = normalizeExternalUrl(data[key])
      if (!url || !isValidExternalUrl(url)) return null
      return { key, label, url }
    })
    .filter(Boolean)
}

export { LINK_FIELDS }
