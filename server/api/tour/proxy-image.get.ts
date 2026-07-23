const ALLOWED_HOST_SUFFIXES = [
  'visitkorea.or.kr',
  'go.kr',
  'knto.or.kr',
]

function isAllowedImageUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`),
    )
  } catch {
    return false
  }
}

/** Tour/관광 이미지 URL을 서버에서 받아 클라이언트 CORS 없이 사용 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const url = String(query.url ?? '').trim()

  if (!url || !isAllowedImageUrl(url)) {
    throw createError({ statusCode: 400, statusMessage: '허용되지 않은 이미지 URL입니다.' })
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw createError({ statusCode: 502, statusMessage: '이미지를 가져오지 못했습니다.' })
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg'
  const buffer = Buffer.from(await response.arrayBuffer())

  setHeader(event, 'Content-Type', contentType)
  setHeader(event, 'Cache-Control', 'private, max-age=3600')

  return buffer
})
