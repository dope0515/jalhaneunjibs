<template>
  <section class="restaurant-detail">
    <div v-if="restaurant" class="inner">
      <!-- 상단 헤더 영역 -->
      <div class="detail-header">
        <div class="header-left">
          <div class="category-tag">{{ restaurant.foodCategory }}</div>
          <h1 class="restaurant-name">{{ restaurant.name }}</h1>
          <div class="stats">
            <AppStarRating :modelValue="restaurant.averageRating" readonly size="sm" show-label />
            <span class="reviews">리뷰 {{ restaurant.reviewCount }}</span>
            <span class="likes">찜 {{ restaurant.likes }}</span>
          </div>
          <p class="address">{{ restaurant.address }}</p>
        </div>
        <div class="header-right">
          <div v-if="user?.role === 'ADMIN' || user?.id === restaurant.registeredById" class="admin-actions">
            <AppButton size="sm" variant="outline" @click="handleEdit">정보 수정</AppButton>
            <AppButton size="sm" color="red" variant="outline" @click="handleDelete">삭제</AppButton>
          </div>
          <AppButton
            size="md"
            :color="isSaved ? 'green' : 'black'"
            class="like-btn"
            @click="openFavoriteModal"
          >
            {{ isSaved ? '저장됨' : '맛집 저장' }}
          </AppButton>
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
                :loop="restaurant.images.length > 1"
                :pagination="{ clickable: true }"
                :navigation="restaurant.images.length > 1"
                class="detail-swiper"
              >
                <SwiperSlide v-for="(img, idx) in restaurant.images" :key="idx">
                  <button type="button" class="image-btn main-thumbnail-btn" @click="openGenericLightbox(restaurant.images, idx)" :aria-label="`${restaurant.name} 이미지 ${idx + 1} 크게 보기`">
                    <img :src="img" :alt="`${restaurant.name} 이미지 ${idx + 1}`" class="main-thumbnail" />
                  </button>
                </SwiperSlide>
              </Swiper>
              <button 
                v-else-if="restaurant.thumbnail"
                type="button"
                class="image-btn main-thumbnail-btn"
                @click="openGenericLightbox([restaurant.thumbnail], 0)"
                aria-label="매장 대표 이미지 크게 보기"
              >
                <img 
                  :src="restaurant.thumbnail" 
                  :alt="restaurant.name" 
                  class="main-thumbnail" 
                />
              </button>
              <img 
                v-else
                src="/assets/images/common/default.jpg" 
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
            <div class="menu-section-header">
              <h2 class="section-title">메뉴 안내</h2>
              <button
                v-if="menuBoardImages.length > 0"
                type="button"
                class="menu-board-btn"
                @click="openGenericLightbox(menuBoardImages, 0)"
              >
                메뉴판 확인
              </button>
            </div>
            <ul v-if="sortedMenus.length" class="menu-price-list">
              <li
                v-for="menu in sortedMenus"
                :key="menu.id"
                class="menu-price-row"
                :class="{ 'is-recommended': menu.isRecommended }"
              >
                <div class="menu-price-main">
                  <span class="menu-name">
                    <span v-if="menu.isRecommended" class="recommend-dot" aria-label="추천">★</span>
                    {{ menu.name }}
                  </span>
                  <span class="menu-dots" aria-hidden="true"></span>
                  <span class="menu-price">{{ menu.price ? menu.price.toLocaleString() + '원' : '변동' }}</span>
                </div>
                <p v-if="menu.description" class="menu-desc">{{ menu.description }}</p>
              </li>
            </ul>
            <p v-else class="menu-empty">등록된 메뉴가 없습니다.</p>
          </div>

          <!-- 리뷰 섹션 -->
          <div class="review-section card-box">
            <h2 class="section-title">리뷰 ({{ restaurant.reviewCount }})</h2>

            <!-- 평점 요약 -->
            <div class="review-summary" v-if="restaurant.reviewCount > 0">
              <div class="summary-score">
                <span class="score-number">{{ restaurant.averageRating.toFixed(1) }}</span>
                <AppStarRating :modelValue="restaurant.averageRating" readonly size="lg" />
                <span class="score-total">{{ restaurant.reviewCount }}개의 리뷰</span>
              </div>
              <div class="summary-bars">
                <div v-for="item in ratingDistribution" :key="item.star" class="bar-row">
                  <span class="bar-label">{{ item.star }}점</span>
                  <div class="bar-track">
                    <div class="bar-fill" :style="{ width: item.percent + '%' }"></div>
                  </div>
                  <span class="bar-count">{{ item.count }}</span>
                </div>
              </div>
            </div>

            <!-- 내 리뷰 작성 폼 (로그인 시) -->
            <div v-if="user" class="review-form-wrap">
              <!-- 수정 전: 내 리뷰 표시 -->
              <div v-if="myReview && !editingReview" class="my-review-card">
                <div class="my-review-header">
                  <div class="my-review-label-group">
                    <span class="my-review-label">내가 쓴 리뷰</span>
                    <span v-if="myReview.images?.length" class="visit-badge is-earned">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                        <path d="M9 12l2 2 4-4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                      방문 인증
                    </span>
                  </div>
                  <div class="my-review-actions">
                    <AppButton size="xs" variant="outline" @click="startEditReview">수정</AppButton>
                    <AppButton size="xs" variant="outline" color="red" @click="deleteMyReview">삭제</AppButton>
                  </div>
                </div>
                <AppStarRating :modelValue="myReview.rating" readonly size="md" />
                <p v-if="myReview.content" class="my-review-content">{{ myReview.content }}</p>
                <!-- 내 리뷰 이미지 -->
                <div v-if="myReview.images?.length" class="review-images">
                  <button 
                    v-for="(img, i) in myReview.images"
                    :key="i"
                    type="button"
                    class="image-btn review-img-btn"
                    @click="openGenericLightbox(myReview.images, i)"
                    :aria-label="`리뷰 이미지 ${i + 1} 크게 보기`"
                  >
                    <img
                      :src="img"
                      :alt="`리뷰 이미지 ${i + 1}`"
                      class="review-img-thumb"
                    />
                  </button>
                </div>
              </div>

              <!-- 작성/수정 폼 -->
              <div v-if="!myReview || editingReview" class="review-form">
                <p class="form-guide">{{ editingReview ? '리뷰 수정' : '별점을 선택해 리뷰를 남겨보세요' }}</p>
                <AppStarRating v-model="reviewForm.rating" size="lg" />
                <textarea
                  v-model="reviewForm.content"
                  placeholder="이 식당에서의 경험을 공유해주세요. (선택)"
                  rows="3"
                  class="review-textarea"
                ></textarea>

                <!-- 이미지 업로드 -->
                <div class="review-img-uploader">
                  <input
                    ref="reviewImgInputRef"
                    type="file"
                    accept="image/*"
                    multiple
                    class="sr-only"
                    @change="handleReviewImages"
                  />
                  <div class="upload-row">
                    <AppButton
                      v-if="totalImageCount < 3"
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="reviewImgInputRef?.click()"
                    >
                      <img src="/assets/images/icon/ic_upload.svg" width="16" height="16" alt="" aria-hidden="true" style="margin-right: 6px;" />
                      사진 추가 ({{ totalImageCount }}/3)
                    </AppButton>

                    <!-- 방문 인증 뱃지 프리뷰 -->
                    <div class="visit-badge-wrap">
                      <span class="visit-badge" :class="{ 'is-earned': totalImageCount > 0 }">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                          <path d="M9 12l2 2 4-4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        방문 인증
                      </span>
                      <span class="visit-badge-hint">
                        {{ totalImageCount > 0 ? '뱃지가 부여됩니다!' : '사진을 추가하면 방문 인증 뱃지가 부여됩니다' }}
                      </span>
                    </div>
                  </div>

                  <div v-if="reviewForm.allImages.length" class="img-preview-list">
                    <div
                      v-for="(item, i) in reviewForm.allImages"
                      :key="i"
                      class="img-preview-item"
                    >
                      <img :src="item.type === 'existing' ? item.url : item.preview" alt="미리보기" />
                      <button type="button" class="img-remove-btn" @click="removeReviewImage(i)" aria-label="이미지 삭제">×</button>
                    </div>
                  </div>
                </div>

                <div class="form-actions">
                  <AppButton v-if="editingReview" size="sm" variant="outline" :disabled="reviewSubmitting" @click="cancelEditReview">취소</AppButton>
                  <AppButton size="sm" color="green" :disabled="!reviewForm.rating || reviewSubmitting" @click="submitReview">
                    <span v-if="reviewSubmitting">저장 중…</span>
                    <span v-else>{{ editingReview ? '수정 완료' : '리뷰 등록' }}</span>
                  </AppButton>
                </div>
              </div>
            </div>
            <div v-else class="review-login-guide">
              <p>리뷰를 작성하려면 <NuxtLink to="/login">로그인</NuxtLink>이 필요합니다.</p>
            </div>

            <!-- 리뷰 목록 (내 리뷰 제외) -->
            <div v-if="otherReviews.length > 0" class="review-list">
              <div v-for="review in otherReviews" :key="review.id" class="review-item">
                <div class="review-header">
                  <span class="reviewer-name">{{ review.user.nickname || '사용자' }}</span>
                  <span v-if="review.images?.length" class="visit-badge is-earned">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                      <path d="M9 12l2 2 4-4" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    방문 인증
                  </span>
                  <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                  <AppButton v-if="user?.role === 'ADMIN'" size="xs" variant="outline" color="red" @click="deleteReviewById(review.id)">삭제</AppButton>
                </div>
                <AppStarRating :modelValue="review.rating" readonly size="sm" />
                <p v-if="review.content" class="review-content">{{ review.content }}</p>
                <!-- 리뷰 이미지 -->
                <div v-if="review.images?.length" class="review-images">
                  <button 
                    v-for="(img, i) in review.images"
                    :key="i"
                    type="button"
                    class="image-btn review-img-btn"
                    @click="openGenericLightbox(review.images, i)"
                    :aria-label="`리뷰 이미지 ${i + 1} 크게 보기`"
                  >
                    <img
                      :src="img"
                      :alt="`리뷰 이미지 ${i + 1}`"
                      class="review-img-thumb"
                    />
                  </button>
                </div>
              </div>
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
                    <span class="nickname">{{ comment.user.nickname || '사용자' }}</span>
                    <span class="date">{{ formatDate(comment.createdAt) }}</span>
                  </div>

                  <!-- 인라인 수정 폼 -->
                  <div v-if="editingCommentId === comment.id" class="comment-edit-wrap">
                    <textarea v-model="editingContent" rows="3" class="comment-edit-textarea"></textarea>
                    <div class="comment-edit-btns">
                      <AppButton size="xs" variant="outline" @click="cancelEdit">취소</AppButton>
                      <AppButton size="xs" color="green" :disabled="!editingContent.trim()" @click="submitEdit(comment.id)">수정 완료</AppButton>
                    </div>
                  </div>
                  <p v-else class="content">{{ comment.content }}</p>

                  <div class="comment-actions">
                    <AppButton size="xs" variant="outline" @click="activeReplyId = activeReplyId === comment.id ? null : comment.id">답글 쓰기</AppButton>
                    <template v-if="user?.id === comment.userId || user?.role === 'ADMIN'">
                      <AppButton size="xs" variant="outline" @click="startEdit(comment.id, comment.content)">수정</AppButton>
                      <AppButton size="xs" variant="outline" color="red" @click="deleteComment(comment.id)">삭제</AppButton>
                    </template>
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
                      <span class="nickname">{{ reply.user.nickname || '사용자' }}</span>
                      <span class="date">{{ formatDate(reply.createdAt) }}</span>
                    </div>

                    <!-- 대댓글 인라인 수정 폼 -->
                    <div v-if="editingCommentId === reply.id" class="comment-edit-wrap">
                      <textarea v-model="editingContent" rows="2" class="comment-edit-textarea"></textarea>
                      <div class="comment-edit-btns">
                        <AppButton size="xs" variant="outline" @click="cancelEdit">취소</AppButton>
                        <AppButton size="xs" color="green" :disabled="!editingContent.trim()" @click="submitEdit(reply.id)">수정 완료</AppButton>
                      </div>
                    </div>
                    <p v-else class="content">{{ reply.content }}</p>

                    <div class="reply-actions" v-if="user?.id === reply.userId || user?.role === 'ADMIN'">
                      <AppButton size="xs" variant="outline" @click="startEdit(reply.id, reply.content)">수정</AppButton>
                      <AppButton size="xs" variant="outline" color="red" @click="deleteComment(reply.id)">삭제</AppButton>
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

            <div
              v-if="seasonInfoParsed"
              class="season-status-banner"
              :class="`is-${seasonInfoParsed.status}`"
            >
              <span class="season-status-label">{{ seasonInfoParsed.label }}</span>
              <p v-if="seasonInfoParsed.periodLabel" class="season-status-period">{{ seasonInfoParsed.periodLabel }}</p>
              <p v-if="seasonInfoParsed.hint" class="season-status-hint">{{ seasonInfoParsed.hint }}</p>
              <p v-if="seasonInfoParsed.memo" class="season-status-memo">{{ seasonInfoParsed.memo }}</p>
            </div>

            <ul class="contact-list">
              <li>
                <span class="label">연락처</span>
                <a v-if="restaurant.phoneNumber" :href="`tel:${restaurant.phoneNumber}`" class="value">{{ restaurant.phoneNumber }}</a>
                <span v-else class="value">정보 없음</span>
              </li>
              <li>
                <span class="label">영업시간</span>
                <div class="value-col">
                  <span class="value pre-wrap">{{ restaurant.openingHours || '정보 없음' }}</span>
                  <p v-if="seasonInfoParsed?.periodLabel" class="contact-sub-hint">※ 시즌 중 기준 시간입니다.</p>
                </div>
              </li>
              <li v-if="externalLinksDisplay.length">
                <span class="label">공식 채널</span>
                <div class="value external-links-box">
                  <div class="external-link-list">
                    <a
                      v-for="link in externalLinksDisplay"
                      :key="link.key"
                      :href="link.url"
                      class="external-link-btn"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {{ link.label }}
                      <img src="/assets/images/icon/ic_external.svg" width="12" height="12" alt="" aria-hidden="true" />
                    </a>
                  </div>
                  <p class="external-links-note">방문 전 공식 채널에서 운영·휴무를 확인해 주세요.</p>
                </div>
              </li>
              <li>
                <span class="label">주차정보</span>
                <div class="value parking-info-box">
                  <template v-if="parkingInfoParsed">
                    <div class="parking-status-tags">
                      <span 
                        class="status-badge" 
                        :class="parkingInfoParsed.available ? 'is-available' : 'is-unavailable'"
                      >
                        {{ parkingInfoParsed.available ? '주차 가능' : '주차 불가' }}
                      </span>
                      <template v-if="parkingInfoParsed.available">
                        <span class="type-tag">{{ parkingInfoParsed.type }}</span>
                        <span class="fee-tag" :class="{ 'is-free': parkingInfoParsed.isFree }">
                          {{ parkingInfoParsed.fee }}
                        </span>
                      </template>
                    </div>
                    <p v-if="parkingInfoParsed.memo" class="parking-memo">{{ parkingInfoParsed.memo }}</p>
                  </template>
                  <span v-else>정보 없음</span>
                </div>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </section>

  <!-- 찜 저장 모달 -->
  <AppFavoriteModal
    v-model="favoriteModalOpen"
    :restaurant-id="restaurant.id"
    @changed="onFavoriteChanged"
  />
  <!-- 일반 이미지 라이트박스 -->
  <Teleport to="body">
    <Transition name="lightbox-fade">
      <div v-if="genericLightboxOpen" class="menu-lightbox" @click.self="closeGenericLightbox" role="dialog" aria-modal="true">

        <button class="lightbox-close" @click="closeGenericLightbox" aria-label="닫기">
          <img src="/assets/images/icon/ic_close.svg" width="20" height="20" alt="닫기" />
        </button>

        <Swiper
          :modules="swiperModules"
          :initial-slide="genericLightboxIndex"
          :loop="genericLightboxImages.length > 1"
          :keyboard="{ enabled: true }"
          :navigation="{ prevEl: '.generic-prev', nextEl: '.generic-next' }"
          class="lightbox-swiper"
          @slide-change="onGenericSlideChange"
        >
          <SwiperSlide v-for="(img, i) in genericLightboxImages" :key="i">
            <div class="slide-inner">
              <img :src="img" class="lightbox-img" />
            </div>
          </SwiperSlide>
        </Swiper>

        <p v-if="genericLightboxImages.length > 1" class="lightbox-counter">
          {{ genericCurrentSlide + 1 }} / {{ genericLightboxImages.length }}
        </p>

        <button v-if="genericLightboxImages.length > 1" class="lightbox-nav lightbox-prev generic-prev" aria-label="이전">
          <img src="/assets/images/icon/ic_nav_prev.svg" width="22" height="22" alt="이전" />
        </button>
        <button v-if="genericLightboxImages.length > 1" class="lightbox-nav lightbox-next generic-next" aria-label="다음">
          <img src="/assets/images/icon/ic_nav_next.svg" width="22" height="22" alt="다음" />
        </button>

      </div>
    </Transition>
  </Teleport>

  <AppImagePrivacyEditor
    v-if="privacyEditorOpen && privacyPendingFile"
    :key="`${privacyPendingFile.name}-${privacyPendingFile.size}-${privacyBatchCurrent}`"
    :file="privacyPendingFile"
    :current-index="privacyBatchCurrent"
    :total-count="privacyBatchTotal"
    :remaining-after-current="privacyBatchRemaining"
    :is-last-in-batch="privacyIsLastInBatch"
    @confirm="onPrivacyEditorConfirm"
    @cancel-all="onPrivacyEditorCancelAll"
    @skip="onPrivacyEditorSkip"
    @auto-blur="onPrivacyEditorAutoBlur"
    @auto-blur-remaining="onPrivacyEditorAutoBlurRemaining"
  />
</template>

<script setup>
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination, Keyboard } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { parseParkingInfoForDisplay } from '~/utils/parkingInfo'
import { parseSeasonInfoForDisplay } from '~/utils/seasonInfo'
import { parseExternalLinksForDisplay } from '~/utils/externalLinks'
import { uploadImage, getUploadErrorMessage } from '~/utils/imageUpload'

const { $api } = useApi()
const route = useRoute()
const { user } = useAuth()
const mapRef = ref(null)
const {
  editorOpen: privacyEditorOpen,
  pendingFile: privacyPendingFile,
  batchCurrentIndex: privacyBatchCurrent,
  batchTotal: privacyBatchTotal,
  batchRemainingAfterCurrent: privacyBatchRemaining,
  isLastInBatch: privacyIsLastInBatch,
  enqueueFiles: enqueuePrivacyFiles,
  onEditorConfirm: onPrivacyEditorConfirm,
  onEditorSkip: onPrivacyEditorSkip,
  onEditorAutoBlur: onPrivacyEditorAutoBlur,
  onEditorAutoBlurRemaining: onPrivacyEditorAutoBlurRemaining,
  onEditorCancelAll: onPrivacyEditorCancelAll,
} = useImagePrivacyEditor()

const { data: restaurant, refresh, error } = await useAsyncData(
  `restaurant-${route.params.id}`,
  () => $api(`/restaurants/${route.params.id}`)
)

if (error.value) {
  throw createError({ 
    statusCode: error.value.statusCode, 
    message: error.value.message || '식당 정보를 불러올 수 없습니다.' 
  })
}

if (!restaurant.value) {
  throw createError({ statusCode: 404, message: '식당 정보를 찾을 수 없습니다.' })
}

// 라이트박스 및 메뉴
const swiperModules = [Navigation, Pagination, Keyboard]

const menuBoardImages = computed(() => restaurant.value?.menuBoardImages ?? [])

const sortedMenus = computed(() => {
  const menus = restaurant.value?.menus ?? []
  return [...menus].sort((a, b) => Number(b.isRecommended) - Number(a.isRecommended))
})

const handleKeydown = (e) => {
  if (e.key === 'Escape' && genericLightboxOpen.value) closeGenericLightbox()
}

// ── 이미지 라이트박스 (매장 / 리뷰 / 메뉴판) ───────────────────────────────
const genericLightboxOpen = ref(false)
const genericLightboxImages = ref([])
const genericLightboxIndex = ref(0)
const genericCurrentSlide = ref(0)

const openGenericLightbox = (images, index = 0) => {
  genericLightboxImages.value = images
  genericLightboxIndex.value = index
  genericCurrentSlide.value = index
  genericLightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeGenericLightbox = () => {
  genericLightboxOpen.value = false
  document.body.style.overflow = ''
}

const onGenericSlideChange = (swiper) => {
  genericCurrentSlide.value = swiper.realIndex
}

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  if (user.value) {
    try {
      const status = await $api(`/mypage/favorites/status?restaurantId=${route.params.id}`)
      savedCollectionIds.value = status.savedCollectionIds
    } catch (e) { /* noop */ }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})

// ── 찜하기 ───────────────────────────────────────────────────────
const favoriteModalOpen = ref(false)
const savedCollectionIds = ref([])
const isSaved = computed(() => savedCollectionIds.value.length > 0)

const openFavoriteModal = async () => {
  if (!user.value) return navigateTo('/login')
  favoriteModalOpen.value = true
}

const onFavoriteChanged = async ({ action }) => {
  // 상태 업데이트 (isSaved 계산을 위한 갱신)
  const status = await $api(`/mypage/favorites/status?restaurantId=${route.params.id}`)
  savedCollectionIds.value = status.savedCollectionIds
  
  if (action === 'added') {
    restaurant.value.likes += 1
  } else if (savedCollectionIds.value.length === 0) {
    restaurant.value.likes = Math.max(0, restaurant.value.likes - 1)
  }
}

// ── 리뷰 관련 상태 ───────────────────────────────────────────────
const myReview = computed(() => {
  const currentUserId = Number(user.value?.id)
  if (!currentUserId) return null
  return restaurant.value?.reviews?.find((r) => Number(r.userId) === currentUserId) ?? null
})

const otherReviews = computed(() => {
  const currentUserId = Number(user.value?.id)
  if (!currentUserId) return restaurant.value?.reviews ?? []
  return restaurant.value?.reviews?.filter((r) => Number(r.userId) !== currentUserId) ?? []
})

const ratingDistribution = computed(() => {
  const reviews = restaurant.value?.reviews ?? []
  const total = reviews.length
  return [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length
    return { star, count, percent: total ? Math.round((count / total) * 100) : 0 }
  })
})

const reviewImgInputRef = ref(null)
// allImages: { type: 'existing', url } | { type: 'new', file, preview }
const reviewForm = ref({ rating: 0, content: '', allImages: [] })
const editingReview = ref(false)
const reviewSubmitting = ref(false)

const totalImageCount = computed(() => reviewForm.value.allImages.length)

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (ev) => resolve(ev.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

const handleReviewImages = async (e) => {
  const files = Array.from(e.target.files)
  const remaining = 3 - totalImageCount.value
  const filesToAdd = files.slice(0, remaining)
  if (!filesToAdd.length) {
    e.target.value = ''
    return
  }

  try {
    const processedFiles = await enqueuePrivacyFiles(filesToAdd)
    for (const processed of processedFiles) {
      const preview = await readFileAsDataUrl(processed)
      reviewForm.value.allImages.push({ type: 'new', file: processed, preview })
    }
  } catch {
    alert('이미지 처리 중 오류가 발생했습니다.')
  } finally {
    e.target.value = ''
  }
}

const removeReviewImage = (index) => {
  reviewForm.value.allImages.splice(index, 1)
}

const startEditReview = () => {
  if (!myReview.value) return
  reviewForm.value = {
    rating: myReview.value.rating,
    content: myReview.value.content ?? '',
    // 기존 이미지를 existing 타입으로 미리 채움
    allImages: (myReview.value.images ?? []).map((url) => ({ type: 'existing', url })),
  }
  editingReview.value = true
}

const cancelEditReview = () => {
  editingReview.value = false
  reviewForm.value = { rating: 0, content: '', allImages: [] }
}

const submitReview = async () => {
  if (!reviewForm.value.rating || reviewSubmitting.value || !user.value?.id) return
  reviewSubmitting.value = true
  try {
    const existingUrls = reviewForm.value.allImages
      .filter((i) => i.type === 'existing')
      .map((i) => i.url)

    const newFiles = reviewForm.value.allImages
      .filter((i) => i.type === 'new' && i.file)
      .map((i) => i.file)
    const remaining = Math.max(0, 3 - existingUrls.length)

    const uploadedUrls = []
    for (const file of newFiles.slice(0, remaining)) {
      const url = await uploadImage(file, 'reviews', $api)
      uploadedUrls.push(url)
    }

    const fd = new FormData()
    fd.append('restaurantId', String(restaurant.value.id))
    fd.append('rating', String(reviewForm.value.rating))
    fd.append('content', reviewForm.value.content)
    fd.append('existingImages', JSON.stringify([...existingUrls, ...uploadedUrls].slice(0, 3)))

    await $api('/reviews', { method: 'POST', body: fd })
    editingReview.value = false
    reviewForm.value = { rating: 0, content: '', allImages: [] }
    await refresh()
  } catch (error) {
    alert(getUploadErrorMessage(error, '리뷰 등록에 실패했습니다.'))
  } finally {
    reviewSubmitting.value = false
  }
}

const deleteMyReview = async () => {
  if (!myReview.value || !confirm('리뷰를 삭제하시겠습니까?')) return
  await deleteReviewById(myReview.value.id)
}

const deleteReviewById = async (id) => {
  try {
    await $api(`/reviews/${id}`, { method: 'DELETE' })
    await refresh()
  } catch {
    alert('리뷰 삭제에 실패했습니다.')
  }
}

// ── 댓글 관련 상태 ───────────────────────────────────────────────
const newComment = ref('')
const newReply = ref('')
const activeReplyId = ref(null)
const editingCommentId = ref(null)
const editingContent = ref('')

const startEdit = (id, content) => {
  editingCommentId.value = id
  editingContent.value = content
  activeReplyId.value = null // 답글 입력창 닫기
}

const cancelEdit = () => {
  editingCommentId.value = null
  editingContent.value = ''
}

const submitEdit = async (id) => {
  if (!editingContent.value.trim()) return
  try {
    await $api(`/comments/${id}`, {
      method: 'PUT',
      body: { content: editingContent.value },
    })
    cancelEdit()
    await refresh()
  } catch {
    alert('댓글 수정에 실패했습니다.')
  }
}

const totalCommentsCount = computed(() => {
  if (!restaurant.value?.comments) return 0
  return restaurant.value.comments.reduce((acc, curr) => acc + 1 + (curr.replies?.length || 0), 0)
})

const submitComment = async (parentId = null) => {
  const content = parentId ? newReply.value : newComment.value
  if (!content.trim()) return

  try {
    await $api('/comments/register', {
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
    await $api(`/comments/${id}`, { method: 'DELETE' })
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
  if (!confirm('정말 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.')) return
  try {
    await $api(`/restaurants/${route.params.id}`, { method: 'DELETE' })
    await navigateTo('/restaurants')
  } catch (e) {
    alert('삭제에 실패했습니다. 다시 시도해주세요.')
  }
}

const copyAddress = () => {
  navigator.clipboard.writeText(restaurant.value.address)
  alert('주소가 복사되었습니다.')
}

// ── 주차 정보 가공 ──────────────────────────────────────────────────
const parkingInfoParsed = computed(() => parseParkingInfoForDisplay(restaurant.value?.parkingInfo))
const seasonInfoParsed = computed(() => parseSeasonInfoForDisplay(restaurant.value?.seasonInfo))
const externalLinksDisplay = computed(() => parseExternalLinksForDisplay(restaurant.value?.externalLinks))
</script>


