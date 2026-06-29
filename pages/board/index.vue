<template>
  <section class="board-page">
    <div class="inner">
      <AppTitle
        badge="Board"
        title="건의·문의"
        desc="운영진에게 바라는 점이나 궁금한 점을 자유롭게 남겨주세요."
      />

      <div class="board-container">
        <!-- 글쓰기 영역 -->
        <div class="write-section">
          <button 
            class="write-toggle-btn" 
            :class="{ 'is-active': isWriting }"
            @click="toggleWrite"
          >
            {{ isWriting ? '작성 취소' : '새 요청 남기기' }}
          </button>

          <Transition name="fade-slide">
            <div v-if="isWriting" class="write-form-wrap">
              <div class="form-item">
                <AppInput v-model="newPost.title" placeholder="제목을 입력해주세요" />
              </div>
              <div class="form-item">
                <textarea 
                  v-model="newPost.content" 
                  class="form-textarea" 
                  placeholder="내용을 입력해주세요"
                  rows="5"
                ></textarea>
              </div>
              <div class="form-actions">
                <AppButton color="green" shape="round" @click="submitPost">등록하기</AppButton>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 목록 영역 -->
        <div class="list-section">
          <div v-if="posts.length === 0" class="empty-state">
            아직 올라온 요청이 없습니다. 첫 번째 요청을 남겨보세요!
          </div>
          <div v-else class="post-list">
            <NuxtLink v-for="post in posts" :key="post.id" :to="`/board/${post.id}`" class="post-card" :class="{'has-reply': post.reply}">
              <div class="post-header">
                <div class="title-wrap">
                  <span v-if="post.reply" class="reply-badge">답변 완료</span>
                  <span v-else class="reply-badge waiting">답변 대기</span>
                  <h3 class="post-title">{{ post.title }}</h3>
                </div>
                <span class="post-date">{{ formatDate(post.createdAt) }}</span>
              </div>
              <p class="post-content">{{ post.content }}</p>
              <div class="post-footer">
                <span class="post-author">작성자: {{ post.user?.nickname || '익명' }}</span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { $api } = useApi()
const { isLoggedIn } = useAuth()

const posts = ref([])
const isWriting = ref(false)
const newPost = ref({
  title: '',
  content: ''
})

const toggleWrite = () => {
  if (!isLoggedIn.value) {
    alert('로그인 후 이용 가능합니다.')
    navigateTo('/login')
    return
  }
  isWriting.value = !isWriting.value
}

const fetchPosts = async () => {
  // 로그인 안된 상태면 안불러옴
  if(!isLoggedIn.value) return;
  const data = await $api('/board')
  if (data.success) {
    posts.value = data.posts
  }
}

// 로그인 상태 변경 감지해서 목록 갱신
watch(isLoggedIn, (newVal) => {
  if(newVal) fetchPosts()
  else posts.value = []
})

const submitPost = async () => {
  if (!isLoggedIn.value) {
    alert('로그인 후 이용 가능합니다.')
    navigateTo('/login')
    return
  }

  if (!newPost.value.title.trim() || !newPost.value.content.trim()) {
    alert('제목과 내용을 모두 입력해주세요.')
    return
  }

  try {
    const data = await $api('/board', {
      method: 'POST',
      body: newPost.value
    })

    if (data.success) {
      alert('요청이 등록되었습니다.')
      newPost.value = { title: '', content: '' }
      isWriting.value = false
      fetchPosts()
    }
  } catch (e) {
    alert(e.data?.statusMessage || '등록 중 오류가 발생했습니다.')
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  fetchPosts()
})
</script>
