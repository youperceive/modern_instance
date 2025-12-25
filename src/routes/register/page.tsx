import { Link, useNavigate } from '@modern-js/runtime/router';
import type { GenerateCaptchaParams, RegisterForm, RegisterParams } from 'api';
import { authAPI } from 'api';
import { useState } from 'react';

export default function Register() {
  const navigate = useNavigate();

  // ========== 1. 重构表单：补充注册方式、手机号/邮箱（验证码所需核心信息） ==========
  const [form, setForm] = useState<RegisterForm>({
    // 注册方式：1=手机，2=邮箱（和后端base_k.TargetType枚举匹配）
    registerType: 1,
    // 验证码发送目标（手机号/邮箱，对应后端Target）
    target: '',
    // 用户名（可选，根据后端需求）
    username: '',
    // 密码相关
    password: '',
    confirmPassword: '',
    // 用户类型：1=普通，2=商户（对应后端UserType）
    userType: 2,
    // 验证码
    captcha: '',
    // 验证码ID（后端返回，可选）
    captchaId: '',
  });

  // 验证码按钮状态
  const [captchaBtnText, setCaptchaBtnText] = useState('发送验证码');
  const [captchaDisabled, setCaptchaDisabled] = useState(false);
  const [loading, setLoading] = useState(false);

  // ========== 2. 前端校验：分「发送验证码」和「注册」 ==========
  // 发送验证码校验：必须选注册方式 + 填手机号/邮箱
  const validateCaptcha = (): string => {
    if (!form.registerType) return '请选择注册方式！';
    if (!form.target.trim()) {
      return form.registerType === 1 ? '手机号不能为空！' : '邮箱不能为空！';
    }
    // 简单手机号/邮箱格式校验（测试用）
    if (form.registerType === 1 && !/^1[3-9]\d{9}$/.test(form.target)) {
      return '手机号格式错误！';
    }
    if (
      form.registerType === 2 &&
      !/^[\w.-]+@[\w.-]+\.\w+$/.test(form.target)
    ) {
      return '邮箱格式错误！';
    }
    return '';
  };

  // 注册全量校验
  const validateRegister = (): string => {
    // 先校验验证码相关
    const captchaMsg = validateCaptcha();
    if (captchaMsg) return captchaMsg;

    // 用户名/密码校验
    if (!form.username.trim()) return '用户名不能为空！';
    if (form.password.length < 6) return '密码长度不能少于6位！';
    if (form.password !== form.confirmPassword) return '两次密码不一致！';
    if (!form.captcha.trim()) return '验证码不能为空！';
    return '';
  };

  // ========== 3. 发送验证码：基于表单的注册方式+手机号/邮箱，不清空表单 ==========
  const handleSendCaptcha = async () => {
    const validateMsg = validateCaptcha();
    if (validateMsg) {
      alert(validateMsg);
      return;
    }

    // 组装验证码接口参数（严格匹配后端GenerateCaptchaRequest）
    const captchaData: GenerateCaptchaParams = {
      type: form.registerType, // 1=手机，2=邮箱（和后端base_k.TargetType一致）
      target: form.target, // 手机号/邮箱（验证码发送目标）
      biz_type: 'user_register', // 业务类型：用户注册（和后端约定）
    };

    try {
      setCaptchaDisabled(true);
      const res = await authAPI.generateCaptcha(captchaData);

      if (res.data.baseResp.code === 0) {
        alert(
          `验证码发送成功！已发送至${form.registerType === 1 ? '手机号' : '邮箱'}：${form.target}`,
        );
        // 60秒倒计时（发送后表单数据保留，不清空）
        let count = 60;
        setCaptchaBtnText(`${count}秒后重新发送`);
        const timer = setInterval(() => {
          count--;
          setCaptchaBtnText(`${count}秒后重新发送`);
          if (count <= 0) {
            clearInterval(timer);
            setCaptchaBtnText('发送验证码');
            setCaptchaDisabled(false);
          }
        }, 1000);
      } else {
        alert(`发送验证码失败：${res.data.baseResp.msg}`);
        setCaptchaDisabled(false);
      }
    } catch (e) {
      alert(`发送验证码失败：${e instanceof Error ? e.message : '网络错误'}`);
      setCaptchaDisabled(false);
    }
  };

  // ========== 4. 注册提交：携带所有表单信息 ==========
  const handleRegister = async () => {
    const validateMsg = validateRegister();
    if (validateMsg) {
      alert(validateMsg);
      return;
    }

    setLoading(true);
    try {
      // 组装注册参数（匹配后端user_account.RegisterRequest）
      const submitData: RegisterParams = {
        username: form.username,
        target: form.target, // 手机号/邮箱（和验证码Target一致）
        target_type: form.registerType, // 注册方式类型（1=手机，2=邮箱）
        password: form.password,
        captcha: form.captcha,
        user_type: form.userType, // 1=普通，2=商户
        // CaptchaId: form.captchaId || '', // 可选：验证码ID（后端需要则加）
      };

      const res = await authAPI.register(submitData);
      if (res.data.baseResp.code === 0) {
        alert('注册成功！请登录');
        navigate('/login');
      } else {
        alert(`注册失败：${res.data.baseResp.msg}`);
      }
    } catch (e) {
      alert(`注册失败：${e instanceof Error ? e.message : '网络错误'}`);
    } finally {
      setLoading(false);
    }
  };

  // ========== 5. 切换注册方式：清空目标输入框（优化体验） ==========
  const handleRegisterTypeChange = (type: number) => {
    setForm(prev => ({
      ...prev,
      registerType: type,
      target: '', // 切换方式时清空手机号/邮箱
    }));
  };

  // ========== 6. 渲染：极简样式，逻辑清晰 ==========
  return (
    <div style={{ padding: '20px', maxWidth: '450px', margin: '0 auto' }}>
      <h1>用户注册（测试用）</h1>

      {/* 1. 注册方式选择（手机/邮箱） */}
      <div style={{ margin: '10px 0' }}>
        <label htmlFor="">注册方式：</label>
        <label htmlFor="registerType1" style={{ marginRight: '15px' }}>
          <input
            id="registerType1"
            type="radio"
            name="registerType"
            checked={form.registerType === 1}
            onChange={() => handleRegisterTypeChange(1)}
          />
          手机
        </label>
        <label htmlFor="registerType2">
          <input
            id="registerType2"
            type="radio"
            name="registerType"
            checked={form.registerType === 2}
            onChange={() => handleRegisterTypeChange(2)}
          />
          邮箱
        </label>
      </div>

      {/* 2. 手机号/邮箱输入框（验证码Target） */}
      <div style={{ margin: '10px 0' }}>
        <label htmlFor="target">
          {form.registerType === 1 ? '手机号：' : '邮箱：'}
        </label>
        <input
          id="target"
          type={form.registerType === 1 ? 'tel' : 'email'}
          value={form.target}
          onChange={e => setForm(prev => ({ ...prev, target: e.target.value }))}
          placeholder={form.registerType === 1 ? '输入手机号' : '输入邮箱'}
          style={{ width: '250px', marginLeft: '5px' }}
        />
      </div>

      {/* 3. 用户名 */}
      <div style={{ margin: '10px 0' }}>
        <label htmlFor="username">用户名：</label>
        <input
          id="username"
          type="text"
          value={form.username}
          onChange={e =>
            setForm(prev => ({ ...prev, username: e.target.value }))
          }
          placeholder="输入用户名"
          style={{ width: '250px', marginLeft: '5px' }}
        />
      </div>

      {/* 4. 密码 */}
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

      {/* 5. 确认密码 */}
      <div style={{ margin: '10px 0' }}>
        <label htmlFor="confirmPassword">确认密码：</label>
        <input
          id="confirmPassword"
          type="password"
          value={form.confirmPassword}
          onChange={e =>
            setForm(prev => ({ ...prev, confirmPassword: e.target.value }))
          }
          placeholder="再次输入密码"
          style={{ width: '250px', marginLeft: '5px' }}
        />
      </div>

      {/* 6. 验证码 */}
      <div style={{ margin: '10px 0' }}>
        <label htmlFor="captcha">验证码：</label>
        <input
          id="captcha"
          type="text"
          value={form.captcha}
          onChange={e =>
            setForm(prev => ({ ...prev, captcha: e.target.value }))
          }
          placeholder="输入验证码"
          style={{ width: '150px', marginLeft: '5px' }}
        />
        <button
          type="button"
          onClick={handleSendCaptcha}
          disabled={captchaDisabled}
          style={{ marginLeft: '10px' }}
        >
          {captchaBtnText}
        </button>
      </div>

      {/* 7. 用户类型（普通/商户） */}
      <div style={{ margin: '10px 0' }}>
        <label htmlFor="">用户类型：</label>
        <label htmlFor="userType1" style={{ marginRight: '15px' }}>
          <input
            id="userType1"
            type="radio"
            name="userType"
            checked={form.userType === 1}
            onChange={() => setForm(prev => ({ ...prev, userType: 1 }))}
          />
          普通用户
        </label>
        <label htmlFor="userType2">
          <input
            id="userType2"
            type="radio"
            name="userType"
            checked={form.userType === 2}
            onChange={() => setForm(prev => ({ ...prev, userType: 2 }))}
          />
          商户用户
        </label>
      </div>

      {/* 8. 注册按钮 */}
      <button
        type="button"
        onClick={handleRegister}
        disabled={loading}
        style={{ marginTop: '15px', padding: '5px 20px' }}
      >
        {loading ? '注册中...' : '注册'}
      </button>

      {/* 9. 跳登录 */}
      <div style={{ marginTop: '10px' }}>
        已有账号？<Link to="/login">去登录</Link>
      </div>
    </div>
  );
}
