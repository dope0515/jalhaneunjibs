import imageCompression from 'browser-image-compression'

export const MAX_RESTAURANT_IMAGES = 5
export const MAX_MENU_BOARD_IMAGES = 5

export const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  initialQuality: 0.85,
}

export async function compressImageFile(file, options = IMAGE_COMPRESSION_OPTIONS) {
  if (!file?.type?.startsWith('image/')) return file
  try {
    return await imageCompression(file, options)
  } catch (error) {
    console.error('Image compression error:', error)
    return file
  }
}

/**
 * 이미지 파일 하나를 서버에 업로드하고 URL을 반환합니다.
 * @param {File} file
 * @param {string} folder - 'restaurants' | 'menus'
 * @param {Function} $api - useApi()의 $api
 * @returns {Promise<string>} Cloudinary URL
 */
export async function uploadImage(file, folder, $api) {
  const compressed = await compressImageFile(file)
  const fd = new FormData()
  fd.append('file', compressed)
  fd.append('folder', folder)
  const { url } = await $api('/upload/image', { method: 'POST', body: fd })
  return url
}

/**
 * 파일 배열을 순차적으로 하나씩 업로드합니다.
 * @param {File[]} files
 * @param {string} folder
 * @param {Function} $api
 * @param {Function} onProgress - (uploadedCount, totalCount) => void
 * @returns {Promise<string[]>} URL 배열
 */
export async function uploadImagesSequentially(files, folder, $api, onProgress) {
  const urls = []
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, files.length)
    const url = await uploadImage(files[i], folder, $api)
    urls.push(url)
  }
  onProgress?.(files.length, files.length)
  return urls
}

export function getUploadErrorMessage(error, fallback = '오류가 발생했습니다.') {
  const status = error?.status || error?.statusCode || error?.response?.status
  if (status === 413) {
    return '업로드 용량이 너무 큽니다. 이미지 용량이 작은 사진을 사용해주세요.'
  }
  return error?.data?.statusMessage || error?.message || fallback
}
