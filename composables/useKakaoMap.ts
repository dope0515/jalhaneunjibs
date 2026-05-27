declare global {
  interface Window {
    kakao: any
  }
}

export const useKakaoMap = () => {
  const config = useRuntimeConfig()
  const kakaoKey = config.public.kakaoMapKey
  const isLoaded = ref(false)

  const loadSDK = (callback: () => void) => {
    if (process.server) return

    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(callback)
      return
    }

    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoKey}&libraries=services&autoload=false`
    script.onload = () => {
      window.kakao.maps.load(() => {
        isLoaded.value = true
        callback()
      })
    }
    document.head.appendChild(script)
  }

  return {
    loadSDK,
    isLoaded
  }
}
