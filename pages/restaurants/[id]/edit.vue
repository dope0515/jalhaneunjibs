<template>
  <section class="restaurant-edit">
    <AppLoading :loading="isSubmitting" message="수정 내용을 저장하고 있습니다..." />

    <!-- hidden file inputs -->
    <input ref="restaurantImgInputRef" type="file" accept="image/*" multiple style="display:none" @change="handleRestaurantImages" />
    <input ref="menuImgInputRef" type="file" accept="image/*" style="display:none" @change="handleMenuImageUpload" />

    <div class="inner" v-if="restaurant">
      <!-- 상단 헤더 -->
      <div class="edit-header">
        <div class="edit-header-left">
          <NuxtLink :to="`/restaurants/${route.params.id}`" class="back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </NuxtLink>
          <div>
            <p class="edit-sub">식당 정보 수정</p>
            <h1 class="edit-title">{{ restaurant.name }}</h1>
          </div>
        </div>
        <div class="edit-header-actions">
          <AppButton size="sm" variant="outline" @click="navigateTo(`/restaurants/${route.params.id}`)">취소</AppButton>
          <AppButton size="sm" color="green" :disabled="isSubmitting" @click="handleSubmit">저장하기</AppButton>
        </div>
      </div>

      <div class="edit-body">

        <!-- ① 매장 이미지 -->
        <div class="edit-card">
          <h2 class="edit-section-title">매장 이미지 <span class="edit-hint">(최대 5장 · 첫 번째가 대표 이미지)</span></h2>
          <div class="restaurant-img-grid">
            <!-- 기존 이미지 -->
            <div
              v-for="(img, i) in form.existingImages"
              :key="`existing-${i}`"
              class="r-img-item"
            >
              <img :src="img" :alt="`매장 이미지 ${i + 1}`" class="r-img-thumb" />
              <span v-if="i === 0" class="r-img-badge">대표</span>
              <button
                v-else
                type="button"
                class="r-img-set-main"
                @click="setAsMainImage('existing', i)"
              >대표 설정</button>
              <button type="button" class="r-img-remove" @click="removeExistingImage(i)" aria-label="이미지 삭제">×</button>
            </div>
            <!-- 새로 추가한 이미지 미리보기 -->
            <div
              v-for="(prev, i) in form.newImagePreviews"
              :key="`new-${i}`"
              class="r-img-item is-new"
            >
              <img :src="prev" alt="새 이미지 미리보기" class="r-img-thumb" />
              <span v-if="form.existingImages.length === 0 && i === 0" class="r-img-badge">대표</span>
              <button
                v-else
                type="button"
                class="r-img-set-main"
                @click="setAsMainImage('new', i)"
              >대표 설정</button>
              <button type="button" class="r-img-remove" @click="removeNewImage(i)" aria-label="이미지 삭제">×</button>
            </div>
            <!-- 추가 버튼 -->
            <button
              v-if="totalImageCount < 5"
              type="button"
              class="r-img-add"
              @click="restaurantImgInputRef?.click()"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M12 8v8M8 12h8"/>
              </svg>
              <span>이미지 추가<br/>({{ totalImageCount }}/5)</span>
            </button>
          </div>
        </div>

        <!-- ② 식당 소개 -->
        <div class="edit-card">
          <h2 class="edit-section-title">식당 소개</h2>
          <textarea
            v-model="form.description"
            placeholder="식당 소개를 입력해주세요."
            rows="5"
            class="edit-textarea"
          ></textarea>
        </div>

        <!-- ③ 영업 정보 -->
        <div class="edit-card">
          <h2 class="edit-section-title">영업 정보</h2>
          <div class="edit-field-row">
            <label class="edit-field-label">연락처</label>
            <input
              v-model="form.phoneNumber"
              placeholder="예: 02-1234-5678"
              class="edit-input"
            />
          </div>

          <div class="edit-field-row">
            <label class="edit-field-label">영업시간</label>
            <!-- 상세 영업시간 위젯 -->
            <div class="opening-hours-form">
              <div class="hours-sub-item">
                <div class="flex-between">
                  <span class="hours-sub-label" style="font-size: 16px;">영업 시간 정보 제공</span>
                  <label class="switch-toggle">
                    <input type="checkbox" v-model="opData.hasOpeningHours" />
                    <span class="switch-slider"></span>
                  </label>
                </div>
              </div>

              <template v-if="opData.hasOpeningHours">
                <div class="hours-sub-item has-divider">
                  <span class="hours-sub-label">시간 입력 방식</span>
                  <div class="preset-group">
                    <button type="button" class="preset-btn" :class="{ 'is-active': opData.scheduleMode === 'uniform' }" @click="opData.scheduleMode = 'uniform'">모든 요일 동일</button>
                    <button type="button" class="preset-btn" :class="{ 'is-active': opData.scheduleMode === 'perDay' }" @click="opData.scheduleMode = 'perDay'">요일마다 다르게</button>
                  </div>
                  <p v-if="opData.scheduleMode === 'perDay'" class="hours-hint">요일별로 영업·휴무·시간을 각각 설정할 수 있어요.</p>
                </div>

                <template v-if="opData.scheduleMode === 'uniform'">
                  <!-- 요일 선택 -->
                  <div class="hours-sub-item has-divider">
                    <span class="hours-sub-label">영업 요일</span>
                    <div class="preset-group">
                      <button type="button" class="preset-btn" :class="{ 'is-active': opData.dayType === 'everyday' }" @click="setDayPreset('everyday')">매일 (월~일)</button>
                      <button type="button" class="preset-btn" :class="{ 'is-active': opData.dayType === 'weekdays' }" @click="setDayPreset('weekdays')">평일 (월~금)</button>
                      <button type="button" class="preset-btn" :class="{ 'is-active': opData.dayType === 'weekends' }" @click="setDayPreset('weekends')">주말 (토~일)</button>
                      <button type="button" class="preset-btn" :class="{ 'is-active': opData.dayType === 'custom' }" @click="setDayPreset('custom')">직접 선택</button>
                    </div>
                    <div class="days-toggle-group" v-if="opData.dayType === 'custom'">
                      <button 
                        v-for="d in WEEKDAYS" 
                        :key="d"
                        type="button"
                        class="day-toggle-btn"
                        :class="{ 'is-active': opData.customDays.includes(d) }"
                        @click="toggleCustomDay(d)"
                      >
                        {{ d }}
                      </button>
                    </div>
                  </div>

                  <!-- 영업 시간 -->
                  <div class="hours-sub-item">
                    <span class="hours-sub-label">영업 시간</span>
                    <div class="time-range-group">
                      <div class="time-picker-wrapper" data-label="시작">
                        <input type="time" v-model="opData.openTime" class="time-picker-input" />
                      </div>
                      <span class="time-separator">~</span>
                      <div class="time-picker-wrapper" data-label="종료">
                        <input type="time" v-model="opData.closeTime" class="time-picker-input" />
                      </div>
                    </div>
                  </div>
                </template>

                <template v-else>
                  <div class="hours-sub-item has-divider">
                    <span class="hours-sub-label">요일별 영업 시간</span>
                    <div class="day-schedule-list">
                      <div
                        v-for="day in WEEKDAYS"
                        :key="day"
                        class="day-schedule-row"
                        :class="{ 'is-closed': opData.daySchedules[day].closed }"
                      >
                        <span class="day-schedule-label">{{ day }}</span>
                        <label class="day-closed-toggle">
                          <input type="checkbox" v-model="opData.daySchedules[day].closed" />
                          <span>휴무</span>
                        </label>
                        <div v-if="!opData.daySchedules[day].closed" class="time-range-group is-compact">
                          <div class="time-picker-wrapper" data-label="시작">
                            <input type="time" v-model="opData.daySchedules[day].openTime" class="time-picker-input" />
                          </div>
                          <span class="time-separator">~</span>
                          <div class="time-picker-wrapper" data-label="종료">
                            <input type="time" v-model="opData.daySchedules[day].closeTime" class="time-picker-input" />
                          </div>
                        </div>
                        <span v-else class="day-closed-text">휴무</span>
                      </div>
                    </div>
                    <div class="day-bulk-actions">
                      <button type="button" class="preset-btn" @click="applyWeekdayBulk">평일에 월요일 시간 적용</button>
                      <button type="button" class="preset-btn" @click="applyWeekendBulk">주말에 토요일 시간 적용</button>
                    </div>
                  </div>
                </template>

                <!-- 브레이크 타임 -->
                <div class="hours-sub-item has-divider">
                  <div class="flex-between">
                    <span class="hours-sub-label">브레이크 타임</span>
                    <label class="switch-toggle">
                      <input type="checkbox" v-model="opData.hasBreakTime" />
                      <span class="switch-slider"></span>
                    </label>
                  </div>
                  <div class="time-range-group" v-if="opData.hasBreakTime">
                    <div class="time-picker-wrapper" data-label="시작">
                      <input type="time" v-model="opData.breakStartTime" class="time-picker-input" />
                    </div>
                    <span class="time-separator">~</span>
                    <div class="time-picker-wrapper" data-label="종료">
                      <input type="time" v-model="opData.breakEndTime" class="time-picker-input" />
                    </div>
                  </div>
                </div>

                <!-- 라스트 오더 -->
                <div class="hours-sub-item">
                  <div class="flex-between">
                    <span class="hours-sub-label">라스트 오더</span>
                    <label class="switch-toggle">
                      <input type="checkbox" v-model="opData.hasLastOrder" />
                      <span class="switch-slider"></span>
                    </label>
                  </div>
                  <div class="time-single-group" v-if="opData.hasLastOrder" data-label="시간">
                    <input type="time" v-model="opData.lastOrderTime" class="time-picker-input" />
                  </div>
                </div>

                <!-- 정기 휴무일 -->
                <div v-if="opData.scheduleMode === 'uniform'" class="hours-sub-item has-divider">
                  <div class="flex-between">
                    <span class="hours-sub-label">정기 휴무일</span>
                    <label class="switch-toggle">
                      <input type="checkbox" v-model="opData.hasClosedDays" />
                      <span class="switch-slider"></span>
                    </label>
                  </div>
                  <div class="closed-days-group" v-if="opData.hasClosedDays">
                    <button 
                      v-for="d in ['월', '화', '수', '목', '금', '토', '일']" 
                      :key="`closed-${d}`"
                      type="button"
                      class="day-toggle-btn is-red"
                      :class="{ 'is-active': opData.closedDays.includes(d) }"
                      @click="toggleClosedDay(d)"
                    >
                      {{ d }}
                    </button>
                  </div>
                </div>
              </template>
            </div>
          </div>

          <!-- 주차 정보 -->
          <div class="edit-field-row">
            <label class="edit-field-label">주차 정보</label>
            <div class="opening-hours-form">
              <div class="hours-sub-item">
                <div class="flex-between">
                  <span class="hours-sub-label" style="font-size: 16px;">주차 정보 제공</span>
                  <label class="switch-toggle">
                    <input type="checkbox" v-model="parkingData.hasParking" />
                    <span class="switch-slider"></span>
                  </label>
                </div>
              </div>

              <template v-if="parkingData.hasParking">
                <!-- 주차 가능 여부 -->
                <div class="hours-sub-item has-divider">
                  <span class="hours-sub-label">주차 가능 여부</span>
                  <div class="preset-group">
                    <button type="button" class="preset-btn" :class="{ 'is-active': parkingData.available === true }" @click="parkingData.available = true">주차 가능</button>
                    <button type="button" class="preset-btn" :class="{ 'is-active': parkingData.available === false }" @click="parkingData.available = false">주차 불가</button>
                  </div>
                </div>

                <template v-if="parkingData.available">
                  <!-- 주차 유형 -->
                  <div class="hours-sub-item">
                    <span class="hours-sub-label">주차 유형</span>
                    <div class="preset-group">
                      <button type="button" class="preset-btn" :class="{ 'is-active': parkingData.type === '자체주차장' }" @click="parkingData.type = '자체주차장'">자체 주차장</button>
                      <button type="button" class="preset-btn" :class="{ 'is-active': parkingData.type === '발렛파킹' }" @click="parkingData.type = '발렛파킹'">발렛 파킹</button>
                      <button type="button" class="preset-btn" :class="{ 'is-active': parkingData.type === '공영주차장' }" @click="parkingData.type = '공영주차장'">공영 주차장</button>
                      <button type="button" class="preset-btn" :class="{ 'is-active': parkingData.type === '건물주차장' }" @click="parkingData.type = '건물주차장'">건물 주차장</button>
                    </div>
                  </div>

                  <!-- 요금 -->
                  <div class="hours-sub-item has-divider">
                    <div class="flex-between">
                      <span class="hours-sub-label">무료 주차</span>
                      <label class="switch-toggle">
                        <input type="checkbox" v-model="parkingData.isFree" />
                        <span class="switch-slider"></span>
                      </label>
                    </div>
                    <div v-if="!parkingData.isFree" class="hours-sub-item" style="margin-top: 10px;">
                      <span class="hours-sub-label">요금 정보</span>
                      <input
                        v-model="parkingData.feeDesc"
                        class="edit-input"
                        style="width:100%; margin-top:6px;"
                        placeholder="예: 1시간 2,000원, 이후 30분당 1,000원"
                      />
                    </div>
                  </div>

                  <!-- 추가 메모 -->
                  <div class="hours-sub-item">
                    <div class="flex-between">
                      <span class="hours-sub-label">추가 메모</span>
                      <label class="switch-toggle">
                        <input type="checkbox" v-model="parkingData.hasMemo" />
                        <span class="switch-slider"></span>
                      </label>
                    </div>
                    <input
                      v-if="parkingData.hasMemo"
                      v-model="parkingData.memo"
                      class="edit-input"
                      style="width:100%; margin-top:10px;"
                      placeholder="예: 식당 입구 옆 주차장 이용"
                    />
                  </div>
                </template>
              </template>
            </div>
          </div>

        </div>

        <!-- ④ 키워드 -->
        <div class="edit-card">
          <h2 class="edit-section-title">키워드</h2>
          <div class="keyword-input-row">
            <AppInput
              v-model="keywordInput"
              placeholder="예: 가성비, 데이트, 주차가능"
              class="keyword-app-input"
              @keydown.enter.prevent="handleKeywordEnter"
              @compositionstart="keywordComposing = true"
              @compositionend="keywordComposing = false"
            />
            <button
              type="button"
              class="keyword-add-btn"
              :disabled="!keywordInput.trim()"
              @click="addKeyword"
            >등록</button>
          </div>
          <div class="tag-list" v-if="form.keywords.length">
            <span v-for="(tag, i) in form.keywords" :key="tag" class="tag">
              #{{ tag }}
              <button type="button" @click="removeKeyword(i)" :aria-label="`${tag} 삭제`">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </span>
          </div>
          <p v-else class="edit-empty-hint">등록된 키워드가 없습니다.</p>
        </div>

        <!-- ⑤ 메뉴 목록 -->
        <div class="edit-card">
          <div class="edit-section-header">
            <h2 class="edit-section-title">메뉴 목록</h2>
            <button type="button" class="menu-add-btn" @click="addMenu">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              메뉴 추가
            </button>
          </div>

          <div class="menu-edit-list">
            <div v-for="(menu, i) in form.menus" :key="menu._key" class="menu-edit-item">
              <div class="menu-edit-row">

                <!-- 추천 토글 -->
                <button
                  type="button"
                  class="recommend-toggle"
                  :class="{ 'is-active': menu.isRecommended }"
                  @click="menu.isRecommended = !menu.isRecommended"
                  :aria-label="menu.isRecommended ? '추천 해제' : '추천 설정'"
                  title="추천 메뉴"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>

                <!-- 메뉴 이미지 -->
                <div class="menu-img-edit" @click="triggerMenuImgInput(i)">
                  <img
                    v-if="menu.imagePreview || menu.image"
                    :src="menu.imagePreview || menu.image"
                    alt="메뉴 이미지"
                    class="menu-img-thumb"
                  />
                  <div v-else class="menu-img-placeholder">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="m21 15-5-5L5 21"/>
                    </svg>
                    <span>이미지 추가</span>
                  </div>
                  <div v-if="menu.imagePreview || menu.image" class="menu-img-overlay"><span>변경</span></div>
                  <button
                    v-if="menu.imagePreview || menu.image"
                    type="button"
                    class="menu-img-remove"
                    @click.stop="removeMenuImage(i)"
                    aria-label="이미지 삭제"
                  >×</button>
                </div>

                <!-- 텍스트 입력 -->
                <div class="menu-edit-fields">
                  <div class="menu-edit-top">
                    <div class="input-with-label">
                      <label class="mobile-menu-label">메뉴</label>
                      <input v-model="menu.name" placeholder="메뉴 이름" class="edit-input menu-name-input" />
                    </div>
                    <div class="input-with-label">
                      <label class="mobile-menu-label">가격</label>
                      <input
                        v-model="menu.priceDisplay"
                        placeholder="가격 (예: 12,000)"
                        class="edit-input menu-price-input"
                        @input="(e) => formatMenuPrice(e, menu)"
                      />
                    </div>
                  </div>
                  <div class="input-with-label">
                    <label class="mobile-menu-label">메뉴 설명 (선택)</label>
                    <input v-model="menu.description" placeholder="메뉴 설명 (선택)" class="edit-input menu-desc-input" />
                  </div>
                </div>

                <button type="button" class="menu-delete-btn" @click="removeMenu(i)" aria-label="메뉴 삭제">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>
            </div>

            <p v-if="!form.menus.length" class="edit-empty-hint">등록된 메뉴가 없습니다. 메뉴를 추가해주세요.</p>
          </div>
        </div>
      </div>

      <!-- 하단 저장 버튼 -->
      <div class="edit-footer">
        <AppButton variant="outline" @click="navigateTo(`/restaurants/${route.params.id}`)">취소</AppButton>
        <AppButton color="green" :disabled="isSubmitting" @click="handleSubmit">저장하기</AppButton>
      </div>
    </div>
  </section>
</template>

<script setup>
import { WEEKDAYS, parseOpeningHours, formatOpeningHours } from '~/utils/openingHours'
import {
  uploadImage,
  getUploadErrorMessage,
} from '~/utils/imageUpload'

const { $api } = useApi()
const route = useRoute()
const { user } = useAuth()

const { data: restaurant, error } = await useAsyncData(
  `restaurant-${route.params.id}`,
  () => $api(`/restaurants/${route.params.id}`)
)

if (error.value) {
  throw createError({ statusCode: error.value.statusCode, message: '식당 정보를 불러올 수 없습니다.' })
}
if (!restaurant.value) {
  throw createError({ statusCode: 404, message: '식당 정보를 찾을 수 없습니다.' })
}

// 본인이 등록한 식당이거나 관리자(ADMIN)인 경우에만 수정 가능
const isOwner = user.value?.id === restaurant.value.registeredById
const isAdmin = user.value?.role === 'ADMIN'

if (!isOwner && !isAdmin) {
  throw createError({ statusCode: 403, message: '접근 권한이 없습니다.' })
}

// ── 폼 초기값 ─────────────────────────────────────────────────────
const form = ref({
  description: restaurant.value.description ?? '',
  phoneNumber: restaurant.value.phoneNumber ?? '',
  openingHours: restaurant.value.openingHours ?? '',
  parkingInfo: restaurant.value.parkingInfo ?? '',
  keywords: [...(restaurant.value.keywords ?? [])],
  // 매장 이미지: images[] 우선, 비어있으면 thumbnail 폴백
  existingImages: (() => {
    const imgs = restaurant.value.images ?? []
    if (imgs.length > 0) return [...imgs]
    // 구형 데이터: thumbnail만 있는 경우
    return restaurant.value.thumbnail ? [restaurant.value.thumbnail] : []
  })(),
  newImageFiles: [],                                      // 새로 선택한 File 객체들
  newImagePreviews: [],                                   // 로컬 미리보기 URL들
  // 메뉴
  menus: (restaurant.value.menus ?? []).map((m) => ({
    _key: m.id,
    id: m.id,
    name: m.name,
    priceDisplay: m.price ? m.price.toLocaleString('ko-KR') : '',
    description: m.description ?? '',
    isRecommended: m.isRecommended,
    image: m.image ?? null,
    imageFile: null,
    imagePreview: null,
    removeImage: false,
  })),
})

// ── 상세 영업시간 데이터 및 헬퍼 ──────────────────────────────────
const opData = ref(parseOpeningHours(restaurant.value.openingHours))

const setDayPreset = (type) => {
  opData.value.dayType = type
  if (type === 'everyday') {
    opData.value.customDays = [...WEEKDAYS]
  } else if (type === 'weekdays') {
    opData.value.customDays = ['월', '화', '수', '목', '금']
  } else if (type === 'weekends') {
    opData.value.customDays = ['토', '일']
  }
}

const toggleCustomDay = (d) => {
  const idx = opData.value.customDays.indexOf(d)
  if (idx > -1) {
    opData.value.customDays.splice(idx, 1)
  } else {
    opData.value.customDays.push(d)
  }
  opData.value.dayType = 'custom'
}

const toggleClosedDay = (d) => {
  const idx = opData.value.closedDays.indexOf(d)
  if (idx > -1) {
    opData.value.closedDays.splice(idx, 1)
  } else {
    opData.value.closedDays.push(d)
  }
}

const applyDaySchedule = (days, source) => {
  days.forEach((day) => {
    opData.value.daySchedules[day] = {
      closed: source.closed,
      openTime: source.openTime,
      closeTime: source.closeTime,
    }
  })
}

const applyWeekdayBulk = () => {
  applyDaySchedule(['월', '화', '수', '목', '금'], opData.value.daySchedules['월'])
}

const applyWeekendBulk = () => {
  applyDaySchedule(['토', '일'], opData.value.daySchedules['토'])
}

const computedOpeningHours = computed(() => formatOpeningHours(opData.value))

watch(computedOpeningHours, (newVal) => {
  form.value.openingHours = newVal
}, { immediate: true })

// ── 주차 정보 데이터 및 헬퍼 ──────────────────────────────────────
const parseParkingInfo = (str) => {
  const data = {
    hasParking: !!str,
    available: true,
    type: '자체주차장',
    isFree: true,
    feeDesc: '',
    hasMemo: false,
    memo: '',
  }
  if (!str) return data
  if (str === '주차 불가') {
    data.available = false
    return data
  }
  const parts = str.split(' · ').map(p => p.trim())
  const types = ['자체주차장', '발렛파킹', '공영주차장', '건물주차장']
  if (parts[0] && types.includes(parts[0])) data.type = parts[0]
  if (parts[1] === '무료') {
    data.isFree = true
  } else if (parts[1]) {
    data.isFree = false
    data.feeDesc = parts[1]
  }
  if (parts[2]) {
    data.hasMemo = true
    data.memo = parts[2]
  }
  return data
}

const parkingData = ref(parseParkingInfo(restaurant.value.parkingInfo))

const computedParkingInfo = computed(() => {
  if (!parkingData.value.hasParking) return ''
  if (!parkingData.value.available) return '주차 불가'
  const parts = [parkingData.value.type]
  parts.push(parkingData.value.isFree ? '무료' : (parkingData.value.feeDesc || '유료'))
  if (parkingData.value.hasMemo && parkingData.value.memo) parts.push(parkingData.value.memo)
  return parts.join(' · ')
})

watch(computedParkingInfo, (newVal) => {
  form.value.parkingInfo = newVal
}, { immediate: true })

const totalImageCount = computed(
  () => form.value.existingImages.length + form.value.newImagePreviews.length
)

const keywordInput = ref('')
const keywordComposing = ref(false)
const isSubmitting = ref(false)
const restaurantImgInputRef = ref(null)
const menuImgInputRef = ref(null)
let _menuKey = Date.now()
let _currentMenuImgIndex = -1

// ── 매장 이미지 ───────────────────────────────────────────────────
const handleRestaurantImages = (e) => {
  const files = Array.from(e.target.files ?? [])
  const remaining = 5 - totalImageCount.value
  files.slice(0, remaining).forEach((file) => {
    form.value.newImageFiles.push(file)
    const reader = new FileReader()
    reader.onload = (ev) => form.value.newImagePreviews.push(ev.target.result)
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

const removeExistingImage = (i) => form.value.existingImages.splice(i, 1)
const removeNewImage = (i) => {
  form.value.newImageFiles.splice(i, 1)
  form.value.newImagePreviews.splice(i, 1)
}

const setAsMainImage = (type, index) => {
  if (type === 'existing') {
    const item = form.value.existingImages.splice(index, 1)[0]
    form.value.existingImages.unshift(item)
  } else {
    const file = form.value.newImageFiles.splice(index, 1)[0]
    const preview = form.value.newImagePreviews.splice(index, 1)[0]
    form.value.newImageFiles.unshift(file)
    form.value.newImagePreviews.unshift(preview)
  }
}

// ── 키워드 ────────────────────────────────────────────────────────
const addKeyword = () => {
  const tag = keywordInput.value.trim().replace(/^#/, '')
  if (!tag || form.value.keywords.includes(tag)) return
  form.value.keywords.push(tag)
  keywordInput.value = ''
}

const handleKeywordEnter = () => {
  // 한글 IME 조합 중 Enter는 무시 (조합 완료 후 실행)
  if (keywordComposing.value) return
  addKeyword()
}
const removeKeyword = (i) => form.value.keywords.splice(i, 1)

// ── 메뉴 ──────────────────────────────────────────────────────────
const addMenu = () => {
  form.value.menus.push({
    _key: ++_menuKey,
    id: null, name: '', priceDisplay: '', description: '',
    isRecommended: false, image: null, imageFile: null, imagePreview: null, removeImage: false,
  })
}
const removeMenu = (i) => form.value.menus.splice(i, 1)

const formatMenuPrice = (e, menu) => {
  const raw = e.target.value.replace(/[^0-9]/g, '')
  menu.priceDisplay = raw ? Number(raw).toLocaleString('ko-KR') : ''
}

// ── 메뉴 이미지 ───────────────────────────────────────────────────
const triggerMenuImgInput = (index) => {
  _currentMenuImgIndex = index
  menuImgInputRef.value.value = ''
  menuImgInputRef.value.click()
}

const handleMenuImageUpload = (e) => {
  const file = e.target.files?.[0]
  if (!file || _currentMenuImgIndex === -1) return
  const menu = form.value.menus[_currentMenuImgIndex]
  menu.imageFile = file
  menu.removeImage = false
  const reader = new FileReader()
  reader.onload = (ev) => { menu.imagePreview = ev.target.result }
  reader.readAsDataURL(file)
  _currentMenuImgIndex = -1
}

const removeMenuImage = (i) => {
  const menu = form.value.menus[i]
  menu.imageFile = null
  menu.imagePreview = null
  menu.removeImage = true
  menu.image = null
}

// ── 저장 ──────────────────────────────────────────────────────────
const handleSubmit = async () => {
  if (isSubmitting.value) return
  if (form.value.menus.some((m) => !m.name.trim())) {
    alert('메뉴 이름이 비어있는 항목이 있습니다.')
    return
  }

  isSubmitting.value = true
  try {
    // ── 1. 신규 매장 이미지 순차 업로드 ─────────────────────────────
    const newRestaurantImageUrls = []
    const totalNew = form.value.newImageFiles.length
    for (let i = 0; i < totalNew; i++) {
      const url = await uploadImage(form.value.newImageFiles[i], 'restaurants', $api)
      newRestaurantImageUrls.push(url)
    }

    // ── 2. 신규 메뉴 이미지 순차 업로드 ─────────────────────────────
    const menuImageUrls = {}
    for (let i = 0; i < form.value.menus.length; i++) {
      const menu = form.value.menus[i]
      if (!menu.imageFile) continue
      const url = await uploadImage(menu.imageFile, 'menus', $api)
      menuImageUrls[i] = url
    }

    // ── 3. 최종 수정 요청 (URL만 전송) ──────────────────────────────
    const fd = new FormData()
    fd.append('description', form.value.description)
    fd.append('phoneNumber', form.value.phoneNumber)
    fd.append('openingHours', form.value.openingHours)
    fd.append('parkingInfo', form.value.parkingInfo)
    fd.append('keywords', JSON.stringify(form.value.keywords))

    fd.append('existingImages', JSON.stringify(form.value.existingImages))
    fd.append('newRestaurantImageUrls', JSON.stringify(newRestaurantImageUrls))

    const menusPayload = form.value.menus.map((m, idx) => ({
      id: m.id ?? undefined,
      name: m.name,
      price: m.priceDisplay ? m.priceDisplay.replace(/,/g, '') : null,
      description: m.description,
      isRecommended: m.isRecommended,
      existingImage: m.removeImage ? null : (m.image ?? null),
      imageIndex: idx,
    }))
    fd.append('menus', JSON.stringify(menusPayload))

    Object.entries(menuImageUrls).forEach(([index, url]) => {
      fd.append(`menuImageUrl_${index}`, url)
    })

    await $api(`/restaurants/${route.params.id}`, { method: 'PUT', body: fd })
    navigateTo(`/restaurants/${route.params.id}`)
  } catch (error) {
    alert(getUploadErrorMessage(error, '저장 중 오류가 발생했습니다.'))
  } finally {
    isSubmitting.value = false
  }
}
</script>
