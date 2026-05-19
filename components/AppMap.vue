<template>
  <div ref="mapContainer" class="map"></div>
</template>

<script setup>
const props = defineProps({
  lat: { type: [Number, String], default: 37.566826 },
  lng: { type: [Number, String], default: 126.9786567 },
  draggable: { type: Boolean, default: false }
})

const mapContainer = ref(null)
const { loadSDK } = useKakaoMap()

let map = null
let marker = null

const initMap = () => {
  if (!mapContainer.value || map || !window.kakao || !window.kakao.maps) return

  const options = {
    center: new window.kakao.maps.LatLng(Number(props.lat), Number(props.lng)),
    level: 3
  }
  map = new window.kakao.maps.Map(mapContainer.value, options)

  const markerImageSrc = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 35C20 35 32 24.3857 32 16C32 9.37258 26.6274 4 20 4C13.3726 4 8 9.37258 8 16C8 24.3857 20 35 20 35Z" fill="#155E4E"/>
      <circle cx="20" cy="16" r="6" fill="white"/>
    </svg>
  `)
  const markerImage = new window.kakao.maps.MarkerImage(
    markerImageSrc,
    new window.kakao.maps.Size(40, 40),
    { offset: new window.kakao.maps.Point(20, 35) }
  )

  marker = new window.kakao.maps.Marker({
    position: map.getCenter(),
    image: markerImage,
    draggable: props.draggable
  })
  marker.setMap(map)
}

onMounted(() => {
  loadSDK(initMap)
})

watch(() => [props.lat, props.lng], ([newLat, newLng]) => {
  if (map && window.kakao && window.kakao.maps) {
    const coords = new window.kakao.maps.LatLng(Number(newLat), Number(newLng))
    map.setCenter(coords)
    if (marker) marker.setPosition(coords)
  }
})

// 외부에서 마커 위치를 업데이트해야 할 때 사용
defineExpose({
  setCenter: (lat, lng) => {
    if (!map) return
    const coords = new window.kakao.maps.LatLng(lat, lng)
    map.setCenter(coords)
    marker.setPosition(coords)
  }
})
</script>

<style scoped>
.map {
  width: 100%;
  background-color: #f5f5f5;
  border-radius: 12px;
}
</style>
