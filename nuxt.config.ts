// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  nitro: {
    publicAssets: [
      {
        dir: '../public',
        baseURL: '/',
        maxAge: 60 * 60 * 24 * 365, // 1년 캐시
      },
    ],
    compressPublicAssets: true, // 정적 파일 압축
  },
  
  modules: ['@pinia/nuxt', '@nuxt/fonts'],

  typescript: {
    typeCheck: false,
    strict: true
  },

  ssr: true,
  
  fonts: {
    families: [
       { 
        name: 'Noto Sans KR', 
        provider: 'google',
        // 사용할 굵기들을 배열로 적어줍니다.
        weights: [100, 300, 400, 500, 700, 900] 
      },
      { 
        name: 'Noto Serif KR', 
        provider: 'google',
        weights: [300, 400, 700, 900]
      }
    ]
  },

  css: ['./assets/scss/main.scss'],
  
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // 모든 컴포넌트에서 변수를 바로 쓸 수 있게 해줍니다!
          additionalData:  `
            @use "~/assets/scss/abstracts/_variables.scss" as *;
            @use "~/assets/scss/abstracts/_mixins.scss" as *;
          `
        }
      }
    }
  }
})
