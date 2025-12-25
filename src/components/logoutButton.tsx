import { updateGlobalAuth } from '@/util/globalAuth';
// src/components/LogoutButton.tsx（独立组件，便于复用）
import { useNavigate } from '@modern-js/runtime/router';
import { useState } from 'react';

// 退出登录按钮组件（顶栏专用）
export default function LogoutButton() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // 加载状态，避免重复点击

  // 退出登录核心逻辑
  const handleLogout = () => {
    // 可选：添加确认弹窗，防止误操作
    if (!confirm('确认退出登录？')) return;

    setLoading(true);
    try {
      // 1. 删除本地存储的user_token
      localStorage.removeItem('user_token');
      // 可选：清理其他登录相关字段（如user_id/user_type）
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_type');

      updateGlobalAuth();

      // 2. 跳转到登录页（replace: true 避免回退到原页面）
      navigate('/login', { replace: true });
    } catch (e) {
      alert(`退出失败：${e instanceof Error ? e.message : '未知错误'}`);
      setLoading(false);
    }
  };

  // 极简样式（适配顶栏，可根据需要调整）
  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        marginLeft: '10px',
        padding: '4px 12px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#f5222d',
        color: 'white',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '14px',
      }}
    >
      {loading ? '未登录' : '退出登录'}
    </button>
  );
}
