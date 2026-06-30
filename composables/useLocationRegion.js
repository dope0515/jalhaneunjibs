import { useKakaoMap } from '~/composables/useKakaoMap'

const REGION_SHORT_NAMES = {
  서울: '서울',
  서울특별시: '서울',
  부산: '부산',
  부산광역시: '부산',
  대구: '대구',
  대구광역시: '대구',
  인천: '인천',
  인천광역시: '인천',
  광주: '광주',
  광주광역시: '광주',
  대전: '대전',
  대전광역시: '대전',
  울산: '울산',
  울산광역시: '울산',
  세종: '세종',
  세종시: '세종',
  세종특별자치시: '세종',
  경기: '경기',
  경기도: '경기',
  강원: '강원',
  강원도: '강원',
  강원특별자치도: '강원',
  충북: '충북',
  충청북도: '충북',
  충남: '충남',
  충청남도: '충남',
  전북: '전북',
  전라북도: '전북',
  전북특별자치도: '전북',
  전남: '전남',
  전라남도: '전남',
  경북: '경북',
  경상북도: '경북',
  경남: '경남',
  경상남도: '경남',
  제주: '제주',
  제주도: '제주',
  제주특별자치도: '제주',
}

export function useLocationRegion(regionsMap, regionKeys) {
  const isLocating = ref(false)
  const { loadSDK } = useKakaoMap()

  const resolveCurrentLocation = () =>
    new Promise((resolve, reject) => {
      if (import.meta.server) {
        reject(new Error('server'))
        return
      }
      if (!navigator.geolocation) {
        reject(new Error('unsupported'))
        return
      }

      isLocating.value = true

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords

          loadSDK(() => {
            if (!window.kakao?.maps?.services) {
              isLocating.value = false
              reject(new Error('sdk'))
              return
            }

            const geocoder = new window.kakao.maps.services.Geocoder()
            geocoder.coord2RegionCode(longitude, latitude, (result, status) => {
              isLocating.value = false

              if (status !== window.kakao.maps.services.Status.OK) {
                reject(new Error('geocode'))
                return
              }

              const regionInfo = result.find((r) => r.region_type === 'H') || result[0]
              if (!regionInfo) {
                reject(new Error('no-region'))
                return
              }

              const rawRegion1 = regionInfo.region_1depth_name
              const rawRegion2 = regionInfo.region_2depth_name
              const matchedR1 = REGION_SHORT_NAMES[rawRegion1] ?? rawRegion1

              if (!regionKeys.value.includes(matchedR1)) {
                reject(new Error('no-data'))
                return
              }

              const subRegions = regionsMap.value[matchedR1] ?? []
              const matchedR2 =
                subRegions.find(
                  (sub) => rawRegion2.includes(sub) || sub.includes(rawRegion2),
                ) || null

              resolve({ region1: matchedR1, region2: matchedR2 })
            })
          })
        },
        (error) => {
          isLocating.value = false
          reject(error)
        },
      )
    })

  const alertLocationError = (error) => {
    if (error?.code !== undefined) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          alert('위치 권한 허용이 거부되었습니다. 설정에서 허용해 주세요.')
          return
        case error.POSITION_UNAVAILABLE:
          alert('위치 정보를 사용할 수 없습니다.')
          return
        case error.TIMEOUT:
          alert('위치 정보를 가져오는 요청 시간이 초과되었습니다.')
          return
        default:
          alert('위치 정보를 가져오는 중 오류가 발생했습니다.')
          return
      }
    }

    switch (error?.message) {
      case 'unsupported':
        alert('이 브라우저에서는 위치 정보(Geolocation)를 지원하지 않습니다.')
        break
      case 'sdk':
        alert('카카오 지도 라이브러리를 로드하지 못했습니다.')
        break
      case 'geocode':
        alert('주소 변환에 실패했습니다.')
        break
      case 'no-region':
        alert('위치에 해당하는 행정 구역 정보를 찾을 수 없습니다.')
        break
      case 'no-data':
        alert('현재 위치에 등록된 맛집 지역이 없습니다.')
        break
      default:
        alert('위치 정보를 가져오는 중 오류가 발생했습니다.')
    }
  }

  return {
    isLocating,
    resolveCurrentLocation,
    alertLocationError,
  }
}
