import { Link, useNavigate } from '@modern-js/runtime/router';
import { productAPI } from 'api';
import { useCallback, useEffect, useState } from 'react';
import { parseJwt } from '../page';

// 类型定义（保留核心，简化注释）
interface Product {
  id: number;
  name: string;
  ext: {
    desc: string;
  };
}

interface CreateProductForm {
  merchant_id: number;
  name: string;
  ext: {
    desc: string;
  };
}

interface JwtPayload {
  user_id: number;
  user_type: number;
}

export default function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [merchantId, setMerchantId] = useState<number | null>(null);

  const [form, setForm] = useState<CreateProductForm>({
    merchant_id: 0,
    name: '',
    ext: { desc: '' },
  });

  // 加载商品列表（核心逻辑不变）
  const fetchProducts = useCallback(async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const res = await productAPI.listProduct({
        merchant_id: merchantId,
        page_num: 1,
        page_size: 20,
      });
      const data = res.data as { products: Product[] };
      setProducts(data.products || []);
    } catch (e) {
      alert(`加载商品失败：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }, [merchantId]);

  // 创建商品（核心逻辑不变）
  const handleCreate = async () => {
    if (!merchantId) return alert('未获取到商户信息，请重新登录');
    if (!form.name) return alert('商品名称不能为空');

    const submitForm = { ...form, merchant_id: merchantId };
    try {
      await productAPI.createProduct(submitForm);
      alert('创建成功');
      fetchProducts();
      setForm({ ...submitForm, name: '', ext: { desc: '' } });
    } catch (e) {
      alert(`创建失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  // 删除商品（核心逻辑不变）
  const handleDelete = async (productId: number) => {
    if (!merchantId) return alert('未获取到商户信息，请重新登录');
    if (!confirm('确认删除？')) return;

    try {
      await productAPI.deleteProduct({
        merchant_id: merchantId,
        product_id: productId,
      });
      alert('删除成功');
      fetchProducts();
    } catch (e) {
      alert(`删除失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  // 初始化解析JWT（核心逻辑不变）
  useEffect(() => {
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
      navigate('/login', { replace: true });
      return;
    }

    const payload = parseJwt(userToken) as JwtPayload | null;
    if (!payload || !payload.user_id) {
      localStorage.removeItem('user_token');
      alert('登录状态失效，请重新登录');
      navigate('/login', { replace: true });
      return;
    }

    setMerchantId(payload.user_id);
    setForm(prev => ({ ...prev, merchant_id: payload.user_id }));
  }, [navigate]);

  // 加载商品列表（核心逻辑不变）
  useEffect(() => {
    if (merchantId) {
      fetchProducts();
    }
  }, [merchantId, fetchProducts]);

  return (
    <div style={{ padding: '20px' }}>
      {/* 简化标题：去掉测试字样 */}
      <h1>商户 {merchantId || '未知'} 商品管理</h1>

      {/* 新增：跳转到商户列表页面（打通路由） */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/merchants">查看所有商户</Link>
      </div>

      {/* 创建商品表单（简化样式，保留核心） */}
      <div
        style={{
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '1px solid #eee',
        }}
      >
        <h3>创建商品</h3>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor=''>商户ID：</label>
          <input
            type="text"
            value={merchantId || ''}
            disabled
            placeholder="自动获取当前登录商户ID"
            style={{ marginLeft: '5px' }}
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor=''>商品名称：</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="输入商品名称"
            style={{ marginLeft: '5px' }}
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor=''>扩展描述：</label>
          <input
            type="text"
            value={form.ext.desc}
            onChange={e =>
              setForm({ ...form, ext: { ...form.ext, desc: e.target.value } })
            }
            placeholder="输入商品描述"
            style={{ marginLeft: '5px' }}
          />
        </div>
        <button type="button" onClick={handleCreate} disabled={!merchantId}>
          {!merchantId ? '加载中...' : '创建商品'}
        </button>
      </div>

      {/* 商品列表（简化样式，保留核心） */}
      <div>
        <h3>商品列表</h3>
        {loading ? (
          <div>加载中...</div>
        ) : (
          <div>
            {products.length === 0 ? (
              <div>暂无商品</div>
            ) : (
              products.map(item => (
                <div
                  key={item.id}
                  style={{
                    margin: '10px 0',
                    padding: '5px',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div>ID：{item.id}</div>
                  <div>名称：{item.name}</div>
                  <div>描述：{item.ext.desc || '无'}</div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    style={{ marginRight: '10px' }}
                  >
                    删除
                  </button>
                  <Link to={`/sku/${item.id}`}>查看SKU</Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 保留扣减库存跳转，新增间距 */}
      <div style={{ marginTop: '20px' }}>
        <Link to="/deduct">订单端-扣减SKU库存</Link>
      </div>
    </div>
  );
}
