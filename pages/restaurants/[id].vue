<template>
  <section class="restaurant-detail">
    <div v-if="restaurant" class="inner">
      <!-- 상단 헤더 영역 -->
      <div class="detail-header">
        <div class="header-left">
          <div class="category-tag">{{ restaurant.foodCategory }}</div>
          <h1 class="restaurant-name">{{ restaurant.name }}</h1>
          <div class="stats">
            <span class="rating">⭐ {{ restaurant.averageRating.toFixed(1) }}</span>
            <span class="reviews">리뷰 {{ restaurant.reviewCount }}</span>
            <span class="likes">찜 {{ restaurant.likes }}</span>
          </div>
          <p class="address">{{ restaurant.address }}</p>
        </div>
        <div class="header-right">
          <div v-if="user?.role === 'ADMIN'" class="admin-actions">
            <AppButton size="sm" variant="outline" @click="handleEdit">정보 수정</AppButton>
            <AppButton size="sm" color="red" variant="outline" @click="handleDelete">삭제</AppButton>
          </div>
          <AppButton size="md" color="green" class="like-btn">❤️ 맛집 저장</AppButton>
        </div>
      </div>

      <div class="detail-grid">
        <!-- 메인 콘텐츠 영역 -->
        <div class="main-content">
          <!-- 이미지 갤러리 (Swiper) -->
          <div class="info-section card-box">
            <div class="image-wrap">
              <Swiper
                v-if="restaurant.images?.length"
                :modules="swiperModules"
                :slides-per-view="1"
                :loop="true"
                :pagination="{ clickable: true }"
                :navigation="true"
                :autoplay="{ delay: 5000 }"
                class="detail-swiper"
              >
                <SwiperSlide v-for="(img, idx) in restaurant.images" :key="idx">
                  <img :src="img" :alt="`${restaurant.name} 이미지 ${idx + 1}`" class="main-thumbnail" />
                </SwiperSlide>
              </Swiper>
              <img 
                v-else
                :src="restaurant.thumbnail || '/assets/images/common/default.jpg'" 
                :alt="restaurant.name" 
                class="main-thumbnail" 
              />
            </div>
            <div class="content-text">
              <h2 class="section-title">식당 소개</h2>
              <p class="description">{{ restaurant.description || '식당 소개가 등록되지 않았습니다.' }}</p>
              <div class="keyword-tags" v-if="restaurant.keywords?.length">
                <span v-for="tag in restaurant.keywords" :key="tag" class="tag">#{{ tag }}</span>
              </div>
            </div>
          </div>

          <!-- 메뉴 섹션 -->
          <div class="menu-section card-box">
            <h2 class="section-title">메뉴 안내</h2>
            <div class="menu-list">
              <button
                v-for="menu in restaurant.menus"
                :key="menu.id"
                type="button"
                class="menu-card"
                :class="{ 'has-image': !!menu.image }"
                @click="menu.image ? openLightbox(menu) : undefined"
              >
                <div class="menu-img-wrap">
                  <img
                    :src="menu.image || '/assets/images/common/default.jpg'"
                    :alt="menu.name"
                    class="menu-img"
                  />
                  <!-- 이미지 위에 힌트 오버레이 -->
                  <span v-if="menu.image" class="menu-img-hint">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                    사진 보기
                  </span>
                </div>
                <div class="menu-info">
                  <!-- 추천 뱃지를 텍스트 영역 안, 이름 위로 이동 -->
                  <div v-if="menu.isRecommended" class="recommend-badge">추천</div>
                  <span class="menu-name">{{ menu.name }}</span>
                  <span class="menu-price">{{ menu.price ? menu.price.toLocaleString() + '원' : '변동' }}</span>
                  <p class="menu-desc">{{ menu.description }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- 댓글 섹션 -->
          <div class="comment-section card-box">
            <h2 class="section-title">댓글 ({{ totalCommentsCount }})</h2>
            
            <!-- 댓글 입력창 -->
            <div class="comment-input-wrap" v-if="user">
              <textarea 
                v-model="newComment" 
                placeholder="댓글을 남겨보세요. 매너 있는 댓글은 작성자에게 큰 힘이 됩니다."
                rows="3"
              ></textarea>
              <div class="input-footer">
                <AppButton size="sm" color="green" :disabled="!newComment.trim()" @click="submitComment()">등록</AppButton>
              </div>
            </div>
            <div v-else class="comment-login-guide">
              <p>댓글을 작성하려면 <NuxtLink to="/login">로그인</NuxtLink>이 필요합니다.</p>
            </div>

            <!-- 댓글 리스트 -->
            <div class="comment-list">
              <div v-for="comment in restaurant.comments" :key="comment.id" class="comment-item">
                <div class="comment-main">
                  <div class="comment-header">
                    <span class="nickname">{{ comment.user.nickname || comment.user.username }}</span>
                    <span class="date">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                  <p class="content">{{ comment.content }}</p>
                  <div class="comment-actions">
                    <button @click="activeReplyId = activeReplyId === comment.id ? null : comment.id">답글 쓰기</button>
                    <button v-if="user?.id === comment.userId || user?.role === 'ADMIN'" class="delete-btn" @click="deleteComment(comment.id)">삭제</button>
                  </div>
                </div>

                <!-- 대댓글 입력창 -->
                <div v-if="activeReplyId === comment.id" class="reply-input-wrap">
                  <textarea v-model="newReply" placeholder="답글을 입력하세요..."></textarea>
                  <div class="reply-btns">
                    <AppButton size="xs" variant="outline" @click="activeReplyId = null">취소</AppButton>
                    <AppButton size="xs" color="green" @click="submitComment(comment.id)">답글 등록</AppButton>
                  </div>
                </div>

                <!-- 대댓글 리스트 -->
                <div class="replies-list" v-if="comment.replies?.length">
                  <div v-for="reply in comment.replies" :key="reply.id" class="reply-item">
                    <div class="reply-header">
                      <span class="nickname">{{ reply.user.nickname || reply.user.username }}</span>
                      <span class="date">{{ formatDate(reply.createdAt) }}</span>
                    </div>
                    <p class="content">{{ reply.content }}</p>
                    <div class="reply-actions" v-if="user?.id === reply.userId || user?.role === 'ADMIN'">
                      <button class="delete-btn" @click="deleteComment(reply.id)">삭제</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 사이드바 정보 -->
        <aside class="side-content">
          <div class="side-card map-card">
            <h3 class="side-title">위치 정보</h3>
            <div class="map-wrap">
              <AppMap ref="mapRef" :lat="restaurant.lat" :lng="restaurant.lng" />
            </div>
            <div class="location-details">
              <p class="address-text">{{ restaurant.address }}</p>
              <div class="btn-group">
                <AppButton size="sm" variant="outline" @click="copyAddress">주소 복사</AppButton>
                <a :href="`https://map.kakao.com/link/to/${restaurant.name},${restaurant.lat},${restaurant.lng}`" target="_blank" class="map-link">길찾기</a>
              </div>
            </div>
          </div>

          <div class="side-card contact-card">
            <h3 class="side-title">영업 및 연락처</h3>
            <ul class="contact-list">
              <li>
                <span class="label">연락처</span>
                <a :href="`tel:${restaurant.phoneNumber}`" class="value">{{ restaurant.phoneNumber || '정보 없음' }}</a>
              </li>
              <li>
                <span class="label">영업시간</span>
                <span class="value pre-wrap">{{ restaurant.openingHours || '정보 없음' }}</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <!-- 메뉴 이미지 라이트박스 -->
  <Teleport to="body">
    <Transition name="lightbox-fade">
      <div v-if="lightboxOpen" class="menu-lightbox" @click.self="closeLightbox" role="dialog" aria-modal="true">

        <!-- 닫기 버튼 -->
        <button class="lightbox-close" @click="closeLightbox" aria-label="닫기">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>

        <!-- Swiper 슬라이더 -->
        <Swiper
          :modules="swiperModules"
          :initial-slide="lightboxIndex"
          :loop="imageMenus.length > 1"
          :keyboard="{ enabled: true }"
          :navigation="{ prevEl: '.lightbox-prev', nextEl: '.lightbox-next' }"
          class="lightbox-swiper"
          @slide-change="onSlideChange"
        >
          <SwiperSlide v-for="menu in imageMenus" :key="menu.id">
            <div class="slide-inner">
              <img :src="menu.image" :alt="menu.name" class="lightbox-img" />
              <div class="lightbox-info">
                <span class="lightbox-name">{{ menu.name }}</span>
                <span v-if="menu.price" class="lightbox-price">{{ menu.price.toLocaleString() }}원</span>
                <span v-if="menu.isRecommended" class="lightbox-badge">추천</span>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>

        <!-- 카운터 -->
        <p v-if="imageMenus.length > 1" class="lightbox-counter">
          {{ currentSlideIndex + 1 }} / {{ imageMenus.length }}
        </p>

        <!-- 이전/다음 버튼 -->
        <button v-if="imageMenus.length > 1" class="lightbox-nav lightbox-prev" aria-label="이전">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <button v-if="imageMenus.length > 1" class="lightbox-nav lightbox-next" aria-label="다음">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Autoplay, Keyboard } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

const route = useRoute()
const { user } = useAuth()
const mapRef = ref(null)

const { data: restaurant, refresh, error } = await useFetch(`/api/restaurants/${route.params.id}`)

if (error.value) {
  throw createError({ 
    statusCode: error.value.statusCode, 
    message: error.value.message || '식당 정보를 불러올 수 없습니다.' 
  })
}

if (!restaurant.value) {
  throw createError({ statusCode: 404, message: '식당 정보를 찾을 수 없습니다.' })
}

// 라이트박스 및 메인 갤러리
const swiperModules = [Navigation, Pagination, Autoplay, Keyboard]
const imageMenus = computed(() => restaurant.value?.menus.filter((m) => !!m.image) ?? [])
const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const currentSlideIndex = ref(0)

const openLightbox = (menu) => {
  const idx = imageMenus.value.findIndex((m) => m.id === menu.id)
  if (idx === -1) return
  lightboxIndex.value = idx
  currentSlideIndex.value = idx
  lightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  lightboxOpen.value = false
  document.body.style.overflow = ''
}

const onSlideChange = (swiper) => {
  currentSlideIndex.value = swiper.realIndex
}

const handleKeydown = (e) => {
  if (!lightboxOpen.value) return
  if (e.key === 'Escape') closeLightbox()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// 댓글 관련 상태
const newComment = ref('')
const newReply = ref('')
const activeReplyId = ref(null)

const totalCommentsCount = computed(() => {
  if (!restaurant.value?.comments) return 0
  return restaurant.value.comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0)
})

const submitComment = async (parentId = null) => {
  const content = parentId ? newReply.value : newComment.value
  if (!content.trim()) return

  try {
    await $fetch('/api/comments/register', {
      method: 'POST',
      body: {
        content,
        restaurantId: restaurant.value.id,
        userId: user.value.id,
        parentId
      }
    })
    
    // 초기화
    if (parentId) {
      newReply.value = ''
      activeReplyId.value = null
    } else {
      newComment.value = ''
    }
    
    await refresh() // 데이터 갱신
  } catch (e) {
    alert('댓글 등록에 실패했습니다.')
  }
}

const deleteComment = async (id) => {
  if (!confirm('댓글을 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/comments/${id}`, { method: 'DELETE' })
    await refresh()
  } catch (e) {
    alert('삭제 실패')
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

const handleEdit = () => navigateTo(`/restaurants/${route.params.id}/edit`)

const handleDelete = async () => {
  if (!confirm('정말 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/restaurants/${route.params.id}`, { method: 'DELETE' })
    navigateTo('/restaurants')
  } catch (e) {
    alert('오류 발생')
  }
}

const copyAddress = () => {
  navigator.clipboard.writeText(restaurant.value.address)
  alert('주소가 복사되었습니다.')
}
</script>
