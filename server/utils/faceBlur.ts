import sharp from 'sharp'

type FaceBox = { left: number; top: number; width: number; height: number }

let blazeFaceModel: Awaited<ReturnType<typeof loadBlazeFaceModel>> | null = null

async function loadBlazeFaceModel() {
  const tf = await import('@tensorflow/tfjs-node')
  const blazeface = await import('@tensorflow-models/blazeface')
  return blazeface.load()
}

async function getBlazeFaceModel() {
  if (!blazeFaceModel) {
    blazeFaceModel = await loadBlazeFaceModel()
  }
  return blazeFaceModel
}

function clampBox(
  left: number,
  top: number,
  width: number,
  height: number,
  imgW: number,
  imgH: number,
): FaceBox {
  const l = Math.max(0, Math.floor(left))
  const t = Math.max(0, Math.floor(top))
  const r = Math.min(imgW, Math.ceil(left + width))
  const b = Math.min(imgH, Math.ceil(top + height))
  return {
    left: l,
    top: t,
    width: Math.max(1, r - l),
    height: Math.max(1, b - t),
  }
}

function expandBox(box: FaceBox, imgW: number, imgH: number, paddingRatio = 0.18): FaceBox {
  const padX = box.width * paddingRatio
  const padY = box.height * paddingRatio
  return clampBox(box.left - padX, box.top - padY, box.width + padX * 2, box.height + padY * 2, imgW, imgH)
}

async function mosaicRegion(input: Buffer, box: FaceBox): Promise<Buffer> {
  const pixelSize = 10
  return sharp(input)
    .extract(box)
    .resize(
      Math.max(1, Math.floor(box.width / pixelSize)),
      Math.max(1, Math.floor(box.height / pixelSize)),
      { kernel: sharp.kernel.nearest },
    )
    .resize(box.width, box.height, { kernel: sharp.kernel.nearest })
    .png()
    .toBuffer()
}

export async function blurFacesInImageBuffer(
  input: Buffer,
): Promise<{ buffer: Buffer; faceCount: number }> {
  const metadata = await sharp(input).metadata()
  const imgW = metadata.width ?? 0
  const imgH = metadata.height ?? 0

  if (!imgW || !imgH) {
    return { buffer: input, faceCount: 0 }
  }

  try {
    const tf = await import('@tensorflow/tfjs-node')
    const model = await getBlazeFaceModel()
    const tensor = tf.node.decodeImage(input, 3)
    const predictions = await model.estimateFaces(tensor as never, false)
    tensor.dispose()

    if (!predictions?.length) {
      return { buffer: input, faceCount: 0 }
    }

    const composites: sharp.OverlayOptions[] = []

    for (const face of predictions) {
      const [x1, y1] = face.topLeft as [number, number]
      const [x2, y2] = face.bottomRight as [number, number]
      const box = expandBox(
        clampBox(x1, y1, x2 - x1, y2 - y1, imgW, imgH),
        imgW,
        imgH,
      )
      const mosaic = await mosaicRegion(input, box)
      composites.push({ input: mosaic, left: box.left, top: box.top })
    }

    const outputFormat = metadata.format === 'png' ? 'png' : 'jpeg'
    const buffer =
      outputFormat === 'png'
        ? await sharp(input).composite(composites).png().toBuffer()
        : await sharp(input).composite(composites).jpeg({ quality: 90 }).toBuffer()

    return { buffer, faceCount: predictions.length }
  } catch (error) {
    console.error('[faceBlur] detection failed, using original image:', error)
    return { buffer: input, faceCount: 0 }
  }
}
