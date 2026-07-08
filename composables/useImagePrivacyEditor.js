import { nextTick } from 'vue'
import { autoBlurImageFile } from '~/utils/imagePrivacy'

export function useImagePrivacyEditor() {
  const editorOpen = ref(false)
  const pendingFile = ref(null)
  const queue = ref([])
  const batchTotal = ref(0)
  const batchProcessed = ref(0)
  const autoBlurMode = ref(false)

  let activeResolver = null

  const batchCurrentIndex = computed(() =>
    batchTotal.value > 0 ? batchProcessed.value + 1 : 1,
  )

  const isLastInBatch = computed(() =>
    batchTotal.value > 0 ? batchProcessed.value + 1 >= batchTotal.value : true,
  )

  const batchRemainingAfterCurrent = computed(() =>
    Math.max(0, batchTotal.value - batchProcessed.value - 1),
  )

  const resetBatch = () => {
    batchTotal.value = 0
    batchProcessed.value = 0
    autoBlurMode.value = false
  }

  const closeEditor = () => {
    editorOpen.value = false
    pendingFile.value = null
  }

  const processNext = async () => {
    await nextTick()

    if (autoBlurMode.value && queue.value.length > 0) {
      const next = queue.value.shift()
      try {
        const blurred = await autoBlurImageFile(next.file)
        batchProcessed.value += 1
        next.resolve(blurred)
      } catch {
        next.reject(new Error('auto-blur-failed'))
      }
      await processNext()
      return
    }

    if (autoBlurMode.value && queue.value.length === 0) {
      return
    }

    if (editorOpen.value || queue.value.length === 0) {
      return
    }

    const next = queue.value.shift()
    pendingFile.value = next.file
    activeResolver = next
    editorOpen.value = true
  }

  const finishCurrent = (result) => {
    activeResolver?.resolve(result)
    activeResolver = null
    batchProcessed.value += 1
    closeEditor()
    processNext()
  }

  const enqueueFile = (file) =>
    new Promise((resolve, reject) => {
      queue.value.push({ file, resolve, reject })
      processNext()
    })

  /** 여러 파일을 순서대로 편집하고 처리된 File[] 반환 */
  const enqueueFiles = async (files) => {
    if (!files.length) return []

    batchTotal.value = files.length
    batchProcessed.value = 0
    const results = []

    for (const file of files) {
      try {
        const processed = await enqueueFile(file)
        results.push(processed)
      } catch (error) {
        if (error?.message === 'cancelled-all') {
          break
        }
        // 단일 건너뛰기 — 다음 파일 계속
      }
    }

    queue.value = []
    closeEditor()
    autoBlurMode.value = false
    resetBatch()
    return results
  }

  const onEditorConfirm = (processedFile) => {
    finishCurrent(processedFile)
  }

  /** 이 사진은 추가하지 않음 */
  const onEditorSkip = () => {
    activeResolver?.reject(new Error('skipped'))
    activeResolver = null
    batchProcessed.value += 1
    closeEditor()
    processNext()
  }

  /** 자동 얼굴 가림 후 추가 */
  const onEditorAutoBlur = async () => {
    if (!pendingFile.value) return
    try {
      const blurred = await autoBlurImageFile(pendingFile.value)
      finishCurrent(blurred)
    } catch {
      alert('자동 가림 처리에 실패했습니다. 직접 영역을 지정해 주세요.')
    }
  }

  /** 현재 + 남은 사진 모두 자동 가림 */
  const onEditorAutoBlurRemaining = async () => {
    if (!pendingFile.value) return
    autoBlurMode.value = true
    try {
      const blurred = await autoBlurImageFile(pendingFile.value)
      finishCurrent(blurred)
    } catch {
      autoBlurMode.value = false
      alert('자동 가림 처리에 실패했습니다.')
    }
  }

  /** 배치 전체 취소 */
  const onEditorCancelAll = () => {
    activeResolver?.reject(new Error('cancelled-all'))
    activeResolver = null
    queue.value.forEach((item) => item.reject(new Error('cancelled-all')))
    queue.value = []
    closeEditor()
    resetBatch()
  }

  /** 폼 초기화 등에서 에디터 상태를 완전히 리셋할 때 사용 */
  const reset = () => {
    activeResolver = null
    queue.value = []
    closeEditor()
    resetBatch()
  }

  return {
    editorOpen,
    pendingFile,
    batchCurrentIndex,
    batchTotal,
    batchRemainingAfterCurrent,
    isLastInBatch,
    enqueueFile,
    enqueueFiles,
    onEditorConfirm,
    onEditorSkip,
    onEditorAutoBlur,
    onEditorAutoBlurRemaining,
    onEditorCancelAll,
    reset,
  }
}
