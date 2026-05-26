// src/router/index.ts - Vue Router configuration

import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Runtime',
    component: () => import('@/views/RuntimeView.vue'),
    meta: { title: 'HMI Runtime' }
  },
  {
    path: '/error',
    name: 'Error',
    component: () => import('@/views/ErrorView.vue'),
    meta: { title: 'Error' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Global navigation guard
router.beforeEach((to, from, next) => {
  // Set page title
  if (to.meta.title) {
    document.title = to.meta.title as string
  }

  next()
})

export default router
