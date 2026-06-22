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
              <NuxtLink to="/restaurants" title="맛집 찾기 페이지로 이동하기" class="service-link">맛집 찾기</NuxtLink>
            </li>
            <li class="service-item">
              <NuxtLink to="/restaurants/register" title="맛집 제보 페이지로 이동하기" class="service-link">맛집 제보</NuxtLink>
            </li>
            <li class="service-item">
              <NuxtLink to="/recommend" title="맛집 추천 페이지로 이동하기" class="service-link">맛집 추천</NuxtLink>
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