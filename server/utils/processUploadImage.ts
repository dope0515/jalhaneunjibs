import { uploadBufferToCloudinary } from '~/server/utils/cloudinary'

export async function processAndUploadImage(file: File, folder: string) {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const url = await uploadBufferToCloudinary(buffer, folder)
  return { url }
}
