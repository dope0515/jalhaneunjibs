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
  plan: string | null
  lastUpdated: string | null
  storageBytes: number | null
  storageCreditsUsage: number | null
  storageLimitBytes: number | null
  creditsUsed: number | null
  creditsLimit: number | null
  creditsUsedPercent: number | null
  bandwidthBytes: number | null
  bandwidthCreditsUsage: number | null
  resourceCount: number | null
  derivedResourceCount: number | null
}

/** Cloudinary 계정 사용량(스토리지/크레딧/대역폭)을 조회한다. */
export const getCloudinaryUsage = async (): Promise<CloudinaryUsage> => {
  const usage: any = await cloudinary.api.usage()

  return {
    plan: usage?.plan ?? null,
    lastUpdated: usage?.last_updated ?? null,
    storageBytes: usage?.storage?.usage ?? null,
    storageCreditsUsage: usage?.storage?.credits_usage ?? null,
    storageLimitBytes: usage?.storage?.limit ?? null,
    creditsUsed: usage?.credits?.usage ?? null,
    creditsLimit: usage?.credits?.limit ?? null,
    creditsUsedPercent: usage?.credits?.used_percent ?? null,
    bandwidthBytes: usage?.bandwidth?.usage ?? null,
    bandwidthCreditsUsage: usage?.bandwidth?.credits_usage ?? null,
    resourceCount: usage?.resources ?? null,
    derivedResourceCount: usage?.derived_resources ?? null,
  }
}
