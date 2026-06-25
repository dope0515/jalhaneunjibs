import imageCompression from 'browser-image-compression'

/** Vercel 등 서버리스 환경 요청 본문 제한에 맞춘 값 */
export const MAX_TOTAL_UPLOAD_BYTES = 4 * 1024 * 1024
export const MAX_RESTAURANT_IMAGES = 5
export const MAX_MENU_BOARD_IMAGES = 5

export const IMAGE_COMPRESSION_OPTIONS = {
  maxSizeMB: 0.4,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  initialQuality: 0.85,
}

export function getFilesTotalBytes(files) {
  return files.reduce((sum, file) => sum + (file?.size || 0), 0)
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

export async function compressImageFiles(files, options = IMAGE_COMPRESSION_OPTIONS) {
  const compressed = []
  for (const file of files) {
    compressed.push(await compressImageFile(file, options))
  }
  return compressed
}

export function validateTotalUploadSize(files, maxBytes = MAX_TOTAL_UPLOAD_BYTES) {
  const total = getFilesTotalBytes(files)
  if (total <= maxBytes) return { ok: true }

  const maxMB = (maxBytes / 1024 / 1024).toFixed(1)
  const currentMB = (total / 1024 / 1024).toFixed(1)

  return {
    ok: false,
    message: `업로드 이미지 용량이 ${currentMB}MB로 제한(${maxMB}MB)을 초과했습니다. 이미지 수를 줄이거나 용량이 작은 사진을 사용해주세요.`,
  }
}

export function getUploadErrorMessage(error, fallback) {
  const status = error?.status || error?.statusCode || error?.response?.status

  if (status === 413) {
    return '업로드 용량이 너무 큽니다. 이미지 수를 줄이거나 용량이 작은 사진을 사용해주세요.'
  }

  return error?.data?.statusMessage || error?.message || fallback
}
