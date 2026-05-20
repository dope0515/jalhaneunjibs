/**
 * 전역 로딩 상태 관리 컴포저블
 *
 * 특정 API 호출이나 비동기 작업을 로딩 오버레이와 함께 실행할 때 사용합니다.
 *
 * 사용법:
 *   const { withLoading } = useLoading()
 *   await withLoading(async () => {
 *     await $api('/some/endpoint', { method: 'POST', body: data })
 *   })
 */

const globalLoading = ref(false)

export const useLoading = () => {
  const isLoading = readonly(globalLoading)

  const show = () => { globalLoading.value = true }
  const hide = () => { globalLoading.value = false }

  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    show()
    try {
      return await fn()
    } finally {
      hide()
    }
  }

  return { isLoading, show, hide, withLoading }
}
