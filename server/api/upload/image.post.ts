import { defineEventHandler, readFormData, createError } from 'h3'
import { processAndUploadImage } from '~/server/utils/processUploadImage'
import { getUserId } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await getUserId(event)

  const formData = await readFormData(event)
  const file = formData.get('file')
  const folder = formData.get('folder')?.toString() || 'restaurants'

  if (!(file instanceof File) || file.size === 0) {
    throw createError({ statusCode: 400, statusMessage: '이미지 파일이 필요합니다.' })
  }

  const allowedFolders = ['restaurants', 'menus', 'menu-boards', 'reviews']
  if (!allowedFolders.includes(folder)) {
    throw createError({ statusCode: 400, statusMessage: '허용되지 않은 폴더입니다.' })
  }

  try {
    const { url } = await processAndUploadImage(file, folder)
    return { url }
  } catch (error: any) {
    console.error('[Image Upload Error]:', error)
    throw createError({ statusCode: 500, statusMessage: '이미지 업로드 중 오류가 발생했습니다.' })
  }
})
