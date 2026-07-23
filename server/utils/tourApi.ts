const TOUR_API_BASE = 'https://apis.data.go.kr/B551011/KorService2'
const FOOD_CONTENT_TYPE_ID = '39'
/** 음식점과 혼동되기 쉬운 관련 타입(쇼핑 등)도 후보에 포함 */
const RELATED_CONTENT_TYPE_IDS = new Set(['39', '38'])

type TourApiResponse = {
  response?: {
    header?: { resultCode?: string; resultMsg?: string }
    body?: {
      items?: { item?: unknown }
      [key: string]: unknown
    }
  }
}

export type TourCandidate = {
  contentId: string
  title: string
  address: string
  contentTypeId: string
  score: number
  thumbnail?: string
}

export function getTourServiceKey(): string {
  const config = useRuntimeConfig()
  const key = config.tourApiServiceKey as string | undefined
  if (!key?.trim()) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Tour API 인증키가 설정되지 않았습니다. TOUR_API_SERVICE_KEY를 확인해 주세요.',
    })
  }
  return key.trim()
}

export function normalizeTourItems(body?: TourApiResponse['response']['body']): Record<string, unknown>[] {
  const raw = body?.items?.item
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw as Record<string, unknown>]
}

async function tourRequest(
  operation: string,
  params: Record<string, string | number | undefined>,
): Promise<TourApiResponse> {
  const serviceKey = getTourServiceKey()
  const searchParams = new URLSearchParams()
  searchParams.set('serviceKey', serviceKey)
  searchParams.set('MobileOS', 'ETC')
  searchParams.set('MobileApp', 'jalhaneunjib')
  searchParams.set('_type', 'json')

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value) !== '') {
      searchParams.set(key, String(value))
    }
  }

  const url = `${TOUR_API_BASE}/${operation}?${searchParams.toString()}`

  try {
    const data = await $fetch<TourApiResponse>(url)
    // data.go.kr 게이트웨이 오류는 평탄한 { resultCode, resultMsg } 형태
    const gateway = data as unknown as {
      resultCode?: string | number
      resultMsg?: string
      response?: TourApiResponse['response']
    }
    if (gateway?.resultCode != null && !gateway?.response) {
      throw createError({
        statusCode: 502,
        statusMessage: String(gateway.resultMsg || 'Tour API 게이트웨이 오류'),
      })
    }

    const code = data?.response?.header?.resultCode
    const msg = String(data?.response?.header?.resultMsg || '')
    // 결과 없음은 빈 목록으로 처리 (코드/메시지 변형 대응)
    if (code && code !== '0000') {
      if (
        code === '0001' ||
        code === '03' ||
        /NO\s*DATA|nodata|결과가 없습니다/i.test(msg)
      ) {
        return { response: { header: data.response?.header, body: { items: { item: [] } } } }
      }
      throw createError({ statusCode: 502, statusMessage: msg || 'Tour API 오류' })
    }
    return data
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    throw createError({
      statusCode: 502,
      statusMessage: '관광정보 API 요청에 실패했습니다.',
    })
  }
}

export async function tourSearchKeyword(
  keyword: string,
  options: { contentTypeId?: string; numOfRows?: number } = {},
) {
  // KorService2: listYN 등 구버전 *YN 파라미터 사용 불가
  return tourRequest('searchKeyword2', {
    keyword,
    contentTypeId: options.contentTypeId,
    numOfRows: options.numOfRows ?? 30,
    pageNo: 1,
    arrange: 'A',
  })
}

export async function tourDetailCommon(contentId: string) {
  // KorService2: contentId만 필수 (*YN 플래그는 구버전)
  return tourRequest('detailCommon2', {
    contentId,
    numOfRows: 10,
    pageNo: 1,
  })
}

export async function tourDetailIntro(contentId: string, contentTypeId: string) {
  // KorService2: contentId + contentTypeId 모두 필수
  return tourRequest('detailIntro2', {
    contentId,
    contentTypeId,
    numOfRows: 10,
    pageNo: 1,
  })
}

/** imageYN=Y 콘텐츠 이미지, N=음식점 메뉴 이미지 */
export async function tourDetailImages(contentId: string, imageYN: 'Y' | 'N' = 'Y') {
  return tourRequest('detailImage2', {
    contentId,
    imageYN,
    numOfRows: 20,
    pageNo: 1,
  })
}

const normalizePlaceName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '')
    .trim()

/** 검색어 변형: 원문, 공백제거, 짧은 핵심어 */
export function buildSearchKeywords(name: string): string[] {
  const trimmed = name.trim()
  if (!trimmed) return []

  const variants = new Set<string>()
  variants.add(trimmed)
  variants.add(trimmed.replace(/\s+/g, ''))

  // "OO 본점", "OO점" 등 접미 제거
  const withoutBranch = trimmed
    .replace(/\s*(본점|지점|점|식당|카페|레스토랑)$/u, '')
    .trim()
  if (withoutBranch.length >= 2) {
    variants.add(withoutBranch)
    variants.add(withoutBranch.replace(/\s+/g, ''))
  }

  // 너무 긴 이름은 앞 부분도 시도
  if (trimmed.length >= 6) {
    const head = trimmed.slice(0, Math.min(8, trimmed.length))
    if (head.length >= 2) variants.add(head)
  }

  return [...variants].filter((v) => v.length >= 2)
}

function longestCommonSubstringLength(a: string, b: string): number {
  if (!a || !b) return 0
  const m = a.length
  const n = b.length
  let best = 0
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
        if (dp[i][j] > best) best = dp[i][j]
      }
    }
  }
  return best
}

export function scoreTourPlaceMatch(
  item: Record<string, unknown>,
  name: string,
  address?: string,
): number {
  const title = String(item.title ?? '')
  const nTitle = normalizePlaceName(title)
  const nQuery = normalizePlaceName(name)
  if (!nQuery || !nTitle) return 0

  let score = 0
  if (nTitle === nQuery) score += 100
  else if (nTitle.includes(nQuery) || nQuery.includes(nTitle)) score += 80
  else {
    const lcs = longestCommonSubstringLength(nTitle, nQuery)
    const ratio = lcs / Math.max(nQuery.length, 1)
    if (lcs >= 3 && ratio >= 0.5) score += Math.round(45 + ratio * 30)
    else if (lcs >= 2 && ratio >= 0.4) score += 30
  }

  const typeId = String(item.contenttypeid ?? '')
  if (typeId === FOOD_CONTENT_TYPE_ID) score += 15
  else if (RELATED_CONTENT_TYPE_IDS.has(typeId)) score += 5

  const addrQuery = (address || '').trim()
  const itemAddr = `${item.addr1 ?? ''} ${item.addr2 ?? ''}`.trim()
  if (addrQuery && itemAddr) {
    const tokens = addrQuery
      .split(/\s+/)
      .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ''))
      .filter((t) => t.length >= 2)
    const matched = tokens.filter((t) => itemAddr.includes(t)).length
    score += Math.min(40, matched * 12)

    // 시·군·구 단위만 맞아도 가산
    const regionHints = tokens.filter((t) =>
      /(시|군|구|읍|면|동|리)$/.test(t) || t.length >= 3,
    )
    if (regionHints.some((t) => itemAddr.includes(t))) score += 8
  }

  return score
}

function toCandidate(
  item: Record<string, unknown>,
  score: number,
): TourCandidate | null {
  const contentId = String(item.contentid ?? '').trim()
  if (!contentId) return null
  const thumb = String(item.firstimage || item.firstimage2 || '').trim()
  return {
    contentId,
    title: String(item.title ?? ''),
    address: `${item.addr1 ?? ''} ${item.addr2 ?? ''}`.trim(),
    contentTypeId: String(item.contenttypeid ?? ''),
    score,
    thumbnail: thumb || undefined,
  }
}

export function rankTourCandidates(
  items: Record<string, unknown>[],
  name: string,
  address?: string,
  minScore = 25,
): TourCandidate[] {
  const byId = new Map<string, TourCandidate>()

  for (const item of items) {
    const score = scoreTourPlaceMatch(item, name, address)
    if (score < minScore) continue
    const candidate = toCandidate(item, score)
    if (!candidate) continue
    const prev = byId.get(candidate.contentId)
    if (!prev || candidate.score > prev.score) {
      byId.set(candidate.contentId, candidate)
    }
  }

  return [...byId.values()].sort((a, b) => b.score - a.score).slice(0, 12)
}

function mergeItems(...lists: Record<string, unknown>[][]) {
  const byId = new Map<string, Record<string, unknown>>()
  for (const list of lists) {
    for (const item of list) {
      const id = String(item.contentid ?? '')
      if (!id) continue
      if (!byId.has(id)) byId.set(id, item)
    }
  }
  return [...byId.values()]
}

/** 음식점 우선 + 전체 키워드 검색을 합쳐 후보를 모은다 */
export async function searchTourCandidates(name: string, address?: string) {
  const keywords = buildSearchKeywords(name)
  if (!keywords.length) return [] as TourCandidate[]

  const primary = keywords[0]
  const secondary = keywords.slice(1, 3)

  const requests: Promise<TourApiResponse>[] = [
    tourSearchKeyword(primary, { contentTypeId: FOOD_CONTENT_TYPE_ID, numOfRows: 30 }),
    tourSearchKeyword(primary, { numOfRows: 30 }),
  ]

  for (const kw of secondary) {
    requests.push(tourSearchKeyword(kw, { contentTypeId: FOOD_CONTENT_TYPE_ID, numOfRows: 20 }))
    requests.push(tourSearchKeyword(kw, { numOfRows: 20 }))
  }

  const results = await Promise.allSettled(requests)
  const itemLists = results
    .filter((r): r is PromiseFulfilledResult<TourApiResponse> => r.status === 'fulfilled')
    .map((r) => normalizeTourItems(r.value.response?.body))

  const merged = mergeItems(...itemLists)
  return rankTourCandidates(merged, name, address, 20)
}

function splitMenuTokens(raw: string): string[] {
  return raw
    .split(/[,·/|\n]+/)
    .map((s) => s.replace(/^[\d.]+\s*/, '').trim())
    .filter((s) => s.length >= 2 && s.length <= 40)
}

export function parseFoodMenusFromIntro(introItems: Record<string, unknown>[]) {
  const intro = introItems[0]
  if (!intro) return []

  const names = new Set<string>()
  const fields = ['firstmenu', 'chkcookingfood', 'treatmenu'] as const

  for (const field of fields) {
    const raw = intro[field]
    if (typeof raw !== 'string' || !raw.trim()) continue
    for (const token of splitMenuTokens(raw)) {
      names.add(token)
    }
  }

  return [...names].slice(0, 30).map((menuName) => ({
    name: menuName,
    price: '',
    description: '',
    isRecommended: false,
  }))
}

export function collectTourImageUrls(
  commonItem: Record<string, unknown> | null,
  imageItems: Record<string, unknown>[],
): string[] {
  const urls = new Set<string>()

  const push = (url: unknown) => {
    if (typeof url === 'string' && url.startsWith('http')) {
      urls.add(url)
    }
  }

  if (commonItem) {
    push(commonItem.firstimage)
    push(commonItem.firstimage2)
  }

  for (const img of imageItems) {
    push(img.originimgurl)
    push(img.smallimageurl)
  }

  return [...urls].slice(0, 5)
}

export async function fetchTourDetailByContentId(
  contentId: string,
  contentTypeId?: string,
) {
  const id = contentId.trim()
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'contentId가 필요합니다.' })
  }

  // 공통정보로 타입·소개·대표이미지를 먼저 확보
  const commonRes = await tourDetailCommon(id)
  const commonItem = normalizeTourItems(commonRes.response?.body)[0] ?? null
  const resolvedTypeId = String(
    contentTypeId || commonItem?.contenttypeid || FOOD_CONTENT_TYPE_ID,
  ).trim()

  const imageRequests: Promise<TourApiResponse>[] = [
    tourDetailImages(id, 'Y'),
  ]
  // 음식점이면 메뉴 이미지도 조회 (imageYN=N)
  if (resolvedTypeId === FOOD_CONTENT_TYPE_ID) {
    imageRequests.push(tourDetailImages(id, 'N'))
  }

  const [introRes, ...imageResults] = await Promise.all([
    tourDetailIntro(id, resolvedTypeId),
    ...imageRequests,
  ])

  const introItems = normalizeTourItems(introRes.response?.body)
  const imageItems = imageResults.flatMap((res) => normalizeTourItems(res.response?.body))

  const intro = introItems[0] ?? {}
  const overview =
    typeof commonItem?.overview === 'string' ? commonItem.overview.replace(/<[^>]+>/g, '').trim() : ''

  const homepageRaw =
    typeof commonItem?.homepage === 'string'
      ? commonItem.homepage
      : typeof intro.homepage === 'string'
        ? intro.homepage
        : ''
  // 홈페이지가 HTML 앵커로 올 수 있음
  const homepageMatch = homepageRaw.match(/href=["']([^"']+)["']/i)
  const homepage = (homepageMatch?.[1] || homepageRaw.replace(/<[^>]+>/g, '')).trim()

  const openTimeFood =
    typeof intro.opentimefood === 'string' ? intro.opentimefood.trim() : ''
  const restDateFood =
    typeof intro.restdatefood === 'string' ? intro.restdatefood.trim() : ''
  const parkingRaw =
    typeof intro.parkingfood === 'string' ? intro.parkingfood.trim() : ''

  const openingHoursHint = [openTimeFood, restDateFood].filter(Boolean).join(' / ')

  const tel =
    typeof commonItem?.tel === 'string' && commonItem.tel.trim()
      ? commonItem.tel.trim()
      : typeof intro.infocenterfood === 'string'
        ? intro.infocenterfood.trim()
        : ''

  return {
    found: true as const,
    contentId: id,
    contentTypeId: resolvedTypeId,
    title: String(commonItem?.title ?? ''),
    description: overview,
    homepage,
    tel,
    openingHoursRaw: {
      openTimeFood,
      restDateFood,
    },
    openingHoursHint,
    parkingRaw,
    parkingHint: parkingRaw,
    menuItems: parseFoodMenusFromIntro(introItems),
    imageUrls: collectTourImageUrls(commonItem, imageItems),
    candidates: [] as TourCandidate[],
  }
}

/**
 * 식당명·주소로 Tour 후보를 찾고, 확신이 높으면 상세까지 반환.
 * 애매하면 candidates만 반환해 UI에서 선택하게 한다.
 */
export async function fetchTourEnrichment(
  name: string,
  address?: string,
  contentId?: string,
  contentTypeId?: string,
) {
  if (contentId?.trim()) {
    return fetchTourDetailByContentId(contentId.trim(), contentTypeId?.trim())
  }

  const keyword = name.trim()
  if (!keyword) {
    throw createError({ statusCode: 400, statusMessage: '식당 이름이 필요합니다.' })
  }

  const candidates = await searchTourCandidates(keyword, address)

  if (!candidates.length) {
    return {
      found: false as const,
      candidates: [] as TourCandidate[],
      reason: 'no_results' as const,
    }
  }

  const best = candidates[0]
  const second = candidates[1]
  const clearWinner =
    best.score >= 70 && (!second || best.score - second.score >= 12)

  // 확신이 높으면 바로 상세 적용
  if (clearWinner) {
    const detail = await fetchTourDetailByContentId(best.contentId, best.contentTypeId)
    return {
      ...detail,
      candidates,
      autoSelected: true as const,
    }
  }

  // 애매하면 후보만 돌려 사용자가 고르게
  return {
    found: false as const,
    needsSelection: true as const,
    candidates,
    reason: 'ambiguous' as const,
  }
}
