// src/utils/globalAuth.ts（必须确保 export 关键字存在）
// 1. 全局登录状态（初始值从localStorage读取）
export let globalIsLogin = !!localStorage.getItem('user_token');

// 2. 自定义事件名（常量，内部用）
const AUTH_CHANGE_EVENT = 'authChange';

// 3. 核心：导出更新全局状态的方法（必须加 export！）
export function updateGlobalAuth() {
  // 刷新全局登录状态
  globalIsLogin = !!localStorage.getItem('user_token');
  // 触发自定义事件，通知Layout更新按钮
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
}

// 4. 导出监听状态变化的方法（给Layout用）
export function onAuthChange(callback: () => void) {
  window.addEventListener(AUTH_CHANGE_EVENT, callback);
  // 返回清理函数，防止内存泄漏
  return () => window.removeEventListener(AUTH_CHANGE_EVENT, callback);
}
