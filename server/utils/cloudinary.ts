import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadToCloudinary = async (file: File, folder: string): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return uploadBufferToCloudinary(buffer, folder)
}

export const uploadBufferToCloudinary = async (buffer: Buffer, folder: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `jalhaneunjib/${folder}` }, (error, result) => {
        if (error) reject(error)
        else resolve(result?.secure_url || '')
      })
      .end(buffer)
  })
}

export interface CloudinaryUsage {
  storageBytes: number | null
  storageLimitBytes: number | null
  creditsUsed: number | null
  creditsLimit: number | null
  creditsUsedPercent: number | null
  bandwidthBytes: number | null
  resourceCount: number | null
}

/** Cloudinary 계정 사용량(스토리지/크레딧/대역폭)을 조회한다. */
export const getCloudinaryUsage = async (): Promise<CloudinaryUsage> => {
  const usage: any = await cloudinary.api.usage()

  return {
    storageBytes: usage?.storage?.usage ?? null,
    storageLimitBytes: usage?.storage?.limit ?? null,
    creditsUsed: usage?.credits?.usage ?? null,
    creditsLimit: usage?.credits?.limit ?? null,
    creditsUsedPercent: usage?.credits?.used_percent ?? null,
    bandwidthBytes: usage?.bandwidth?.usage ?? null,
    resourceCount: usage?.resources ?? null,
  }
}
