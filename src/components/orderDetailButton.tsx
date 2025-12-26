// src/components/OrderNavButton.tsx（独立组件，便于复用）
import { useNavigate } from '@modern-js/runtime/router';
import { useState } from 'react';

// 订单/首页切换按钮（顶栏专用）
export default function OrderNavButton() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false); // 加载状态，避免重复点击
  const [isInOrderPage, setIsInOrderPage] = useState(false); // 标记是否已跳转到订单页

  // 核心跳转逻辑
  const handleNavClick = () => {
    setLoading(true);
    try {
      if (!isInOrderPage) {
        // 未在订单页 → 跳转到/order/detail
        navigate('/order/detail', { replace: false });
        setIsInOrderPage(true); // 切换状态，按钮变为返回首页
      } else {
        // 已在订单页 → 跳返回首页/
        navigate('/', { replace: false });
        setIsInOrderPage(false); // 切换状态，按钮变为去订单页
      }
    } catch (e) {
      alert(`跳转失败：${e instanceof Error ? e.message : '未知错误'}`);
      setLoading(false);
    } finally {
      // 无论成功失败，都重置loading（避免按钮一直禁用）
      setTimeout(() => setLoading(false), 300);
    }
  };

  // 极简样式（适配顶栏，和退出登录按钮风格统一）
  return (
    <button
      type="button"
      onClick={handleNavClick}
      disabled={loading}
      style={{
        marginLeft: '10px',
        padding: '4px 12px',
        border: 'none',
        borderRadius: '4px',
        // 不同状态不同背景色：去订单页（蓝色）、返回首页（灰色）
        backgroundColor: isInOrderPage ? '#8c8c8c' : '#1890ff',
        color: 'white',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        transition: 'background-color 0.2s',
      }}
    >
      {loading ? '跳转中...' : isInOrderPage ? '返回首页' : '我的订单'}
    </button>
  );
}
