<template>
  <section class="register">
    <AppLoading :loading="isSubmitting" :message="submissionMessage" />

    <!-- 등록 성공 모달 -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showSuccessModal" class="register-success-overlay" @click.self="null">
          <div class="register-success-modal">
            <div class="register-success-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12l3 3 5-5"/>
              </svg>
            </div>
            <h2 class="register-success-title">등록 완료!</h2>
            <p class="register-success-desc">
              <strong>{{ registeredRestaurantName }}</strong>이(가)<br>성공적으로 등록되었습니다.
            </p>
            <div class="register-success-actions">
              <button class="register-success-btn register-success-btn--outline" @click="handleRegisterMore">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                잘하는 집을 더 입력하기
              </button>
              <button class="register-success-btn register-success-btn--primary" @click="handleGoToRestaurant">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                보러가기
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="inner">
      <div class="content-wrap">
        <div class="title-bx">
          <AppTitle
            badge="New Place"
            title="잘하는 집을 알려주세요"
            desc="내가 아는 잘하는 집을 추천해 주세요"
          />
        </div>

        <div class="form-wrap">
          <form @submit.prevent="handleSubmit" @keydown.enter.prevent>
            <div class="form-container">
              <!-- 정보 입력 영역 -->
              <div class="form-fields">
                <div 
                  class="form-item search-container"
                  @focusin="isSearchFocused = true"
                  @focusout="handleSearchBlur"
                >
                  <label for="name" class="form-item-label">식당 이름</label>
                  <AppInput 
                    ref="nameInputRef"
                    v-model="form.name"
                    id="name"
                    name="name"
                    placeholder="식당 이름을 입력하면 추천 목록이 나옵니다"
                    required
                    autocomplete="off"
                    role="combobox"
                    aria-autocomplete="list"
                    :aria-expanded="isSearchFocused && searchResults.length > 0"
                    aria-haspopup="listbox"
                    aria-controls="search-results-list"
                    @input="handleNameInput"
                    @keydown="handleKeydown"
                  />
                  
                  <!-- 검색 추천 결과 목록 (웹 접근성 강화) -->
                  <ul 
                    v-if="isSearchFocused && searchResults.length > 0" 
                    id="search-results-list"
                    class="search-results"
                    role="listbox"
                    aria-label="식당 검색 결과"
                  >
                    <li 
                      v-for="(place, index) in searchResults" 
                      :key="place.id"
                      role="none"
                    >
                      <button
                        type="button"
                        class="result-item"
                        :class="{ 'is-focused': focusedIndex === index }"
                        role="option"
                        :aria-selected="focusedIndex === index"
                        @click="selectPlace(place)"
                        @mouseenter="focusedIndex = index"
                        @focus="focusedIndex = index"
                        @keydown.enter.stop="selectPlace(place)"
                      >
                        <span class="place-name">{{ place.place_name }}</span>
                        <span class="place-address">{{ place.road_address_name || place.address_name }}</span>
                        <span class="place-category" v-if="place.category_name">{{ place.category_name.split(' > ').pop() }}</span>
                      </button>
                    </li>
                  </ul>
                </div>

                <div class="form-item">
                  <label for="address" class="form-item-label">주소</label>
                  <AppInput 
                    v-model="form.address"
                    id="address"
                    name="address"
                    placeholder="식당 주소를 입력하면 자동으로 입력됩니다."
                    required
                    readonly
                    autocomplete="street-address"
                    tabindex="-1"
                  />
                </div>

                <div class="form-item">
                  <label for="phoneNumber" class="form-item-label">전화번호</label>
                  <AppInput 
                    v-model="form.phoneNumber"
                    id="phoneNumber"
                    name="phoneNumber"
                    placeholder="자동으로 입력되거나 직접 수정 가능합니다"
                    autocomplete="tel"
                  />
                </div>

                <div class="form-item">
                  <label class="form-item-label" id="category-label">카테고리</label>
                  <div class="category-group" role="group" aria-labelledby="category-label">
                    <button 
                      v-for="cat in categories" 
                      :key="cat"
                      type="button"
                      class="category-btn"
                      :class="{ 'is-active': form.category === cat }"
                      :aria-pressed="form.category === cat"
                      @click="form.category = cat"
                    >
                      {{ cat }}
                    </button>
                  </div>
                </div>

                <div class="form-item">
                  <label for="description" class="form-item-label">식당 소개</label>
                  <textarea 
                    v-model="form.description"
                    id="description"
                    name="description"
                    class="form-textarea"
                    placeholder="식당의 특징이나 분위기 등을 자유롭게 적어주세요"
                    rows="3"
                  ></textarea>
                </div>

                <div class="form-item">
                  <label for="keywords" class="form-item-label">키워드</label>
                  <div class="keyword-input-wrap">
                    <div class="keyword-input-row">
                      <AppInput
                        v-model="keywordInput"
                        id="keywords"
                        name="keywords"
                        placeholder="예: 가성비, 데이트, 주차가능"
                        @keydown="handleKeywordKeydown"
                      />
                      <button
                        type="button"
                        class="keyword-add-btn"
                        :disabled="!keywordInput.trim()"
                        @click="addCustomKeyword()"
                      >등록</button>
                    </div>
                    <div class="tag-list">
                      <span v-for="(tag, index) in form.keywords" :key="tag" class="tag">
                        #{{ tag }}
                        <button 
                          type="button" 
                          @click="removeKeyword(index)" 
                          :aria-label="`${tag} 키워드 삭제`"
                        >
                          <img src="/assets/images/icon/ic_close.svg" width="12" height="12" alt="삭제" />
                        </button>
                      </span>
                    </div>
                  </div>
                </div>

                <div class="form-item">
                  <label class="form-item-label">영업 정보</label>
                  <a
                    v-if="form.placeId"
                    :href="`https://place.map.kakao.com/${form.placeId}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="kakao-place-link"
                    style="margin-bottom: 8px; display: inline-flex;"
                  >
                    카카오맵에서 영업시간 확인하기
                    <img src="/assets/images/icon/ic_external.svg" width="14" height="14" alt="" aria-hidden="true" />
                  </a>
                  <p v-else class="kakao-place-empty" style="margin-bottom: 8px;">식당을 검색해서 선택하면 카카오맵 링크가 연결됩니다</p>

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
                            v-for="d in ['월', '화', '수', '목', '금', '토', '일']" 
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
                      <div class="hours-sub-item has-divider">
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

                <div class="form-item">
                  <label for="restaurant-images" class="form-item-label">매장 이미지 (최대 5장)</label>
                  <input
                    ref="fileInputRef"
                    type="file"
                    id="restaurant-images"
                    name="restaurant-images"
                    accept="image/*"
                    multiple
                    class="sr-only"
                    @change="handleFileUpload"
                  />
                  <div class="image-upload-wrap">
                    <button
                      type="button"
                      class="drop-zone"
                      :aria-label="'매장 이미지 업로드'"
                      :class="{ 'is-dragover': isDragOver }"
                      @dragover.prevent="isDragOver = true"
                      @dragleave.prevent="isDragOver = false"
                      @drop.prevent="handleDrop"
                      @click="triggerFileInput"
                      v-if="restaurantPreviews.length < 5"
                    >
                      <span class="drop-zone-content">
                        <img src="/assets/images/icon/ic_upload.svg" width="36" height="36" alt="" class="drop-zone-icon" aria-hidden="true" />
                        <span class="drop-zone-text">이미지 추가 ({{ restaurantPreviews.length }}/5)</span>
                        <span class="drop-zone-sub">여러 장 선택 가능</span>
                      </span>
                    </button>
                    
                    <div v-if="restaurantPreviews.length > 0" class="preview-gallery">
                      <div v-for="(src, index) in restaurantPreviews" :key="index" class="preview-item">
                        <img :src="src" alt="매장 이미지 미리보기" />
                        <span class="preview-remove" role="button" @click.stop="removeRestaurantImage(index)" aria-label="이미지 삭제">
                          <img src="/assets/images/icon/ic_close.svg" width="14" height="14" alt="삭제" />
                        </span>
                        <span v-if="index === 0" class="main-badge">대표</span>
                        <button
                          v-else
                          type="button"
                          class="set-main-btn"
                          @click.stop="setAsMainImage(index)"
                        >대표 설정</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="form-item">
                  <label for="menu-board-upload" class="form-item-label">
                    메뉴판 분석
                    <span class="badge-ai">AI</span>
                  </label>
                  <input
                    ref="menuBoardInputRef"
                    type="file"
                    id="menu-board-upload"
                    name="menu-board-upload"
                    accept="image/*"
                    multiple
                    class="sr-only"
                    @change="handleMenuBoardUpload"
                  />
                  <div class="image-upload-wrap">
                    <button
                      type="button"
                      class="drop-zone"
                      :aria-label="'메뉴판 이미지 업로드'"
                      :class="{ 'is-dragover': isDragOverMenu }"
                      @dragover.prevent="isDragOverMenu = true"
                      @dragleave.prevent="isDragOverMenu = false"
                      @drop.prevent="handleMenuBoardDrop"
                      @click="triggerMenuBoardInput"
                    >
                      <span class="drop-zone-content">
                        <img src="/assets/images/icon/ic_menu_board.svg" width="36" height="36" alt="" class="drop-zone-icon" aria-hidden="true" />
                        <span class="drop-zone-text">메뉴판 이미지를 올려주세요</span>
                        <span class="drop-zone-sub">여러 장의 메뉴판 이미지를 분석할 수 있습니다</span>
                      </span>
                    </button>
                    
                    <div v-if="menuBoardPreviews.length > 0" class="preview-gallery">
                      <div v-for="(src, index) in menuBoardPreviews" :key="index" class="preview-item">
                        <img :src="src" alt="메뉴판 이미지 미리보기" />
                        <span class="preview-remove" role="button" @click.stop="removeMenuBoardImage(index)" aria-label="이미지 삭제">
                          <img src="/assets/images/icon/ic_close.svg" width="14" height="14" alt="삭제" />
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    v-if="menuBoardPreviews.length > 0 && !isAnalyzing"
                    type="button"
                    class="analyze-btn"
                    @click="analyzeMenuBoard"
                  >
                    메뉴 분석하기
                  </button>

                  <div v-if="isAnalyzing" class="analyzing-state" role="status">
                    <span class="analyzing-spinner"></span>
                    <span>AI가 메뉴판을 분석하고 있습니다...</span>
                  </div>

                  <div class="menu-items-result">
                    <div class="menu-items-header" v-if="analyzedMenuItems.length > 0">
                      <p class="menu-items-count" aria-live="polite">
                        <img src="/assets/images/icon/ic_count.svg" width="16" height="16" alt="" aria-hidden="true" />
                        {{ analyzedMenuItems.length }}개 메뉴가 분석 되었습니다
                      </p>
                      <p class="menu-recommend-hint">
                        <img src="/assets/images/icon/ic_star.svg" width="14" height="14" alt="" aria-hidden="true" />
                        눌러서 추천 메뉴 설정
                      </p>
                    </div>
                    <div class="menu-item-list" role="list">
                      <div
                        v-for="(item, index) in analyzedMenuItems"
                        :key="index"
                        class="menu-item-card"
                        :class="{ 'is-recommended': item.isRecommended }"
                        role="listitem"
                      >
                        <button 
                          type="button"
                          class="menu-item-image-box"
                          :aria-label="`${index + 1}번째 메뉴 이미지 업로드`"
                          :class="{ 'has-image': item.imagePreview }"
                          @click="triggerMenuItemImageInput(index)"
                        >
                          <img 
                            :src="item.imagePreview || '/assets/images/common/default.jpg'" 
                            :alt="`${item.name || (index + 1) + '번째 메뉴'} 이미지`"
                            @error="(e) => e.target.src = '/assets/images/common/default.jpg'"
                          />
                          <span 
                            v-if="item.imagePreview" 
                            role="button"
                            class="menu-item-image-remove"
                            aria-label="메뉴 이미지 삭제"
                            @click.stop="removeMenuItemImage(index)"
                          >
                            <img src="/assets/images/icon/ic_close.svg" width="12" height="12" alt="삭제" />
                          </span>
                        </button>
                        <div class="menu-item-info">
                          <input 
                            v-model="item.name" 
                            :id="`menu-name-${index}`"
                            :name="`menu-name-${index}`"
                            class="menu-item-input menu-item-name" 
                            :aria-label="`${index + 1}번째 메뉴 이름`"
                            placeholder="메뉴명" 
                            autocomplete="off"
                          />
                          <input 
                            :value="item.price" 
                            :id="`menu-price-${index}`"
                            :name="`menu-price-${index}`"
                            class="menu-item-input menu-item-price" 
                            :aria-label="`${index + 1}번째 메뉴 가격`"
                            placeholder="가격 (예: 12,000)" 
                            @input="e => handlePriceInput(e, item)"
                            autocomplete="off"
                          />
                          <input 
                            v-model="item.description" 
                            :id="`menu-desc-${index}`"
                            :name="`menu-desc-${index}`"
                            class="menu-item-input menu-item-desc" 
                            :aria-label="`${index + 1}번째 메뉴 설명`"
                            placeholder="설명 (선택)" 
                            autocomplete="off"
                          />
                        </div>
                        <div class="menu-item-actions">
                          <button
                            type="button"
                            class="menu-star-btn"
                            :class="{ 'is-active': item.isRecommended }"
                            :aria-pressed="item.isRecommended"
                            :title="item.isRecommended ? '추천 해제' : '추천 메뉴로 설정'"
                            @click="item.isRecommended = !item.isRecommended"
                          >
                            <img 
                              :src="item.isRecommended ? '/assets/images/icon/ic_star.svg' : '/assets/images/icon/ic_star_off.svg'" 
                              width="16" height="16" alt="추천" 
                            />
                          </button>
                          <button type="button" class="menu-item-remove" :aria-label="`${index + 1}번째 메뉴 삭제`" @click="analyzedMenuItems.splice(index, 1)">
                            <img src="/assets/images/icon/ic_close.svg" width="16" height="16" alt="삭제" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <input
                      ref="menuItemImageInputRef"
                      type="file"
                      id="menu-item-image-upload"
                      name="menu-item-image-upload"
                      accept="image/*"
                      class="sr-only"
                      @change="handleMenuItemImageUpload"
                    />

                    <button
                      type="button"
                      class="menu-item-add"
                      @click="analyzedMenuItems.push({ name: '', price: '', description: '', isRecommended: false, imageFile: null, imagePreview: null })"
                    >
                      + 메뉴 직접 추가
                    </button>
                  </div>
                </div>
              </div>

              <!-- 지도 영역 -->
              <div class="form-map">
                <p class="form-item-label">지도 미리보기</p>
                <AppMap ref="mapRef" :lat="mapInitialLat" :lng="mapInitialLng" :draggable="true" />
              </div>
            </div>

            <div class="btn-bx-bottom">
              <AppButton type="submit" color="green" size="md">등록하기</AppButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import imageCompression from 'browser-image-compression'

const { $api } = useApi()
const { loadSDK } = useKakaoMap()

const categories = [
  '한식', '중식', '일식', '양식', '카페', '주점', '분식', '아시아음식'
]

const form = ref({
  name: '',
  description: '',
  category: '',
  address: '',
  phoneNumber: '',
  lat: null,
  lng: null,
  placeId: '',
  openingHours: '',
  keywords: []
})

// ── 상세 영업시간 데이터 및 헬퍼 ──────────────────────────────────
const opData = ref({
  dayType: 'everyday',
  customDays: ['월', '화', '수', '목', '금', '토', '일'],
  openTime: '11:30',
  closeTime: '21:30',
  hasBreakTime: true,
  breakStartTime: '14:00',
  breakEndTime: '17:00',
  hasLastOrder: true,
  lastOrderTime: '20:00',
  hasClosedDays: false,
  closedDays: []
})

const setDayPreset = (type) => {
  opData.value.dayType = type
  if (type === 'everyday') {
    opData.value.customDays = ['월', '화', '수', '목', '금', '토', '일']
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

const computedOpeningHours = computed(() => {
  if (!opData.value.hasOpeningHours) return ''
  
  let daysStr = ''
  if (opData.value.dayType === 'everyday') {
    daysStr = '월 ~ 일'
  } else if (opData.value.dayType === 'weekdays') {
    daysStr = '월 ~ 금'
  } else if (opData.value.dayType === 'weekends') {
    daysStr = '토 ~ 일'
  } else {
    const allDays = ['월', '화', '수', '목', '금', '토', '일']
    const selected = allDays.filter(d => opData.value.customDays.includes(d))
    if (selected.length === 0) {
      daysStr = '요일 선택 없음'
    } else if (selected.length === 7) {
      daysStr = '월 ~ 일'
    } else if (selected.length === 5 && selected.every(d => ['월', '화', '수', '목', '금'].includes(d))) {
      daysStr = '월 ~ 금'
    } else if (selected.length === 2 && selected.every(d => ['토', '일'].includes(d))) {
      daysStr = '토 ~ 일'
    } else {
      daysStr = selected.join(', ')
    }
  }

  let result = `${daysStr} : ${opData.value.openTime} ~ ${opData.value.closeTime}`
  
  if (opData.value.hasBreakTime) {
    result += `\n브레이크 타임 : ${opData.value.breakStartTime} ~ ${opData.value.breakEndTime}`
  }
  
  if (opData.value.hasLastOrder) {
    result += `\n라스트 오더 : ${opData.value.lastOrderTime}`
  }
  
  if (opData.value.hasClosedDays && opData.value.closedDays.length > 0) {
    const allDays = ['월', '화', '수', '목', '금', '토', '일']
    const selectedClosed = allDays.filter(d => opData.value.closedDays.includes(d))
    result += `\n휴무일 : 매주 ${selectedClosed.join(', ')}요일`
  }
  
  return result
})

watch(computedOpeningHours, (newVal) => {
  form.value.openingHours = newVal
}, { immediate: true })

const searchResults = ref([])
const focusedIndex = ref(-1)
const isSearchFocused = ref(false)
const mapRef = ref(null)
const keywordInput = ref('')

const analyzedMenuItems = ref([])
const isDirty = ref(false)
const restaurantImages = ref([])
const restaurantPreviews = ref([])
const fileInputRef = ref(null)
const isDragOver = ref(false)

const menuBoardFiles = ref([])
const menuBoardPreviews = ref([])
const menuBoardInputRef = ref(null)
const isDragOverMenu = ref(false)
const isAnalyzing = ref(false)

const menuItemImageInputRef = ref(null)
const currentEditingMenuIndex = ref(-1)
const isSubmitting = ref(false)
const submissionMessage = ref('맛집을 등록하고 있습니다...')
const showSuccessModal = ref(false)
const registeredRestaurantId = ref(null)
const registeredRestaurantName = ref('')

const STORAGE_KEY = 'restaurant_registration_draft'

// 데이터 변경 감지 및 자동 저장
watch([form, analyzedMenuItems], () => {
  isDirty.value = true
  saveDraft()
}, { deep: true })

const saveDraft = () => {
  const draft = {
    form: form.value,
    menuItems: analyzedMenuItems.value.map(item => ({
      name: item.name,
      price: item.price,
      description: item.description,
      isRecommended: item.isRecommended
    }))
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
}
// 초안 불러오기
const loadDraft = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return

  try {
    const draft = JSON.parse(saved)
    // 의미 있는 데이터가 있는지 확인 (기본값만 있는 경우는 제외)
    const hasContent = 
      draft.form?.name?.trim() || 
      draft.form?.address?.trim() || 
      draft.form?.phoneNumber?.trim() || 
      draft.form?.description?.trim() || 
      (draft.form?.keywords && draft.form?.keywords.length > 0) ||
      (draft.menuItems && draft.menuItems.length > 0)

    if (!hasContent) {
      localStorage.removeItem(STORAGE_KEY)
      return
    }

    if (confirm('작성 중이던 내용이 있습니다. 불러올까요?')) {
      form.value = { ...form.value, ...draft.form }
      analyzedMenuItems.value = (draft.menuItems || []).map(item => ({
        ...item,
        imageFile: null,
        imagePreview: null
      }))
      isDirty.value = true
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (e) {
    console.error('Draft load error:', e)
    localStorage.removeItem(STORAGE_KEY)
  }
}

const handleBeforeUnload = (e) => {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
// 앱 내부 경로 이동 이탈 방지
onBeforeRouteLeave((to, from, next) => {
  // 실제 데이터가 있는지 확인
  const hasContent = 
    form.value.name?.trim() || 
    form.value.address?.trim() || 
    form.value.phoneNumber?.trim() || 
    form.value.description?.trim() || 
    (form.value.keywords && form.value.keywords.length > 0) ||
    (analyzedMenuItems.value && analyzedMenuItems.value.length > 0)

  if (isDirty.value && hasContent) {
    if (confirm('작성 중인 내용이 사라집니다. 정말 나가시겠습니까?')) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  setTimeout(() => {
    loadDraft()
    isDirty.value = false
  }, 100)

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        
        mapInitialLat.value = lat
        mapInitialLng.value = lng
        
        if (mapRef.value) {
          mapRef.value.setCenter(lat, lng)
        }
        
        if (window.kakao && window.kakao.maps) {
          userLocation.value = new window.kakao.maps.LatLng(lat, lng)
        }
      },
      (error) => {
        console.warn('위치 정보를 가져올 수 없습니다.', error)
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    )
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

const handleSearchBlur = (e) => {
  if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
    isSearchFocused.value = false
  }
}

const mapInitialLat = ref(37.566826)
const mapInitialLng = ref(126.9786567)
const userLocation = ref(null)

let searchTimeout = null
const handleNameInput = (e) => {
  const value = e.target.value
  form.value.name = value
  isSearchFocused.value = true

  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (!value.trim()) {
    searchResults.value = []
    focusedIndex.value = -1
    return
  }

  searchTimeout = setTimeout(() => {
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.services) return

    const ps = new window.kakao.maps.services.Places()
    const options = userLocation.value ? { location: userLocation.value } : {}
    
    ps.keywordSearch(value, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        searchResults.value = data
        focusedIndex.value = -1
      } else {
        searchResults.value = []
      }
    }, options)
  }, 400)
}

const handleKeydown = (e) => {
  if (searchResults.value.length === 0) return
  if (e.isComposing) return

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      focusedIndex.value = (focusedIndex.value + 1) % searchResults.value.length
      break
    case 'ArrowUp':
      e.preventDefault()
      focusedIndex.value = (focusedIndex.value - 1 + searchResults.value.length) % searchResults.value.length
      break
    case 'Enter':
      e.preventDefault()
      if (searchResults.value.length > 0) {
        const targetIndex = focusedIndex.value >= 0 ? focusedIndex.value : 0
        selectPlace(searchResults.value[targetIndex])
      }
      break
    case 'Escape':
      searchResults.value = []
      focusedIndex.value = -1
      isSearchFocused.value = false
      break
  }
}

const selectPlace = (place) => {
  if (searchTimeout) clearTimeout(searchTimeout)

  form.value.name = place.place_name
  form.value.address = place.road_address_name || place.address_name
  form.value.phoneNumber = place.phone
  form.value.category = place.category_name?.split(' > ').pop() || ''
  form.value.lat = place.y
  form.value.lng = place.x
  form.value.placeId = place.id
  
  form.value.openingHours = '' 

  if (mapRef.value) {
    mapRef.value.setCenter(place.y, place.x)
  }
  
  searchResults.value = [] 
  focusedIndex.value = -1
  isSearchFocused.value = false
}

const toggleKeyword = (keyword) => {
  const index = form.value.keywords.indexOf(keyword)
  if (index > -1) {
    form.value.keywords.splice(index, 1)
  } else {
    form.value.keywords.push(keyword)
  }
}

const addCustomKeyword = () => {
  const tag = keywordInput.value.trim().replace(/^#/, '')
  if (tag && !form.value.keywords.includes(tag)) {
    form.value.keywords.push(tag)
    keywordInput.value = ''
  }
}

const handleKeywordKeydown = (e) => {
  if (e.key !== 'Enter') return
  e.preventDefault()
  if (e.isComposing) return
  addCustomKeyword()
}

const removeKeyword = (index) => {
  form.value.keywords.splice(index, 1)
}

const triggerFileInput = () => fileInputRef.value?.click()

const processImageFiles = (files) => {
  if (!files || files.length === 0) return
  
  const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
  
  newFiles.forEach(file => {
    restaurantImages.value.push(file)
    const reader = new FileReader()
    reader.onload = (e) => { 
      restaurantPreviews.value.push(e.target.result) 
    }
    reader.readAsDataURL(file)
  })
}

const handleFileUpload = (e) => processImageFiles(e.target.files)

const handleDrop = (e) => {
  isDragOver.value = false
  processImageFiles(e.dataTransfer.files)
}

const removeRestaurantImage = (index) => {
  restaurantImages.value.splice(index, 1)
  restaurantPreviews.value.splice(index, 1)
}

const setAsMainImage = (index) => {
  const file = restaurantImages.value.splice(index, 1)[0]
  const preview = restaurantPreviews.value.splice(index, 1)[0]
  restaurantImages.value.unshift(file)
  restaurantPreviews.value.unshift(preview)
}

const triggerMenuBoardInput = () => menuBoardInputRef.value?.click()

const processMenuBoardFiles = (files) => {
  if (!files || files.length === 0) return
  
  const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'))
  
  newFiles.forEach(file => {
    menuBoardFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = (e) => { 
      menuBoardPreviews.value.push(e.target.result) 
    }
    reader.readAsDataURL(file)
  })
  analyzedMenuItems.value = []
}

const handleMenuBoardUpload = (e) => processMenuBoardFiles(e.target.files)

const handleMenuBoardDrop = (e) => {
  isDragOverMenu.value = false
  processMenuBoardFiles(e.dataTransfer.files)
}

const removeMenuBoardImage = (index) => {
  menuBoardFiles.value.splice(index, 1)
  menuBoardPreviews.value.splice(index, 1)
  if (menuBoardFiles.value.length === 0) {
    analyzedMenuItems.value = []
    if (menuBoardInputRef.value) menuBoardInputRef.value.value = ''
  }
}

const analyzeMenuBoard = async () => {
  if (menuBoardFiles.value.length === 0) return
  isAnalyzing.value = true
  try {
    const data = new FormData()
    menuBoardFiles.value.forEach(file => {
      data.append('menuBoard', file)
    })
    const result = await $api('/menu/analyze', { method: 'POST', body: data })
    analyzedMenuItems.value = (result.menuItems || []).map(item => ({
      ...item,
      price: item.price ? Number(item.price.replace(/[^0-9]/g, '')).toLocaleString() : '',
      isRecommended: false,
      imageFile: null,
      imagePreview: null
    }))
  } catch (e) {
    alert(e.data?.statusMessage || '메뉴 분석 중 오류가 발생했습니다.')
  } finally {
    isAnalyzing.value = false
  }
}

const triggerMenuItemImageInput = (index) => {
  currentEditingMenuIndex.value = index
  menuItemImageInputRef.value?.click()
}

const handleMenuItemImageUpload = (e) => {
  const file = e.target.files[0]
  if (!file || !file.type.startsWith('image/') || currentEditingMenuIndex.value === -1) return
  
  const index = currentEditingMenuIndex.value
  analyzedMenuItems.value[index].imageFile = file
  
  const reader = new FileReader()
  reader.onload = (ev) => {
    analyzedMenuItems.value[index].imagePreview = ev.target.result
  }
  reader.readAsDataURL(file)
  
  e.target.value = ''
  currentEditingMenuIndex.value = -1
}

const removeMenuItemImage = (index) => {
  analyzedMenuItems.value[index].imageFile = null
  analyzedMenuItems.value[index].imagePreview = null
}

const handlePriceInput = (e, item) => {
  let value = e.target.value.replace(/[^0-9]/g, '')
  if (value) {
    item.price = Number(value).toLocaleString()
  } else {
    item.price = ''
  }
}

// 폼 초기화 함수
const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    category: '',
    address: '',
    phoneNumber: '',
    lat: null,
    lng: null,
    placeId: '',
    openingHours: '',
    keywords: []
  }
  opData.value = {
    hasOpeningHours: true,
    dayType: 'everyday',
    customDays: ['월', '화', '수', '목', '금', '토', '일'],
    openTime: '11:30',
    closeTime: '21:30',
    hasBreakTime: false,
    breakStartTime: '14:00',
    breakEndTime: '17:00',
    hasLastOrder: false,
    lastOrderTime: '20:00',
    hasClosedDays: false,
    closedDays: []
  }
  analyzedMenuItems.value = []
  restaurantImages.value = []
  restaurantPreviews.value = []
  menuBoardFiles.value = []
  menuBoardPreviews.value = []
  keywordInput.value = ''
  searchResults.value = []
  isDirty.value = false
  if (fileInputRef.value) fileInputRef.value.value = ''
  if (menuBoardInputRef.value) menuBoardInputRef.value.value = ''
}

const handleSubmit = async () => {
  if (!form.value.name.trim()) {
    alert('식당 이름을 입력하고 검색 결과에서 선택해주세요.')
    return
  }

  if (analyzedMenuItems.value.length === 0) {
    alert('최소 하나 이상의 메뉴를 등록해야 합니다.')
    return
  }

  isSubmitting.value = true
  submissionMessage.value = '이미지를 최적화하고 있습니다...'

  try {
    const compressionOptions = {
      maxSizeMB: 0.8,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
    }

    const formData = new FormData()
    
    // 1. 기본 정보 추가
    Object.keys(form.value).forEach((key) => {
      if (key === 'keywords') {
        formData.append(key, JSON.stringify(form.value[key]))
      } else {
        formData.append(key, form.value[key])
      }
    })

    // 2. 식당 이미지 압축 및 추가
    if (restaurantImages.value.length > 0) {
      submissionMessage.value = `매장 이미지를 최적화 중입니다... (0/${restaurantImages.value.length})`
      for (let i = 0; i < restaurantImages.value.length; i++) {
        const file = restaurantImages.value[i]
        try {
          const compressedFile = await imageCompression(file, compressionOptions)
          formData.append('restaurantImages', compressedFile)
        } catch (e) {
          console.error('Restaurant image compression error:', e)
          formData.append('restaurantImages', file) // 실패 시 원본 전송
        }
        submissionMessage.value = `매장 이미지를 최적화 중입니다... (${i + 1}/${restaurantImages.value.length})`
      }
    }

    // 3. 메뉴 아이템 압축 및 추가
    if (analyzedMenuItems.value.length > 0) {
      const menusWithImages = analyzedMenuItems.value.filter(item => item.imageFile)
      let compressedCount = 0
      
      const itemsToSubmit = await Promise.all(analyzedMenuItems.value.map(async (item, index) => {
        if (item.imageFile) {
          submissionMessage.value = `메뉴 이미지를 최적화 중입니다... (${compressedCount + 1}/${menusWithImages.length})`
          try {
            const compressedFile = await imageCompression(item.imageFile, compressionOptions)
            formData.append(`menuImage_${index}`, compressedFile)
          } catch (e) {
            console.error('Menu image compression error:', e)
            formData.append(`menuImage_${index}`, item.imageFile)
          }
          compressedCount++
        }
        
        return {
          name: item.name,
          price: item.price ? item.price.replace(/,/g, '') : '', 
          description: item.description,
          isRecommended: item.isRecommended,
          hasImage: !!item.imageFile 
        }
      }))
      
      formData.append('menuItems', JSON.stringify(itemsToSubmit))
    }

    submissionMessage.value = '정보를 등록하고 있습니다...'
    
    const data = await $api('/restaurants/register', {
      method: 'POST',
      body: formData
    })
    
    if (data.success) {
      localStorage.removeItem(STORAGE_KEY)
      registeredRestaurantId.value = data.restaurantId
      registeredRestaurantName.value = form.value.name
      resetForm()
      showSuccessModal.value = true
    }
  } catch (error) {
    alert(error.data?.statusMessage || '등록 중 오류가 발생했습니다.')
  } finally {
    isSubmitting.value = false
    submissionMessage.value = '맛집을 등록하고 있습니다...'
  }
}

const handleRegisterMore = () => {
  showSuccessModal.value = false
}

const handleGoToRestaurant = () => {
  showSuccessModal.value = false
  navigateTo(`/restaurants/${registeredRestaurantId.value}`)
}
</script>

<style lang="scss" scoped>
// 스타일은 assets/scss/pages/_register.scss로 분리되었습니다.
</style>