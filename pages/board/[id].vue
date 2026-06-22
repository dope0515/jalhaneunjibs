<template>
  <section class="post-detail-page">
    <div class="inner">
      <AppTitle
        badge="Board"
        title="운영진에게 한마디"
      />

      <div v-if="pending" class="loading-state">
        <AppLoading />
      </div>
      <div v-else-if="error" class="error-state">
        <p>{{ error.data?.statusMessage || '게시글을 불러올 수 없습니다.' }}</p>
        <AppButton to="/board" variant="outline" color="black" class="mt-4">목록으로 돌아가기</AppButton>
      </div>
      <div v-else-if="post" class="detail-container">
        
        <!-- 글 보기/수정 모드 -->
        <div v-if="isEditingPost" class="post-edit-mode">
          <div class="form-item">
            <AppInput v-model="editPostForm.title" placeholder="제목을 입력해주세요" />
          </div>
          <div class="form-item">
            <textarea v-model="editPostForm.content" class="form-textarea" rows="5" placeholder="내용을 입력해주세요"></textarea>
          </div>
          <div class="form-actions">
            <AppButton color="black" variant="outline" @click="isEditingPost = false">취소</AppButton>
            <AppButton color="green" @click="submitEditPost">저장하기</AppButton>
          </div>
        </div>
        <div v-else>
          <div class="detail-header">
            <div class="detail-header-top">
              <h2 class="detail-title">{{ post.title }}</h2>
              <button v-if="isAuthor" class="btn-ghost edit-btn" @click="startEditPost">수정</button>
            </div>
            <div class="detail-meta">
              <span class="author">작성자: {{ post.user?.nickname || '익명' }}</span>
              <span class="date">{{ formatDate(post.createdAt) }}</span>
            </div>
          </div>
          
          <div class="detail-content">
            {{ post.content }}
          </div>
        </div>

        <!-- 답변 보기/수정 모드 -->
        <div v-if="post.reply && !isEditingReply" class="reply-section">
          <div class="reply-header">
            <span class="reply-badge">운영진 답변</span>
            <button v-if="isAdmin" class="btn-ghost edit-btn" @click="startEditReply">답변 수정</button>
          </div>
          <div class="reply-content">
            {{ post.reply }}
          </div>
        </div>

        <div v-else-if="isAdmin" class="admin-reply-form">
          <h3 class="form-title">{{ isEditingReply ? '답변 수정하기' : '답변 작성하기' }}</h3>
          <textarea v-model="replyContent" class="form-textarea" rows="4" placeholder="답변을 입력하세요."></textarea>
          <div class="form-actions">
            <AppButton v-if="isEditingReply" color="black" variant="outline" @click="isEditingReply = false">취소</AppButton>
            <AppButton color="green" @click="submitReply">{{ isEditingReply ? '답변 저장' : '답변 등록' }}</AppButton>
          </div>
        </div>

        <div class="detail-actions">
          <AppButton to="/board" variant="outline" color="black" shape="round">목록으로</AppButton>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const route = useRoute()
const { $api } = useApi()
const { user } = useAuth()

const postId = route.params.id

const { data, pending, error, refresh } = await useAsyncData(`post-${postId}`, () => 
  $api(`/board/${postId}`)
)

const post = computed(() => data.value?.post || null)
const isAdmin = computed(() => data.value?.isAdmin || false)
const isAuthor = computed(() => post.value?.userId === user.value?.id)

// 글 수정
const isEditingPost = ref(false)
const editPostForm = ref({ title: '', content: '' })

const startEditPost = () => {
  editPostForm.value.title = post.value.title
  editPostForm.value.content = post.value.content
  isEditingPost.value = true
}

const submitEditPost = async () => {
  if (!editPostForm.value.title.trim() || !editPostForm.value.content.trim()) {
    alert('제목과 내용을 모두 입력해주세요.')
    return
  }

  try {
    const res = await $api(`/board/${postId}`, {
      method: 'PUT',
      body: editPostForm.value
    })

    if (res.success) {
      alert('게시글이 수정되었습니다.')
      isEditingPost.value = false
      refresh()
    }
  } catch (e) {
    alert(e.data?.statusMessage || '게시글 수정 중 오류가 발생했습니다.')
  }
}

// 답변 작성/수정
const isEditingReply = ref(false)
const replyContent = ref('')

const startEditReply = () => {
  replyContent.value = post.value.reply || ''
  isEditingReply.value = true
}

const submitReply = async () => {
  if (!replyContent.value.trim()) {
    alert('답변 내용을 입력해주세요.')
    return
  }

  try {
    const res = await $api(`/board/${postId}/reply`, {
      method: 'POST',
      body: { reply: replyContent.value }
    })

    if (res.success) {
      alert(isEditingReply.value ? '답변이 수정되었습니다.' : '답변이 등록되었습니다.')
      replyContent.value = ''
      isEditingReply.value = false
      refresh()
    }
  } catch (e) {
    alert(e.data?.statusMessage || '답변 등록 중 오류가 발생했습니다.')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}
</script>
