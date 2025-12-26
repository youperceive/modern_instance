import { onAuthChange } from '@/util/globalAuth';
import { Outlet } from '@modern-js/runtime/router';
import { useEffect, useState } from 'react';
// 导入退出登录按钮
import LogoutButton from 'src/components/logoutButton';
// 导入订单/首页切换按钮（路径和命名保持和logoutButton一致）
import OrderNavButton from 'src/components/orderDetailButton';

export default function RootLayout() {
  // 控制退出按钮的显示：仅当有user_token时显示
  const [showLogout, setShowLogout] = useState(false);

  useEffect(() => {
    // 方法1：监听浏览器storage事件（跨页面修改localStorage必触发）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_token') {
        const newToken = e.newValue;
        setShowLogout(!!newToken);
        console.log('Layout-storage事件：', !!newToken);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    // 方法2：同页面修改localStorage不触发storage事件，加个短轮询兜底（测试阶段用）
    const pollTimer = setInterval(() => {
      const currentToken = localStorage.getItem('user_token');
      if (!!currentToken !== showLogout) {
        setShowLogout(!!currentToken);
        console.log('Layout-轮询更新：', !!currentToken);
      }
    }, 100); // 每100ms检查一次，用户无感知

    // 清理监听和定时器
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollTimer);
    };
  }, [showLogout]);

  return (
    <div
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {/* 全局顶栏：包含订单按钮 + 退出登录按钮（仅登录后显示） */}
      <header
        style={{
          padding: '10px 20px',
          backgroundColor: '#f8f8f8',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'flex-end', // 按钮靠右显示
          alignItems: 'center',
          gap: '10px', // 按钮之间增加间距（替代marginLeft，更优雅）
        }}
      >
        {/* 订单/首页切换按钮：始终显示（无需登录） */}
        <OrderNavButton />
        {/* 退出登录按钮：仅登录后显示（和原有逻辑一致） */}
        {showLogout && <LogoutButton />}
      </header>

      {/* 页面主体内容：嵌套所有子路由（/merchant/product、/customer、/login等） */}
      <main style={{ flex: 1, padding: '20px' }}>
        <Outlet /> {/* 核心：渲染当前匹配的子路由组件 */}
      </main>
    </div>
  );
}
