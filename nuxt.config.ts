// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  app: {
    head: {
      title: '잘하는 집을 안 가봐서 그래',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '잘하는 집을 안 가봐서 그래 - 맛집 가이드 및 정보 공유 서비스' },
        { property: 'og:title', content: '잘하는 집을 안 가봐서 그래' },
        { property: 'og:description', content: '잘하는집에서 다양한 맛집 정보를 확인하세요.' },
        { property: 'og:type', content: 'website' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  
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

  css: ['./assets/scss/jalhaneunjib.scss'],
  
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
