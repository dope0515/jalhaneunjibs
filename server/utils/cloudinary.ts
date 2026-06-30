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
