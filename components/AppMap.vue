<template>
  <div ref="mapContainer" class="map"></div>
</template>

<script setup>
const props = defineProps({
  lat: { type: [Number, String], default: 37.566826 },
  lng: { type: [Number, String], default: 126.9786567 },
  draggable: { type: Boolean, default: false }
})

const emit = defineEmits(['position-change'])

const mapContainer = ref(null)
const { loadSDK } = useKakaoMap()

let map = null
let marker = null

const initMap = () => {
  if (
    !mapContainer.value ||
    map ||
    !window.kakao?.maps ||
    typeof window.kakao.maps.LatLng !== 'function'
  ) return

  const options = {
    center: new window.kakao.maps.LatLng(Number(props.lat), Number(props.lng)),
    level: 3
  }
  map = new window.kakao.maps.Map(mapContainer.value, options)

  const markerImageSrc = '/assets/images/icon/ic_marker.svg'

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

  if (props.draggable) {
    window.kakao.maps.event.addListener(marker, 'dragend', () => {
      const pos = marker.getPosition()
      emit('position-change', { lat: pos.getLat(), lng: pos.getLng() })
    })
  }
}

onMounted(() => {
  loadSDK(initMap)
})

watch(() => [props.lat, props.lng], ([newLat, newLng]) => {
  if (map && typeof window.kakao?.maps?.LatLng === 'function') {
    const coords = new window.kakao.maps.LatLng(Number(newLat), Number(newLng))
    map.setCenter(coords)
    if (marker) marker.setPosition(coords)
  }
})

// 외부에서 마커 위치를 업데이트해야 할 때 사용
defineExpose({
  setCenter: (lat, lng) => {
    if (!map || typeof window.kakao?.maps?.LatLng !== 'function') return
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
