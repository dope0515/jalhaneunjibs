<template>
  <div>
    <!-- 찜 저장 모달 -->
    <Teleport to="body">
      <Transition name="lightbox-fade">
        <div v-if="modelValue" class="modal-overlay" @click.self="close">
          <div class="favorite-modal">
            <div class="fav-modal-header">
              <h3>내 맛집에 저장하기</h3>
              <button class="fav-modal-close" @click="close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div v-if="loading" class="fav-loading">불러오는 중…</div>
            <div v-else class="fav-collections-list">
              <div
                v-for="col in collections"
                :key="col.id"
                class="fav-col-row"
                :class="{ 'is-confirming': deleteTargetId === col.id }"
                @click="toggleFavorite(col.id)"
              >
                <div class="fav-col-thumb">
                  <img
                    v-if="col.favorites?.[0]?.restaurant?.thumbnail"
                    :src="col.favorites[0].restaurant.thumbnail"
                    alt=""
                  />
                  <div v-else class="fav-col-thumb-empty">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </div>
                </div>
                <span class="fav-col-name">{{ col.name }}</span>
                <span class="fav-col-count">{{ col._count?.favorites ?? 0 }}개</span>

                <!-- 삭제 확인 UI -->
                <template v-if="deleteTargetId === col.id">
                  <div class="fav-col-confirm" @click.stop>
                    <span class="confirm-label">삭제할까요?</span>
                    <button class="confirm-yes" @click="confirmDelete(col.id)">삭제</button>
                    <button class="confirm-no" @click="deleteTargetId = null">취소</button>
                  </div>
                </template>
                <template v-else>
                  <input
                    type="checkbox"
                    class="fav-col-check"
                    :checked="savedCollectionIds.includes(col.id)"
                    @click.stop
                    @change.stop="toggleFavorite(col.id)"
                  />
                  <button
                    class="fav-col-delete-btn"
                    aria-label="목록 삭제"
                    @click.stop="deleteTargetId = col.id"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                    </svg>
                  </button>
                </template>
              </div>

              <div v-if="collections.length === 0" class="fav-empty">
                <p>저장 목록이 없어요</p>
              </div>
            </div>

            <div class="fav-modal-footer">
              <button class="fav-new-btn" @click="openCreateModal">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                새 목록 만들기
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 새 목록 만들기 모달 -->
    <Teleport to="body">
      <div v-if="createModalOpen" class="modal-overlay" @click.self="createModalOpen = false">
        <div class="modal-box">
          <h3 class="modal-title">새 목록 만들기</h3>
          <input
            v-model="newColName"
            class="modal-input"
            placeholder="예: 데이트 코스"
            maxlength="30"
            @keydown.enter="(e) => { if (!e.isComposing) createAndFavorite() }"
          />
          <div class="modal-actions">
            <button class="btn-ghost" @click="createModalOpen = false">취소</button>
            <button class="btn-primary" :disabled="!newColName.trim()" @click="createAndFavorite">만들기</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  restaurantId: { type: [Number, String], required: true },
})

const emit = defineEmits(['update:modelValue', 'changed'])

const { $api } = useApi()
const loading = ref(false)
const collections = ref([])
const savedCollectionIds = ref([])
const createModalOpen = ref(false)
const newColName = ref('')
const deleteTargetId = ref(null)

const close = () => {
  deleteTargetId.value = null
  emit('update:modelValue', false)
}

const loadStatus = async () => {
  if (!props.modelValue || !props.restaurantId) return
  loading.value = true
  try {
    const [cols, status] = await Promise.all([
      $api('/mypage/collections'),
      $api(`/mypage/favorites/status?restaurantId=${props.restaurantId}`),
    ])
    collections.value = cols
    savedCollectionIds.value = status.savedCollectionIds
  } catch (e) {
    console.error('Failed to load favorite status', e)
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (val) => {
  if (val) loadStatus()
})

const toggleFavorite = async (collectionId) => {
  try {
    const result = await $api('/mypage/favorites/toggle', {
      method: 'POST',
      body: { restaurantId: parseInt(props.restaurantId), collectionId },
    })
    
    if (result.action === 'added') {
      savedCollectionIds.value.push(collectionId)
    } else {
      savedCollectionIds.value = savedCollectionIds.value.filter((id) => id !== collectionId)
    }
    
    emit('changed', { action: result.action, restaurantId: props.restaurantId })
    
    // 컬렉션 정보 갱신 (개수 등)
    const col = collections.value.find(c => c.id === collectionId)
    if (col) {
      if (result.action === 'added') col._count.favorites++
      else col._count.favorites--
    }
  } catch (e) {
    alert('저장에 실패했습니다.')
  }
}

const openCreateModal = () => {
  createModalOpen.value = true
}

const confirmDelete = async (collectionId) => {
  try {
    await $api(`/mypage/collections/${collectionId}`, { method: 'DELETE' })
    collections.value = collections.value.filter(c => c.id !== collectionId)
    savedCollectionIds.value = savedCollectionIds.value.filter(id => id !== collectionId)
    deleteTargetId.value = null
    emit('changed', { action: 'collection-deleted', restaurantId: props.restaurantId })
  } catch (e) {
    alert('목록 삭제에 실패했습니다.')
    deleteTargetId.value = null
  }
}

const createAndFavorite = async () => {
  if (!newColName.value.trim()) return
  try {
    const col = await $api('/mypage/collections', {
      method: 'POST',
      body: { name: newColName.value.trim(), isPrivate: true },
    })
    collections.value.unshift(col)
    newColName.value = ''
    createModalOpen.value = false
    await toggleFavorite(col.id)
  } catch (e) {
    alert('목록 생성에 실패했습니다.')
  }
}
</script>

<style lang="scss" scoped>
/* _mypage.scss의 스타일을 따름 */
</style>
