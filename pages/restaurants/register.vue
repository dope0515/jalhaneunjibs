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
              <AppButton variant="outline" color="green" size="md" @click="handleRegisterMore">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                잘하는 집을 더 입력하기
              </AppButton>
              <AppButton color="green" size="md" @click="handleGoToRestaurant">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                보러가기
              </AppButton>
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
                        :class="{
                          'is-focused': focusedIndex === index,
                          'is-registered': registeredPlaceIds.has(place.id)
                        }"
                        :disabled="registeredPlaceIds.has(place.id)"
                        role="option"
                        :aria-selected="focusedIndex === index"
                        :aria-disabled="registeredPlaceIds.has(place.id)"
                        @click="selectPlace(place)"
                        @mouseenter="!registeredPlaceIds.has(place.id) && (focusedIndex = index)"
                        @focus="!registeredPlaceIds.has(place.id) && (focusedIndex = index)"
                        @keydown.enter.stop="selectPlace(place)"
                      >
                        <span class="place-name">{{ place.place_name }}</span>
                        <span class="place-address">{{ place.road_address_name || place.address_name }}</span>
                        <span class="place-category" v-if="place.category_name">{{ place.category_name.split(' > ').pop() }}</span>
                        <span v-if="registeredPlaceIds.has(place.id)" class="place-registered-badge">이미 등록된 식당입니다</span>
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
                    <AppButton 
                      v-for="cat in categories" 
                      :key="cat"
                      type="button"
                      :variant="form.category === cat ? 'fill' : 'outline'"
                      :color="form.category === cat ? 'green' : 'black'"
                      shape="round"
                      size="sm"
                      :aria-pressed="form.category === cat"
                      @click="form.category = cat"
                    >
                      {{ cat }}
                    </AppButton>
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
                      <AppButton
                        type="button"
                        color="green"
                        size="md"
                        :disabled="!keywordInput.trim()"
                        @click="addCustomKeyword()"
                        style="flex-shrink: 0;"
                      >등록</AppButton>
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
                      <div class="hours-sub-item has-divider">
                        <span class="hours-sub-label">시간 입력 방식</span>
                        <div class="preset-group">
                          <AppButton type="button" size="sm" :variant="opData.scheduleMode === 'uniform' ? 'fill' : 'outline'" :color="opData.scheduleMode === 'uniform' ? 'green' : 'black'" @click="opData.scheduleMode = 'uniform'">모든 요일 동일</AppButton>
                          <AppButton type="button" size="sm" :variant="opData.scheduleMode === 'perDay' ? 'fill' : 'outline'" :color="opData.scheduleMode === 'perDay' ? 'green' : 'black'" @click="opData.scheduleMode = 'perDay'">요일마다 다르게</AppButton>
                        </div>
                        <p v-if="opData.scheduleMode === 'perDay'" class="hours-hint">요일별로 영업·휴무·시간을 각각 설정할 수 있어요.</p>
                      </div>

                      <template v-if="opData.scheduleMode === 'uniform'">
                        <!-- 요일 선택 -->
                        <div class="hours-sub-item has-divider">
                          <span class="hours-sub-label">영업 요일</span>
                          <div class="preset-group">
                            <AppButton type="button" size="sm" :variant="opData.dayType === 'everyday' ? 'fill' : 'outline'" :color="opData.dayType === 'everyday' ? 'green' : 'black'" @click="setDayPreset('everyday')">매일 (월~일)</AppButton>
                            <AppButton type="button" size="sm" :variant="opData.dayType === 'weekdays' ? 'fill' : 'outline'" :color="opData.dayType === 'weekdays' ? 'green' : 'black'" @click="setDayPreset('weekdays')">평일 (월~금)</AppButton>
                            <AppButton type="button" size="sm" :variant="opData.dayType === 'weekends' ? 'fill' : 'outline'" :color="opData.dayType === 'weekends' ? 'green' : 'black'" @click="setDayPreset('weekends')">주말 (토~일)</AppButton>
                            <AppButton type="button" size="sm" :variant="opData.dayType === 'custom' ? 'fill' : 'outline'" :color="opData.dayType === 'custom' ? 'green' : 'black'" @click="setDayPreset('custom')">직접 선택</AppButton>
                          </div>
                          <div class="days-toggle-group" v-if="opData.dayType === 'custom'">
                            <AppButton 
                              v-for="d in WEEKDAYS" 
                              :key="d"
                              type="button"
                              size="sm"
                              shape="round"
                              :variant="opData.customDays.includes(d) ? 'fill' : 'outline'"
                              :color="opData.customDays.includes(d) ? 'green' : 'black'"
                              style="width: 36px; height: 36px; padding: 0;"
                              @click="toggleCustomDay(d)"
                            >
                              {{ d }}
                            </AppButton>
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
                            <AppButton type="button" size="sm" variant="outline" @click="applyWeekdayBulk">평일에 월요일 시간 적용</AppButton>
                            <AppButton type="button" size="sm" variant="outline" @click="applyWeekendBulk">주말에 토요일 시간 적용</AppButton>
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
                          <AppButton 
                            v-for="d in ['월', '화', '수', '목', '금', '토', '일']" 
                            :key="`closed-${d}`"
                            type="button"
                            size="sm"
                            shape="round"
                            :variant="opData.closedDays.includes(d) ? 'fill' : 'outline'"
                            :color="opData.closedDays.includes(d) ? 'red' : 'black'"
                            style="width: 36px; height: 36px; padding: 0;"
                            @click="toggleClosedDay(d)"
                          >
                            {{ d }}
                          </AppButton>
                        </div>
                      </div>
                    </template>
                  </div>
                </div>

                <div class="form-item">
                  <label class="form-item-label">주차 정보</label>
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
                          <AppButton type="button" size="sm" :variant="parkingData.available === true ? 'fill' : 'outline'" :color="parkingData.available === true ? 'green' : 'black'" @click="parkingData.available = true">주차 가능</AppButton>
                          <AppButton type="button" size="sm" :variant="parkingData.available === false ? 'fill' : 'outline'" :color="parkingData.available === false ? 'green' : 'black'" @click="parkingData.available = false">주차 불가</AppButton>
                        </div>
                      </div>

                      <template v-if="parkingData.available">
                        <!-- 주차 유형 -->
                        <div class="hours-sub-item">
                          <span class="hours-sub-label">주차 유형</span>
                          <div class="preset-group">
                            <AppButton type="button" size="sm" :variant="parkingData.type === '자체주차장' ? 'fill' : 'outline'" :color="parkingData.type === '자체주차장' ? 'green' : 'black'" @click="parkingData.type = '자체주차장'">자체 주차장</AppButton>
                            <AppButton type="button" size="sm" :variant="parkingData.type === '발렛파킹' ? 'fill' : 'outline'" :color="parkingData.type === '발렛파킹' ? 'green' : 'black'" @click="parkingData.type = '발렛파킹'">발렛 파킹</AppButton>
                            <AppButton type="button" size="sm" :variant="parkingData.type === '공영주차장' ? 'fill' : 'outline'" :color="parkingData.type === '공영주차장' ? 'green' : 'black'" @click="parkingData.type = '공영주차장'">공영 주차장</AppButton>
                            <AppButton type="button" size="sm" :variant="parkingData.type === '건물주차장' ? 'fill' : 'outline'" :color="parkingData.type === '건물주차장' ? 'green' : 'black'" @click="parkingData.type = '건물주차장'">건물 주차장</AppButton>
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
                        <span class="drop-zone-sub">최대 {{ MAX_MENU_BOARD_IMAGES }}장까지 분석할 수 있습니다</span>
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

                  <AppButton
                    v-if="menuBoardPreviews.length > 0 && !isAnalyzing"
                    type="button"
                    color="green"
                    size="md"
                    style="width: 100%; margin-top: 10px;"
                    @click="analyzeMenuBoard"
                  >
                    메뉴 분석하기
                  </AppButton>

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
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" stroke-width="2" stroke-linejoin="round" aria-hidden="true">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        추천 버튼을 눌러 대표 메뉴를 설정하세요
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
                            <svg width="13" height="13" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linejoin="round">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                            <span>추천</span>
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

                    <AppButton
                      type="button"
                      variant="outline"
                      size="md"
                      style="width: 100%; margin-top: 10px;"
                      @click="analyzedMenuItems.push({ name: '', price: '', description: '', isRecommended: false, imageFile: null, imagePreview: null })"
                    >
                      + 메뉴 직접 추가
                    </AppButton>
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
import {
  MAX_MENU_BOARD_IMAGES,
  MAX_RESTAURANT_IMAGES,
  compressImageFile,
  uploadImage,
  uploadImagesSequentially,
  getUploadErrorMessage,
} from '~/utils/imageUpload'
import { WEEKDAYS, createDefaultOpData, formatOpeningHours } from '~/utils/openingHours'

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
  parkingInfo: '',
  keywords: []
})

// ── 상세 영업시간 데이터 및 헬퍼 ──────────────────────────────────
const opData = ref(createDefaultOpData())

// ── 주차 정보 데이터 및 헬퍼 ──────────────────────────────────────
const parkingData = ref({
  hasParking: false,
  available: true,
  type: '자체주차장',
  isFree: true,
  feeDesc: '',
  hasMemo: false,
  memo: '',
})

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

const searchResults = ref([])
const registeredPlaceIds = ref(new Set())
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
    
    ps.keywordSearch(value, async (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        searchResults.value = data
        focusedIndex.value = -1

        const ids = data.map((p) => p.id).filter(Boolean)
        if (ids.length > 0) {
          try {
            const { registeredIds } = await $fetch(
              '/api/restaurants/check-places',
              { method: 'POST', body: { placeIds: ids } }
            )
            registeredPlaceIds.value = new Set(registeredIds)
          } catch {
            registeredPlaceIds.value = new Set()
          }
        } else {
          registeredPlaceIds.value = new Set()
        }
      } else {
        searchResults.value = []
        registeredPlaceIds.value = new Set()
      }
    }, options)
  }, 400)
}

const handleKeydown = (e) => {
  if (searchResults.value.length === 0) return
  if (e.isComposing) return

  const isRegistered = (idx) =>
    registeredPlaceIds.value.has(searchResults.value[idx]?.id)

  switch (e.key) {
    case 'ArrowDown': {
      e.preventDefault()
      let next = (focusedIndex.value + 1) % searchResults.value.length
      const start = next
      while (isRegistered(next)) {
        next = (next + 1) % searchResults.value.length
        if (next === start) break
      }
      focusedIndex.value = next
      break
    }
    case 'ArrowUp': {
      e.preventDefault()
      let prev = (focusedIndex.value - 1 + searchResults.value.length) % searchResults.value.length
      const start = prev
      while (isRegistered(prev)) {
        prev = (prev - 1 + searchResults.value.length) % searchResults.value.length
        if (prev === start) break
      }
      focusedIndex.value = prev
      break
    }
    case 'Enter':
      e.preventDefault()
      if (searchResults.value.length > 0) {
        const targetIndex = focusedIndex.value >= 0 ? focusedIndex.value : 0
        if (!isRegistered(targetIndex)) {
          selectPlace(searchResults.value[targetIndex])
        }
      }
      break
    case 'Escape':
      searchResults.value = []
      focusedIndex.value = -1
      isSearchFocused.value = false
      break
  }
}

// 카테고리 매핑 헬퍼
const getMajorCategory = (rawCategory) => {
  if (!rawCategory) return ''
  
  // 1. 이미 대분류 리스트에 포함된 경우 그대로 반환
  if (categories.includes(rawCategory)) return rawCategory

  // 2. 키워드 기반 매핑
  const mapping = {
    '한식': ['육류', '고기', '족발', '보쌈', '백반', '한정식', '찌개', '전골', '국밥', '치킨', '닭요리', '게장', '냉면', '칼국수', '수제비', '곰탕', '해장국', '아구찜', '해물탕', '찜닭', '전', '부침개', '구이'],
    '중식': ['중화요리', '짜장', '짬뽕', '마라탕', '양꼬치', '딤섬', '훠궈', '꿔바로우', '양갈비'],
    '일식': ['초밥', '스시', '회', '라멘', '우동', '소바', '돈까스', '참치', '가츠동', '덮밥', '텐동', '오마카세', '꼬치구이', '야키토리'],
    '양식': ['이탈리안', '파스타', '피자', '스테이크', '패밀리레스토랑', '햄버거', '샌드위치', '샐러드', '레스토랑', '브런치', '프랑스', '멕시칸', '타코', '바베큐'],
    '카페': ['커피', '카페', '디저트', '베이커리', '찻집', '빵집', '도넛', '마카롱', '빙수', '샌드위치', '케이크', '와플', '아이스크림'],
    '주점': ['술집', '포차', '호프', '바', '와인바', '이자카야', '맥주', '와인', '칵테일', '위스키', '실내포차', '민속주점'],
    '분식': ['떡볶이', '김밥', '라면', '만두', '튀김', '순대', '어묵', '토스트', '도시락'],
    '아시아음식': ['베트남', '태국', '인도', '멕시칸', '쌀국수', '샤브샤브', '커리', '돈까스', '퓨전', '동남아']
  }

  for (const [major, keywords] of Object.entries(mapping)) {
    if (keywords.some(keyword => rawCategory.includes(keyword))) {
      return major
    }
  }

  // 3. 매핑 실패 시 '한식'을 기본값으로 하거나 빈 문자열 유지 (여기서는 빈 문자열)
  return ''
}

const selectPlace = (place) => {
  if (registeredPlaceIds.value.has(place.id)) return
  if (searchTimeout) clearTimeout(searchTimeout)

  const rawCat = place.category_name?.split(' > ').pop() || ''

  form.value.name = place.place_name
  form.value.address = place.road_address_name || place.address_name
  form.value.phoneNumber = place.phone
  form.value.category = getMajorCategory(rawCat)
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
  const remaining = MAX_RESTAURANT_IMAGES - restaurantImages.value.length

  if (remaining <= 0) {
    alert(`매장 이미지는 최대 ${MAX_RESTAURANT_IMAGES}장까지 등록할 수 있습니다.`)
    return
  }

  const filesToAdd = newFiles.slice(0, remaining)
  if (newFiles.length > remaining) {
    alert(`매장 이미지는 최대 ${MAX_RESTAURANT_IMAGES}장까지 등록할 수 있습니다.`)
  }

  filesToAdd.forEach(file => {
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
  const remaining = MAX_MENU_BOARD_IMAGES - menuBoardFiles.value.length

  if (remaining <= 0) {
    alert(`메뉴판 이미지는 최대 ${MAX_MENU_BOARD_IMAGES}장까지 분석할 수 있습니다.`)
    return
  }

  const filesToAdd = newFiles.slice(0, remaining)
  if (newFiles.length > remaining) {
    alert(`메뉴판 이미지는 최대 ${MAX_MENU_BOARD_IMAGES}장까지 분석할 수 있습니다.`)
  }

  filesToAdd.forEach(file => {
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
    for (const file of menuBoardFiles.value) {
      const compressed = await compressImageFile(file)
      data.append('menuBoard', compressed)
    }
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
    parkingInfo: '',
    keywords: []
  }
  opData.value = createDefaultOpData()
  parkingData.value = {
    hasParking: false,
    available: true,
    type: '자체주차장',
    isFree: true,
    feeDesc: '',
    hasMemo: false,
    memo: '',
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

  try {
    // ── 1. 매장 이미지 순차 업로드 ──────────────────────────────────
    const restaurantImageUrls = []
    const totalRestaurant = restaurantImages.value.length
    for (let i = 0; i < totalRestaurant; i++) {
      submissionMessage.value = `매장 이미지 업로드 중... (${i + 1}/${totalRestaurant})`
      const url = await uploadImage(restaurantImages.value[i], 'restaurants', $api)
      restaurantImageUrls.push(url)
    }

    // ── 2. 메뉴 이미지 순차 업로드 ──────────────────────────────────
    const menuImageUrls = {}
    const itemsWithImage = analyzedMenuItems.value.filter(item => item.imageFile)
    let menuUploadCount = 0
    for (let i = 0; i < analyzedMenuItems.value.length; i++) {
      const item = analyzedMenuItems.value[i]
      if (!item.imageFile) continue
      menuUploadCount++
      submissionMessage.value = `메뉴 이미지 업로드 중... (${menuUploadCount}/${itemsWithImage.length})`
      const url = await uploadImage(item.imageFile, 'menus', $api)
      menuImageUrls[i] = url
    }

    // ── 3. 최종 등록 요청 (URL만 전송, 바이너리 없음) ───────────────
    submissionMessage.value = '식당 정보를 등록하고 있습니다...'

    const formData = new FormData()

    Object.keys(form.value).forEach((key) => {
      if (key === 'keywords') {
        formData.append(key, JSON.stringify(form.value[key]))
      } else if (form.value[key] != null) {
        formData.append(key, form.value[key])
      }
    })

    formData.append('restaurantImageUrls', JSON.stringify(restaurantImageUrls))

    const itemsToSubmit = analyzedMenuItems.value.map((item, index) => ({
      name: item.name,
      price: item.price ? item.price.replace(/,/g, '') : '',
      description: item.description,
      isRecommended: item.isRecommended,
    }))
    formData.append('menuItems', JSON.stringify(itemsToSubmit))

    Object.entries(menuImageUrls).forEach(([index, url]) => {
      formData.append(`menuImageUrl_${index}`, url)
    })

    const data = await $api('/restaurants/register', {
      method: 'POST',
      body: formData,
    })

    if (data.success) {
      localStorage.removeItem(STORAGE_KEY)
      registeredRestaurantId.value = data.restaurantId
      registeredRestaurantName.value = form.value.name
      resetForm()
      showSuccessModal.value = true
    }
  } catch (error) {
    alert(getUploadErrorMessage(error, '등록 중 오류가 발생했습니다.'))
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
