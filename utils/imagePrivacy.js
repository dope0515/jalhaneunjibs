const EMOJI_OPTIONS = ['😀', '🙂', '😎', '🐻', '🎭', '🙈']

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function applyPixelateRegion(ctx, x, y, width, height) {
  const canvas = ctx.canvas
  const tmp = document.createElement('canvas')
  tmp.width = width
  tmp.height = height
  const tctx = tmp.getContext('2d')
  tctx.drawImage(canvas, x, y, width, height, 0, 0, width, height)

  const pixelSize = 12
  const small = document.createElement('canvas')
  small.width = Math.max(1, Math.floor(width / pixelSize))
  small.height = Math.max(1, Math.floor(height / pixelSize))
  const sctx = small.getContext('2d')
  sctx.imageSmoothingEnabled = false
  sctx.drawImage(tmp, 0, 0, small.width, small.height)

  tctx.clearRect(0, 0, width, height)
  tctx.imageSmoothingEnabled = false
  tctx.drawImage(small, 0, 0, width, height)
  ctx.drawImage(tmp, 0, 0, width, height, x, y, width, height)
}

export function applyEmojiRegion(ctx, x, y, width, height, emoji) {
  const size = Math.min(width, height) * 0.85
  ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, x + width / 2, y + height / 2 + size * 0.05)
}

export async function detectFacesFromImage(imageUrl) {
  if (import.meta.server) return []

  const tf = await import('@tensorflow/tfjs')
  await import('@tensorflow/tfjs-backend-webgl')
  await tf.setBackend('webgl')
  await tf.ready()

  const blazeface = await import('@tensorflow-models/blazeface')
  const model = await blazeface.load()
  const img = await loadImageElement(imageUrl)
  const predictions = await model.estimateFaces(img, false)

  return (predictions || []).map((face) => {
    const [x1, y1] = face.topLeft
    const [x2, y2] = face.bottomRight
    const w = x2 - x1
    const h = y2 - y1
    const pad = 0.18
    return {
      x: x1 - w * pad,
      y: y1 - h * pad,
      width: w * (1 + pad * 2),
      height: h * (1 + pad * 2),
      type: 'blur',
    }
  })
}

export async function renderPrivacyImage(sourceFile, masks = []) {
  const objectUrl = URL.createObjectURL(sourceFile)
  try {
    const img = await loadImageElement(objectUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)

    for (const mask of masks) {
      const x = clamp(Math.floor(mask.x), 0, canvas.width - 1)
      const y = clamp(Math.floor(mask.y), 0, canvas.height - 1)
      const width = clamp(Math.floor(mask.width), 1, canvas.width - x)
      const height = clamp(Math.floor(mask.height), 1, canvas.height - y)

      if (mask.type === 'emoji') {
        applyEmojiRegion(ctx, x, y, width, height, mask.emoji || '🙂')
      } else {
        applyPixelateRegion(ctx, x, y, width, height)
      }
    }

    const mime = sourceFile.type?.startsWith('image/') ? sourceFile.type : 'image/jpeg'
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92))
    if (!blob) throw new Error('이미지 처리에 실패했습니다.')

    const ext = mime.includes('png') ? 'png' : 'jpg'
    const fileName = sourceFile.name.replace(/\.[^.]+$/, '') || 'image'
    return new File([blob], `${fileName}-privacy.${ext}`, { type: mime })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function autoBlurImageFile(sourceFile) {
  const objectUrl = URL.createObjectURL(sourceFile)
  try {
    const faces = await detectFacesFromImage(objectUrl)
    return renderPrivacyImage(sourceFile, faces)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export { EMOJI_OPTIONS }
