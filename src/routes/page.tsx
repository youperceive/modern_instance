import { useNavigate } from '@modern-js/runtime/router';
// src/routes/index.tsx（根路由-JWT解析版）
import { useEffect } from 'react';

// 简易JWT解析函数（测试阶段：仅解码payload，不验证签名）
export const parseJwt = (token: string) => {
  try {
    // JWT结构：header.payload.signature → 解码payload部分
    const base64Url = token.split('.')[1];
    // 处理base64补位（URL安全的base64可能缺少=）
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => {
          const hex = c.charCodeAt(0).toString(16).padStart(2, '0');
          return `%${hex}`;
        })
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    // 解析失败（token格式错误/篡改）返回null
    return null;
  }
};

export default function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = () => {
      // 1. 获取本地存储的user_token
      const userToken = localStorage.getItem('user_token');

      // 2. 无token → 跳登录
      if (!userToken) {
        navigate('/login', { replace: true });
        return;
      }

      // 3. 解析JWT的payload
      const payload = parseJwt(userToken);
      // 解析失败（token无效）→ 清空token，跳登录
      if (!payload) {
        localStorage.removeItem('user_token'); // 清理无效token
        alert('登录状态失效，请重新登录');
        navigate('/login', { replace: true });
        return;
      }

      // 4. 提取user_type（处理可能的字段缺失/类型错误）
      const userType = payload.user_type ?? payload.userType ?? 0; // 兼容驼峰/蛇形命名
      const userTypeNum = Number(userType); // 确保是数字

      // 5. 根据user_type跳转
      if (userTypeNum === 2) {
        // 商家端（可替换为/merchant/product）
        navigate('/merchant', { replace: true });
      } else {
        // 客户端
        navigate('/customer', { replace: true });
      }
    };

    handleRedirect();
  }, [navigate]);

  // 测试阶段的提示文本（无样式）
  return <div>验证登录状态中...</div>;
}
