// src/routes/order/commit/page.tsx
import { useLocation, useNavigate } from '@modern-js/runtime/router';
// 导入订单API（需确保已按之前的规范封装）
import { orderAPI } from 'api';
import { useEffect, useState } from 'react';

// 定义跳转传递的参数类型（对齐CustomerPage的state）
interface OrderCommitState {
  productId: number;
  productName: string;
  skuId: number;
  skuCode: string;
  price: number; // 单位：分
  stock: number;
  merchantId: number | null;
}

export default function OrderCommitPage() {
  // 1. 获取路由跳转参数
  const location = useLocation();
  const navigate = useNavigate();
  const orderState = location.state as OrderCommitState;

  // 2. 核心状态管理
  const [count, setCount] = useState(1); // 购买数量，默认1
  const [loading, setLoading] = useState(false); // 创建订单加载状态
  const [errorMsg, setErrorMsg] = useState(''); // 错误提示

  // 3. 初始化校验：如果参数缺失，提示并返回上一页
  useEffect(() => {
    if (!orderState || !orderState.productId || !orderState.skuId) {
      setErrorMsg('订单参数异常，请从商品规格页进入');
      // 3秒后自动返回上一页
      setTimeout(() => navigate(-1), 3000);
    }
  }, [orderState, navigate]);

  // 4. 数量调整函数（带库存校验）
  const handleCountChange = (type: 'plus' | 'minus') => {
    if (type === 'plus') {
      // 不能超过库存
      if (count >= orderState.stock) {
        setErrorMsg(`最多只能购买${orderState.stock}件`);
        return;
      }
      setCount(prev => prev + 1);
    } else {
      // 不能小于1
      if (count <= 1) {
        setErrorMsg('购买数量不能小于1');
        return;
      }
      setCount(prev => prev - 1);
    }
    // 清除之前的错误提示
    setErrorMsg('');
  };

  // 5. 创建订单核心函数
  const handleCreateOrder = async () => {
    // 前置参数校验
    if (
      !orderState ||
      !orderState.productId ||
      !orderState.skuId ||
      !orderState.merchantId
    ) {
      setErrorMsg('订单参数不完整，无法创建');
      return;
    }
    if (count < 1 || count > orderState.stock) {
      setErrorMsg(`购买数量需在1-${orderState.stock}之间`);
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const createParams = {
        type: 1,
        status: 1,
        resp_user_id: orderState.merchantId,
        items: [
          {
            product_id: orderState.productId,
            sku_id: orderState.skuId,
            count: count,
            price: orderState.price,
            ext: {
              merchantId: `${orderState.merchantId}`,
              skuCode: `${orderState.skuCode}`,
              productName: `${orderState.productName}`,
            },
          },
        ],
        ext: {
          orderType: `${orderState.stock}`,
        },
      };

      const res = await orderAPI.createOrder(createParams);
      const baseResp = res.data.baseResp || {};

      if (baseResp.code === 0) {
        // 创建成功：提示并跳转到订单详情页（可替换为你的订单详情路由）
        alert(`订单创建成功！订单ID：${res.data.order_id}`);
        navigate('/order/detail', {
          state: { orderId: res.data.order_id },
        });
      } else {
        setErrorMsg(`创建失败：${baseResp.msg || '未知错误'}`);
      }
    } catch (e) {
      // 网络/接口错误处理
      setErrorMsg(
        `创建订单失败：${e instanceof Error ? e.message : '网络异常'}`,
      );
      console.error('订单创建错误详情：', e);
    } finally {
      setLoading(false);
    }
  };

  // 6. 页面渲染（参数缺失时展示提示）
  if (!orderState || !orderState.productId || !orderState.skuId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>订单确认</h1>
        <div style={{ color: '#f5222d', marginTop: '20px' }}>{errorMsg}</div>
        <div style={{ marginTop: '10px', color: '#999' }}>
          正在返回上一页...
        </div>
      </div>
    );
  }

  // 价格转换：分 → 元
  const priceYuan = orderState.price / 100;
  const totalPriceYuan = (orderState.price * count) / 100;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>订单确认</h1>

      {/* 错误提示 */}
      {errorMsg && (
        <div style={{ color: '#f5222d', margin: '10px 0' }}>{errorMsg}</div>
      )}

      {/* 商品/SKU信息展示 */}
      <div
        style={{
          margin: '20px 0',
          padding: '15px',
          border: '1px solid #eee',
          borderRadius: '4px',
        }}
      >
        <div style={{ marginBottom: '10px', fontWeight: 600 }}>商品信息</div>
        <div>商品名称：{orderState.productName}</div>
        <div>商品ID：{orderState.productId}</div>
        <div>商户ID：{orderState.merchantId || '未知'}</div>

        <div
          style={{
            margin: '15px 0',
            paddingTop: '10px',
            borderTop: '1px solid #f5f5f5',
          }}
        >
          <div style={{ marginBottom: '10px', fontWeight: 600 }}>
            规格（SKU）信息
          </div>
          <div>SKU编码：{orderState.skuCode}</div>
          <div>SKU ID：{orderState.skuId}</div>
          <div>单价：¥{priceYuan.toFixed(2)}</div>
          <div>库存：{orderState.stock} 件</div>
        </div>

        {/* 数量选择 */}
        <div style={{ marginTop: '15px' }}>
          <div style={{ marginBottom: '8px' }}>购买数量：</div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => handleCountChange('minus')}
              disabled={loading || count <= 1}
              style={{
                padding: '6px 12px',
                border: '1px solid #eee',
                borderRadius: '4px 0 0 4px',
                cursor: loading || count <= 1 ? 'not-allowed' : 'pointer',
                backgroundColor: loading ? '#f5f5f5' : 'transparent',
              }}
            >
              -
            </button>
            <span
              style={{
                padding: '6px 20px',
                borderTop: '1px solid #eee',
                borderBottom: '1px solid #eee',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              {count}
            </span>
            <button
              type="button"
              onClick={() => handleCountChange('plus')}
              disabled={loading || count >= orderState.stock}
              style={{
                padding: '6px 12px',
                border: '1px solid #eee',
                borderRadius: '0 4px 4px 0',
                cursor:
                  loading || count >= orderState.stock
                    ? 'not-allowed'
                    : 'pointer',
                backgroundColor: loading ? '#f5f5f5' : 'transparent',
              }}
            >
              +
            </button>
            <span style={{ marginLeft: '10px', color: '#999' }}>
              剩余库存：{orderState.stock - count} 件
            </span>
          </div>
        </div>

        {/* 总价 */}
        <div style={{ marginTop: '15px', fontSize: '16px', fontWeight: 600 }}>
          订单总价：¥{totalPriceYuan.toFixed(2)}
        </div>
      </div>

      {/* 创建订单按钮 */}
      <button
        type="button"
        onClick={handleCreateOrder}
        disabled={loading || count < 1 || count > orderState.stock}
        style={{
          width: '100%',
          padding: '12px 0',
          backgroundColor: loading ? '#8cc5ff' : '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
        }}
      >
        {loading ? '创建订单中...' : '确认创建订单'}
      </button>

      {/* 返回按钮 */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        disabled={loading}
        style={{
          width: '100%',
          marginTop: '10px',
          padding: '12px 0',
          backgroundColor: 'transparent',
          color: '#1890ff',
          border: '1px solid #1890ff',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
        }}
      >
        返回上一页
      </button>
    </div>
  );
}
