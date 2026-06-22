<template>
  <section class="taster-page">
    <AppLoading :loading="isSubmitting" message="기미상궁 요청을 등록하고 있습니다..." />

    <div class="inner">
      <AppTitle
        badge="Taster"
        title="기미상궁"
        desc="맛집이 등록되지 않아 아쉬우셨나요? 누가 먼저 가봐줬으면 하는 곳을 알려주세요!"
      />

      <div class="taster-content">
        <!-- 등록 폼 토글 버튼 -->
        <div class="action-bar">
          <AppButton 
            :variant="isWriting ? 'outline' : 'fill'" 
            color="green" 
            shape="round" 
            @click="isWriting = !isWriting"
          >
            {{ isWriting ? '목록으로 돌아가기' : '나도 요청하기' }}
          </AppButton>
        </div>

        <!-- 등록 폼 -->
        <Transition name="fade-slide">
          <div v-if="isWriting" class="form-wrap">
            <form @submit.prevent="handleSubmit">
              <div class="form-container">
                <div class="form-fields">
                  <div class="form-item">
                    <label for="name" class="form-item-label">식당 이름</label>
                    <AppInput v-model="form.name" id="name" placeholder="추천하고 싶은 식당 이름" required />
                  </div>
                  <div class="form-item">
                    <label for="address" class="form-item-label">위치/주소 (선택)</label>
                    <AppInput v-model="form.address" id="address" placeholder="대략적인 위치나 주소" />
                  </div>
                  <div class="form-item">
                    <label class="form-item-label">카테고리</label>
                    <div class="category-group">
                      <AppButton 
                        v-for="cat in categories" :key="cat" type="button"
                        :variant="form.category === cat ? 'fill' : 'outline'"
                        :color="form.category === cat ? 'green' : 'black'"
                        shape="round" size="sm" @click="form.category = cat"
                      >
                        {{ cat }}
                      </AppButton>
                    </div>
                  </div>
                  <div class="form-item">
                    <label for="reason" class="form-item-label">추천 이유</label>
                    <textarea v-model="form.description" id="reason" class="form-textarea" placeholder="왜 이곳이 궁금한가요?" rows="4" required></textarea>
                  </div>
                </div>
                <div class="form-actions">
                  <AppButton type="submit" color="green" shape="round">요청 등록하기</AppButton>
                </div>
              </div>
            </form>
          </div>
        </Transition>

        <!-- 목록 영역 -->
        <div v-if="!isWriting" class="list-section">
          <div v-if="tasterList.length === 0" class="empty-state">
            아직 올라온 기미상궁 요청이 없습니다.
          </div>
          <div v-else class="taster-grid">
            <div v-for="item in tasterList" :key="item.id" class="taster-card">
              <div class="card-header">
                <span class="category">{{ item.foodCategory }}</span>
                <h3 class="name">{{ item.name }}</h3>
              </div>
              <p class="address">{{ item.address }}</p>
              <p class="description">{{ item.description }}</p>
              <div class="card-footer">
                <span class="date">{{ formatDate(item.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { $api } = useApi()
const { isLoggedIn } = useAuth()

const categories = ['한식', '중식', '일식', '양식', '카페', '주점', '분식', '아시아음식']
const isWriting = ref(false)
const isSubmitting = ref(false)
const tasterList = ref([])

const form = ref({
  name: '',
  address: '',
  category: '',
  description: '',
  image: null
})

const fetchTasterList = async () => {
  try {
    const data = await $api('/restaurants', {
      query: { status: 'TASTER' }
    })
    tasterList.value = data.restaurants
  } catch (e) {
    console.error('Failed to fetch taster list')
  }
}

const handleSubmit = async () => {
  if (!isLoggedIn.value) {
    alert('로그인 후 이용 가능합니다.')
    navigateTo('/login')
    return
  }

  isSubmitting.value = true

  try {
    const formData = new FormData()
    formData.append('name', form.value.name)
    formData.append('address', form.value.address || '주소 미상')
    formData.append('category', form.value.category)
    formData.append('description', form.value.description)
    formData.append('status', 'TASTER')

    const data = await $api('/restaurants/register', {
      method: 'POST',
      body: formData
    })

    if (data.success) {
      alert('등록되었습니다!')
      isWriting.value = false
      fetchTasterList()
      form.value = { name: '', address: '', category: '', description: '', image: null }
    }
  } catch (e) {
    alert(e.data?.statusMessage || '오류 발생')
  } finally {
    isSubmitting.value = false
  }
}

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  fetchTasterList()
})
</script>

<style lang="scss" scoped>
.taster-page {
  padding-block: rem(60);

  .action-bar {
    margin-top: rem(32);
    display: flex;
    justify-content: flex-end;
  }

  .form-wrap {
    margin-top: rem(24);
    background-color: $white;
    border: 1px solid $primary-color;
    border-radius: rem(24);
    padding: rem(32);
  }

  .form-item {
    margin-bottom: rem(24);
    &-label {
      display: block;
      @include font(16, 1, 700);
      margin-bottom: rem(8);
    }
  }

  .category-group {
    display: flex;
    flex-wrap: wrap;
    gap: rem(8);
  }

  .form-textarea {
    width: 100%;
    padding: rem(12);
    border: 1px solid $gray-e4;
    border-radius: rem(8);
    resize: none;
    outline: none;
    &:focus { border-color: $primary-color; }
  }

  .form-actions {
    display: flex;
    justify-content: center;
    margin-top: rem(24);
  }

  .list-section {
    margin-top: rem(40);
  }

  .taster-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: rem(20);
    @include tablet { grid-template-columns: repeat(2, 1fr); }
    @include desktop { grid-template-columns: repeat(3, 1fr); }
  }

  .taster-card {
    padding: rem(24);
    background-color: $white;
    border: 1px solid $gray-e4;
    border-radius: rem(16);
    display: flex;
    flex-direction: column;

    .category {
      @include font(13, 1, 500, $primary-color);
      margin-bottom: rem(4);
    }

    .name {
      @include font(18, 1.3, 700, $black);
      margin-bottom: rem(12);
    }

    .address {
      @include font(14, 1.4, 400, $gray-66);
      margin-bottom: rem(12);
    }

    .description {
      @include font(15, 1.6, 400, $gray-44);
      margin-bottom: rem(16);
      flex: 1;
    }

    .card-footer {
      border-top: 1px solid $gray-f0;
      padding-top: rem(12);
      @include font(13, 1, 400, $gray-99);
    }
  }

  .empty-state {
    text-align: center;
    padding-block: rem(100);
    @include font(16, 1, 400, $gray-99);
    background-color: $gray-f9;
    border-radius: rem(24);
  }
}

.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from, .fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
