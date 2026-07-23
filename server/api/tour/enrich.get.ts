import { fetchTourEnrichment } from '~/server/utils/tourApi'

/**
 * 식당명·주소로 한국관광공사 TourAPI에서 소개·메뉴·이미지 URL 등을 조회합니다.
 * contentId(+contentTypeId)가 있으면 해당 상세만 조회합니다.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const keyword = String(query.keyword ?? '').trim()
  const address = String(query.address ?? '').trim()
  const contentId = String(query.contentId ?? '').trim()
  const contentTypeId = String(query.contentTypeId ?? '').trim()

  return fetchTourEnrichment(
    keyword,
    address || undefined,
    contentId || undefined,
    contentTypeId || undefined,
  )
})
