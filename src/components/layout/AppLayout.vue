<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import {
  Collection,
  DataAnalysis,
  House,
  OfficeBuilding,
  User,
  SetUp,
} from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const items = [
  { index: '/', label: 'Dashboard', icon: DataAnalysis },
  { index: '/db-features', label: 'Database Features', icon: Collection },
  { index: '/khach-hang', label: 'Khách Hàng', icon: User },
  { index: '/loai-phong', label: 'Loại Phòng', icon: OfficeBuilding },
  { index: '/phong', label: 'Phòng', icon: House },
  { index: '/procedure-demo', label: 'Demo Stored Procedure', icon: SetUp },
]

function onSelect(index: string) {
  router.push(index)
}
</script>

<template>
  <div class="app-bg">
    <el-container class="app-shell">
      <el-aside width="280px" class="aside">
        <div class="brand">
          <div class="brand-mark">QL</div>
          <div class="brand-text">
            <div class="title">QL Đặt Phòng</div>
            <div class="subtitle">Frontend báo cáo CSDL</div>
          </div>
        </div>

        <el-menu
          :default-active="String(route.path)"
          class="menu"
          background-color="transparent"
          text-color="#cbd5e1"
          active-text-color="#ffffff"
          @select="onSelect"
        >
          <el-menu-item v-for="it in items" :key="it.index" :index="it.index">
            <el-icon><component :is="it.icon" /></el-icon>
            <span>{{ it.label }}</span>
          </el-menu-item>
        </el-menu>

        <div class="aside-footer">
          <div class="muted">API base URL</div>
          <div class="api">{{ apiBaseUrl }}</div>
        </div>
      </el-aside>

      <el-container>
        <el-header class="header">
          <div class="header-left">
            <div class="page-title">{{ route.meta?.title ?? route.name }}</div>
            <el-breadcrumb separator="/" class="breadcrumb">
              <el-breadcrumb-item>QL Đặt Phòng</el-breadcrumb-item>
              <el-breadcrumb-item>{{ route.meta?.title ?? route.name }}</el-breadcrumb-item>
            </el-breadcrumb>
          </div>
          <div class="header-right">
            <el-tag effect="plain" type="info">Connected</el-tag>
          </div>
        </el-header>

        <el-main class="main">
          <slot />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.app-bg {
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 10% 0%, rgba(99, 102, 241, 0.12), transparent 55%),
    radial-gradient(900px 500px at 90% 10%, rgba(16, 185, 129, 0.10), transparent 50%),
    #f6f7fb;
}

.app-shell {
  min-height: 100vh;
}

.aside {
  background: linear-gradient(180deg, #0b1220, #0f172a);
  border-right: 1px solid rgba(148, 163, 184, 0.12);
  display: flex;
  flex-direction: column;
}

.brand {
  padding: 16px 16px 14px;
  display: flex;
  gap: 12px;
  align-items: center;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: white;
  font-weight: 800;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #6366f1, #22c55e);
}

.brand-text .title {
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
}

.brand-text .subtitle {
  font-size: 12px;
  color: rgba(203, 213, 225, 0.75);
  margin-top: 2px;
}

.menu {
  padding: 10px 10px 0;
  border-right: none;
  flex: 1;
}

.menu :deep(.el-menu-item) {
  border-radius: 10px;
  margin: 4px 0;
}

.menu :deep(.el-menu-item.is-active) {
  background: rgba(99, 102, 241, 0.16);
}

.aside-footer {
  padding: 12px 14px;
  border-top: 1px solid rgba(148, 163, 184, 0.12);
}

.aside-footer .muted {
  color: rgba(203, 213, 225, 0.7);
  font-size: 12px;
}

.aside-footer .api {
  color: rgba(255, 255, 255, 0.88);
  font-size: 12px;
  margin-top: 4px;
  word-break: break-all;
}

.header {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.page-title {
  font-weight: 800;
  color: #0f172a;
}

.breadcrumb {
  margin-top: 2px;
}

.header-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

.main {
  padding: 18px;
}
</style>
