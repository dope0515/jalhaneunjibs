export const MIN_PLACE_MATCH_SCORE = 50

export function normalizePlaceName(name) {
  return (name ?? '').trim().replace(/\s+/g, '')
}

export function scorePlaceNameMatch(placeName, query) {
  const trimmedQuery = query?.trim()
  if (!trimmedQuery) return 0

  const normalizedPlace = normalizePlaceName(placeName)
  const normalizedQuery = normalizePlaceName(trimmedQuery)
  if (!normalizedQuery) return 0

  if (normalizedPlace === normalizedQuery) return 100
  if (normalizedPlace.startsWith(normalizedQuery)) return 80
  if (normalizedPlace.includes(normalizedQuery)) return 60

  const tokens = trimmedQuery.split(/\s+/).filter(Boolean)
  if (tokens.length > 1 && tokens.every((token) => placeName.includes(token))) {
    return 50
  }

  return 0
}

export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistanceLabel(km) {
  if (km == null || Number.isNaN(km)) return ''
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(km < 10 ? 1 : 0)}km`
}

export function preparePlaceSearchResults(places, query, origin) {
  const originLat = origin?.getLat?.() ?? origin?.lat
  const originLng = origin?.getLng?.() ?? origin?.lng
  const hasOrigin = Number.isFinite(originLat) && Number.isFinite(originLng)

  const scored = places
    .map((place) => {
      const score = scorePlaceNameMatch(place.place_name, query)
      if (score < MIN_PLACE_MATCH_SCORE) return null

      const lat = parseFloat(place.y)
      const lng = parseFloat(place.x)
      const distanceKm =
        hasOrigin && Number.isFinite(lat) && Number.isFinite(lng)
          ? getDistanceKm(originLat, originLng, lat, lng)
          : null

      return { ...place, _matchScore: score, _distanceKm: distanceKm }
    })
    .filter(Boolean)

  scored.sort((a, b) => {
    if (b._matchScore !== a._matchScore) return b._matchScore - a._matchScore
    return (a._distanceKm ?? Infinity) - (b._distanceKm ?? Infinity)
  })

  return scored
}
