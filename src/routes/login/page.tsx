import { updateGlobalAuth } from '@/util/globalAuth';
import { Link, useNavigate } from '@modern-js/runtime/router';
import type { LoginForm, LoginParams } from 'api'; // 需在api层补充对应类型
import { authAPI } from 'api';
import { useState } from 'react';

export default function Login() {
  const navigate = useNavigate();

  // ========== 1. 表单状态管理（和Register风格对齐） ==========
  const [form, setForm] = useState<LoginForm>({
    // 登录方式：1=手机，2=邮箱（和后端base_k.TargetType枚举匹配）
    targetType: 1,
    // 登录目标（手机号/邮箱，对应后端Target）
    target: '',
    // 密码
    password: '',
  });

  // 加载状态
  const [loading, setLoading] = useState(false);

  // ========== 2. 登录校验逻辑（和Register的validateRegister风格一致） ==========
  const validateLogin = (): string => {
    // 校验登录方式+手机号/邮箱
    if (!form.targetType) return '请选择登录方式！';
    if (!form.target.trim()) {
      return form.targetType === 1 ? '手机号不能为空！' : '邮箱不能为空！';
    }
    // 手机号格式校验
    if (form.targetType === 1 && !/^1[3-9]\d{9}$/.test(form.target)) {
      return '手机号格式错误！';
    }
    // 邮箱格式校验
    if (form.targetType === 2 && !/^[\w.-]+@[\w.-]+\.\w+$/.test(form.target)) {
      return '邮箱格式错误！';
    }
    // 密码校验
    if (!form.password.trim()) return '密码不能为空！';
    if (form.password.length < 6) return '密码长度不能少于6位！';
    return '';
  };

  // ========== 3. 登录提交逻辑（和Register的handleRegister风格一致） ==========
  const handleLogin = async () => {
    const validateMsg = validateLogin();
    if (validateMsg) {
      alert(validateMsg);
      return;
    }

    setLoading(true);
    try {
      // 组装登录参数（匹配后端user_account.LoginRequest，蛇形命名和Register保持一致）

      // 依旧是转换 targetType

      const targetType = form.targetType === 1 ? 2 : 1;

      const submitData: LoginParams = {
        target: form.target, // 手机号/邮箱（对应后端Target）
        target_type: targetType, // 登录方式类型（1=手机，2=邮箱）
        password: form.password, // 密码
      };

      const res = await authAPI.login(submitData);
      console.log(res);
      if (res.data.baseResp.code === 0) {
        alert('登录成功！');

        updateGlobalAuth();
        navigate('/');

        // 可选：存储Token到本地（后续接口鉴权用）
        if (res.data.token) {
          localStorage.setItem('user_token', res.data.token);
        }
      } else {
        alert(`登录失败：${res.data.baseResp.msg}`);
      }
    } catch (e) {
      alert(`登录失败：${e instanceof Error ? e.message : '网络错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // ========== 4. 切换登录方式：清空目标输入框（和Register的handleRegisterTypeChange对齐） ==========
  const handleTargetTypeChange = (type: number) => {
    setForm(prev => ({
      ...prev,
      targetType: type,
      target: '', // 切换方式时清空手机号/邮箱
    }));
  };

  // ========== 5. 渲染：和Register完全一致的极简样式、布局结构 ==========
  return (
    <div style={{ padding: '20px', maxWidth: '450px', margin: '0 auto' }}>
      <h1>用户登录</h1>

      {/* 1. 登录方式选择（手机/邮箱） */}
      <div style={{ margin: '10px 0' }}>
        <label htmlFor="">登录方式：</label>
        <label htmlFor="targetType1" style={{ marginRight: '15px' }}>
          <input
            id="targetType1"
            type="radio"
            name="targetType"
            checked={form.targetType === 1}
            onChange={() => handleTargetTypeChange(1)}
          />
          手机
        </label>
        <label htmlFor="targetType2">
          <input
            id="targetType2"
            type="radio"
            name="targetType"
            checked={form.targetType === 2}
            onChange={() => handleTargetTypeChange(2)}
          />
          邮箱
        </label>
      </div>

      {/* 2. 手机号/邮箱输入框 */}
      <div style={{ margin: '10px 0' }}>
        <label htmlFor="target">
          {form.targetType === 1 ? '手机号：' : '邮箱：'}
        </label>
        <input
          id="target"
          type={form.targetType === 1 ? 'tel' : 'email'}
          value={form.target}
          onChange={e => setForm(prev => ({ ...prev, target: e.target.value }))}
          placeholder={form.targetType === 1 ? '输入手机号' : '输入邮箱'}
          style={{ width: '250px', marginLeft: '5px' }}
        />
      </div>

      {/* 3. 密码输入框 */}
      <div style={{ margin: '10px 0' }}>
        <label htmlFor="password">密码：</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={e =>
            setForm(prev => ({ ...prev, password: e.target.value }))
          }
          placeholder="输入密码（≥6位）"
          style={{ width: '250px', marginLeft: '5px' }}
        />
      </div>

      {/* 4. 登录按钮 */}
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        style={{ marginTop: '15px', padding: '5px 20px' }}
      >
        {loading ? '登录中...' : '登录'}
      </button>

      {/* 5. 跳注册（和Register跳登录的逻辑对称） */}
      <div style={{ marginTop: '10px' }}>
        还没有账号？<Link to="/register">去注册</Link>
      </div>
    </div>
  );
}
