<template>
  <Teleport to="body">
    <div class="privacy-editor-overlay" @click.self="emit('cancel-all')">
      <div class="privacy-editor" role="dialog" aria-modal="true" aria-labelledby="privacy-editor-title">
        <div class="privacy-editor__header">
          <div class="privacy-editor__title-row">
            <h2 id="privacy-editor-title" class="privacy-editor__title">초상권 보호 편집</h2>
            <span v-if="totalCount > 1" class="privacy-editor__progress">
              {{ currentIndex }} / {{ totalCount }}
            </span>
          </div>
          <p class="privacy-editor__desc">
            얼굴이 보이는 영역을 드래그해 가리거나 자동 검출을 사용하세요.
            {{ totalCount > 1 ? '모든 사진을 확인한 뒤 추가됩니다.' : '' }}
            업로드 시 서버에서 한 번 더 처리됩니다.
          </p>
        </div>

        <div class="privacy-editor__toolbar">
          <button
            type="button"
            class="privacy-editor__tool"
            :class="{ 'is-active': drawMode === 'blur' }"
            @click="drawMode = 'blur'"
          >
            모자이크
          </button>
          <button
            type="button"
            class="privacy-editor__tool"
            :class="{ 'is-active': drawMode === 'emoji' }"
            @click="drawMode = 'emoji'"
          >
            이모지
          </button>
          <div v-if="drawMode === 'emoji'" class="privacy-editor__emoji-list">
            <button
              v-for="emoji in emojiOptions"
              :key="emoji"
              type="button"
              class="privacy-editor__emoji-btn"
              :class="{ 'is-active': selectedEmoji === emoji }"
              @click="selectedEmoji = emoji"
            >
              {{ emoji }}
            </button>
          </div>
          <button type="button" class="privacy-editor__tool privacy-editor__tool--secondary" :disabled="detecting" @click="autoDetectFaces">
            {{ detecting ? '검출 중…' : '자동 얼굴 가리기' }}
          </button>
          <button type="button" class="privacy-editor__tool privacy-editor__tool--secondary" :disabled="!masks.length" @click="undoMask">
            되돌리기
          </button>
        </div>

        <div ref="canvasWrapRef" class="privacy-editor__canvas-wrap">
          <canvas
            ref="canvasRef"
            class="privacy-editor__canvas"
            @mousedown="onPointerDown"
            @mousemove="onPointerMove"
            @mouseup="onPointerUp"
            @mouseleave="onPointerUp"
            @touchstart.prevent="onTouchStart"
            @touchmove.prevent="onTouchMove"
            @touchend.prevent="onTouchEnd"
          />
        </div>

        <p v-if="statusMessage" class="privacy-editor__status">{{ statusMessage }}</p>

        <div class="privacy-editor__secondary-actions">
          <button type="button" class="privacy-editor__link-btn" @click="emit('skip')">
            이 사진 건너뛰기
          </button>
          <button type="button" class="privacy-editor__link-btn" :disabled="processing" @click="emit('auto-blur')">
            자동 가림 후 다음
          </button>
          <button
            v-if="remainingAfterCurrent > 0"
            type="button"
            class="privacy-editor__link-btn"
            :disabled="processing"
            @click="emit('auto-blur-remaining')"
          >
            남은 {{ remainingAfterCurrent }}장 자동 가림
          </button>
        </div>

        <div class="privacy-editor__actions">
          <AppButton type="button" variant="outline" color="green" @click="emit('cancel-all')">
            전체 취소
          </AppButton>
          <AppButton type="button" color="green" :disabled="processing" @click="confirm">
            {{ confirmLabel }}
          </AppButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import {
  applyEmojiRegion,
  applyPixelateRegion,
  detectFacesFromImage,
  EMOJI_OPTIONS,
  renderPrivacyImage,
} from '~/utils/imagePrivacy'

const props = defineProps({
  file: { type: Object, required: true },
  currentIndex: { type: Number, default: 1 },
  totalCount: { type: Number, default: 1 },
  remainingAfterCurrent: { type: Number, default: 0 },
  isLastInBatch: { type: Boolean, default: true },
})

const emit = defineEmits(['confirm', 'cancel-all', 'skip', 'auto-blur', 'auto-blur-remaining'])

const canvasRef = ref(null)
const canvasWrapRef = ref(null)
const emojiOptions = EMOJI_OPTIONS
const drawMode = ref('blur')
const selectedEmoji = ref('🙂')
const masks = ref([])
const detecting = ref(false)
const processing = ref(false)
const statusMessage = ref('')

const sourceImage = ref(null)
const objectUrl = ref('')
const scale = ref(1)
const displayWidth = ref(0)
const displayHeight = ref(0)

const drawing = ref(false)
const drawStart = ref(null)
const previewRect = ref(null)

const confirmLabel = computed(() => {
  if (processing.value) return '적용 중…'
  if (props.totalCount > 1 && !props.isLastInBatch) return '적용하고 다음'
  return '적용 후 추가'
})

const revokeObjectUrl = () => {
  if (objectUrl.value) {
    URL.revokeObjectURL(objectUrl.value)
    objectUrl.value = ''
  }
}

const redraw = () => {
  const canvas = canvasRef.value
  const img = sourceImage.value
  if (!canvas || !img) return

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, displayWidth.value, displayHeight.value)

  for (const mask of masks.value) {
    const x = mask.x * scale.value
    const y = mask.y * scale.value
    const w = mask.width * scale.value
    const h = mask.height * scale.value
    if (mask.type === 'emoji') {
      applyEmojiRegion(ctx, x, y, w, h, mask.emoji || '🙂')
    } else {
      applyPixelateRegion(ctx, x, y, w, h)
    }
  }

  if (previewRect.value) {
    const { x, y, w, h } = previewRect.value
    ctx.strokeStyle = '#059669'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 4])
    ctx.strokeRect(x, y, w, h)
    ctx.setLineDash([])
  }
}

const setupCanvas = async () => {
  revokeObjectUrl()
  masks.value = []
  statusMessage.value = ''
  drawing.value = false
  drawStart.value = null
  previewRect.value = null

  objectUrl.value = URL.createObjectURL(props.file)
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = objectUrl.value
  })

  sourceImage.value = img
  const maxWidth = Math.min(560, canvasWrapRef.value?.clientWidth || 560)
  scale.value = Math.min(1, maxWidth / img.naturalWidth)
  displayWidth.value = Math.round(img.naturalWidth * scale.value)
  displayHeight.value = Math.round(img.naturalHeight * scale.value)

  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width = displayWidth.value
  canvas.height = displayHeight.value
  redraw()
}

const canvasPointFromEvent = (event) => {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const clientX = event.clientX ?? event.touches?.[0]?.clientX
  const clientY = event.clientY ?? event.touches?.[0]?.clientY
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  }
}

const toNaturalRect = (start, end) => {
  const x1 = Math.min(start.x, end.x) / scale.value
  const y1 = Math.min(start.y, end.y) / scale.value
  const x2 = Math.max(start.x, end.x) / scale.value
  const y2 = Math.max(start.y, end.y) / scale.value
  return {
    x: x1,
    y: y1,
    width: Math.max(8 / scale.value, x2 - x1),
    height: Math.max(8 / scale.value, y2 - y1),
  }
}

const onPointerDown = (event) => {
  drawing.value = true
  drawStart.value = canvasPointFromEvent(event)
  previewRect.value = null
}

const onPointerMove = (event) => {
  if (!drawing.value || !drawStart.value) return
  const current = canvasPointFromEvent(event)
  const x = Math.min(drawStart.value.x, current.x)
  const y = Math.min(drawStart.value.y, current.y)
  previewRect.value = {
    x,
    y,
    w: Math.abs(current.x - drawStart.value.x),
    h: Math.abs(current.y - drawStart.value.y),
  }
  redraw()
}

const onPointerUp = (event) => {
  if (!drawing.value || !drawStart.value) return
  const current = canvasPointFromEvent(event)
  const rect = toNaturalRect(drawStart.value, current)

  if (rect.width > 12 && rect.height > 12) {
    masks.value.push({
      ...rect,
      type: drawMode.value,
      emoji: selectedEmoji.value,
    })
  }

  drawing.value = false
  drawStart.value = null
  previewRect.value = null
  redraw()
}

const onTouchStart = (event) => onPointerDown(event)
const onTouchMove = (event) => onPointerMove(event)
const onTouchEnd = (event) =>
  onPointerUp(
    event.changedTouches?.[0]
      ? { clientX: event.changedTouches[0].clientX, clientY: event.changedTouches[0].clientY }
      : event,
  )

const undoMask = () => {
  masks.value.pop()
  redraw()
}

const autoDetectFaces = async () => {
  detecting.value = true
  statusMessage.value = ''
  try {
    const faces = await detectFacesFromImage(objectUrl.value)
    if (!faces.length) {
      statusMessage.value = '검출된 얼굴이 없습니다. 직접 영역을 드래그해 주세요.'
      return
    }
    masks.value.push(...faces)
    statusMessage.value = `${faces.length}개 얼굴 영역을 추가했습니다.`
    redraw()
  } catch (error) {
    console.error(error)
    statusMessage.value = '자동 검출에 실패했습니다. 직접 영역을 지정해 주세요.'
  } finally {
    detecting.value = false
  }
}

const confirm = async () => {
  processing.value = true
  try {
    const processed = await renderPrivacyImage(props.file, masks.value)
    emit('confirm', processed)
  } catch (error) {
    alert(error.message || '이미지 처리에 실패했습니다.')
  } finally {
    processing.value = false
  }
}

watch(
  () => props.file,
  () => {
    nextTick(() => setupCanvas())
  },
)

onMounted(() => {
  setupCanvas()
})

onUnmounted(() => {
  revokeObjectUrl()
})
</script>

<style lang="scss" scoped>
@use '~/assets/scss/abstracts/variables' as *;
@use '~/assets/scss/abstracts/mixins' as *;

.privacy-editor-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: rem(16);
}

.privacy-editor {
  width: 100%;
  max-width: rem(640);
  max-height: 92vh;
  overflow: auto;
  background: $white;
  border-radius: rem(16);
  padding: rem(20);
  box-shadow: 0 rem(20) rem(60) rgba(0, 0, 0, 0.2);

  @include tablet {
    padding: rem(24);
  }

  &__header {
    margin-bottom: rem(16);
  }

  &__title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: rem(12);
    margin-bottom: rem(6);
  }

  &__title {
    @include font(18, 1.3, 700, $black);
    margin: 0;
  }

  &__progress {
    flex-shrink: 0;
    padding: rem(4) rem(10);
    border-radius: rem(999);
    background: rgba($primary-color, 0.1);
    @include font(12, 1, 700, $primary-color);
  }

  &__desc {
    margin: 0;
    @include font(13, 1.5, 400, $gray-66);
  }

  &__toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: rem(8);
    margin-bottom: rem(12);
  }

  &__tool {
    padding: rem(8) rem(12);
    border-radius: rem(8);
    border: 1px solid $gray-e4;
    background: $white;
    cursor: pointer;
    @include font(13, 1, 600, $gray-44);

    &.is-active {
      border-color: $primary-color;
      background: rgba($primary-color, 0.08);
      color: $primary-color;
    }

    &--secondary {
      font-weight: 500;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__emoji-list {
    display: flex;
    gap: rem(4);
    align-items: center;
  }

  &__emoji-btn {
    width: rem(36);
    height: rem(36);
    border-radius: rem(8);
    border: 1px solid $gray-e4;
    background: $white;
    font-size: rem(18);
    cursor: pointer;

    &.is-active {
      border-color: $primary-color;
      background: rgba($primary-color, 0.08);
    }
  }

  &__canvas-wrap {
    width: 100%;
    display: flex;
    justify-content: center;
    background: #f5f5f4;
    border-radius: rem(12);
    padding: rem(12);
    min-height: rem(200);
  }

  &__canvas {
    max-width: 100%;
    cursor: crosshair;
    border-radius: rem(8);
    touch-action: none;
  }

  &__status {
    margin: rem(10) 0 0;
    @include font(12, 1.5, 400, $gray-66);
  }

  &__secondary-actions {
    display: flex;
    flex-wrap: wrap;
    gap: rem(8) rem(12);
    margin-top: rem(12);
    padding-top: rem(12);
    border-top: 1px solid $gray-e4;
  }

  &__link-btn {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    text-decoration: underline;
    @include font(12, 1.4, 500, $gray-66);

    &:hover:not(:disabled) {
      color: $primary-color;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: rem(8);
    margin-top: rem(16);
  }
}
</style>
