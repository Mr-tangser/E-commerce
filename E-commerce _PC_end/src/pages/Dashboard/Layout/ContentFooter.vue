<template>
  <footer class="footer">
    <div class="container">
      <nav>
        <ul>
          <li>
            <a href="#" @click.prevent>
              首页
            </a>
          </li>
          <li>
            <a href="#" @click.prevent>
              关于我们
            </a>
          </li>
          <li>
            <a href="#" @click.prevent>
              帮助中心
            </a>
          </li>
          <li>
            <a href="#" @click.prevent>
              联系我们
            </a>
          </li>
        </ul>
      </nav>
      <div class="copyright text-center">
        &copy; {{ new Date().getFullYear() }} 全品汇电商管理平台
        <i class="fa fa-heart heart"></i>
        版权所有
      </div>
    </div>
  </footer>
</template>
<script>
export default {};
</script>
<style></style>
