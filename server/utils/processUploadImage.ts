import { blurFacesInImageBuffer } from '~/server/utils/faceBlur'
import { uploadBufferToCloudinary } from '~/server/utils/cloudinary'

export async function processAndUploadImage(file: File, folder: string) {
  const arrayBuffer = await file.arrayBuffer()
  const input = Buffer.from(arrayBuffer)
  const { buffer, faceCount } = await blurFacesInImageBuffer(input)
  const url = await uploadBufferToCloudinary(buffer, folder)
  return { url, faceCount }
}
