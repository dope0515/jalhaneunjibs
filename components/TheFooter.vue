<template>
  <footer class="footer" id="footer">
    <div class="inner">
      <div class="content">
        <div class="txt-bx">
          <h2 class="title">잘하는 집을<br>안 가봐서 그래</h2>
        </div>
        <nav class="service">
          <p class="service-title">Service</p>
          <ul class="service-list">
            <li class="service-item">
              <NuxtLink to="/" title="잘하는 집 보러가기 페이지로 이동하기" class="service-link">잘하는 집 보러가기</NuxtLink>
            </li>
            <li class="service-item">
              <NuxtLink to="/" title="잘하는 집 알려주기 페이지로 이동하기" class="service-link">잘하는 집 알려주기</NuxtLink>
            </li>
            <li class="service-item">
              <NuxtLink 
              to="/" title="준비중입니다." 
              class="service-link" 
              :disabled="true"
              >메뉴 추천 (준비중입니다.)</NuxtLink>
            </li>
          </ul>
        </nav>
      </div>
      <div class="info">
        <p class="copyright">© 2026 잘하는 집을 안 가봐서 그래. All rights reserved.</p>
      </div>      
    </div>
  </footer>
</template>