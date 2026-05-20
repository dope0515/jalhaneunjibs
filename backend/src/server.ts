import 'dotenv/config'
import app from './app'

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`🚀 Express 서버 실행 중: http://localhost:${PORT}`)
  console.log(`   헬스 체크: http://localhost:${PORT}/health`)
})
