import { parseJwt } from '@/routes/page';
import { Link, useNavigate, useParams } from '@modern-js/runtime/router'; // 新增useNavigate
import { skuAPI } from 'api';
import { useCallback, useEffect, useState } from 'react';

// 2. 定义核心类型（补充JWT Payload）
interface Sku {
  id: number;
  sku_code: string;
  price: number;
  stock: number;
}

interface CreateSkuForm {
  merchant_id: number;
  product_id: number;
  sku_code: string;
  price: string; // 表单输入为字符串，提交时转数字
  stock: string;
}

// JWT Payload类型（和商品管理页保持一致）
interface JwtPayload {
  user_id: number; // 对应token中的商户ID
  user_type: number;
}

// 动态路由：/sku/:productId
export default function SkuList() {
  // 获取路由中的商品ID（强类型）
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate(); // 新增：无token时跳登录

  // 3. 新增状态：存储解析出的商户ID（user_id）
  const [merchantId, setMerchantId] = useState<number | null>(null);
  const [skus, setSkus] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(false);

  // 4. 初始化form：merchant_id先为空，解析出后赋值
  const [form, setForm] = useState<CreateSkuForm>({
    merchant_id: 0,
    product_id: Number(productId) || 0, // 容错：productId 为空时设为0
    sku_code: '',
    price: '',
    stock: '',
  });

  // 5. 加载SKU列表：使用解析出的merchantId（替换硬编码1001）
  const fetchSkus = useCallback(async () => {
    // 双重容错：无商户ID/商品ID无效时不请求
    if (!merchantId) return alert('未获取到商户信息，请重新登录');
    if (!productId || Number.isNaN(Number(productId))) {
      alert(`商品ID无效：${productId}`);
      return;
    }

    setLoading(true);
    try {
      const res = await skuAPI.listSku({
        merchant_id: merchantId, // 替换硬编码1001
        product_id: Number(productId),
      });
      const data = res.data as { skus: Sku[] };
      setSkus(data.skus || []);
    } catch (e) {
      alert(`加载SKU失败：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }, [merchantId, productId]); // 依赖merchantId和productId

  // 6. 创建SKU：使用解析出的merchantId（替换硬编码1001）
  const handleCreate = async () => {
    // 边界校验
    if (!merchantId) return alert('未获取到商户信息，请重新登录');
    if (!productId || Number.isNaN(Number(productId))) {
      return alert(`商品ID无效：${productId}`);
    }
    // 表单校验
    if (!form.sku_code) return alert('规格编码不能为空');
    if (!form.price || Number.isNaN(Number(form.price)))
      return alert('价格必须是数字');
    if (!form.stock || Number.isNaN(Number(form.stock)))
      return alert('库存必须是数字');

    // 确保merchant_id和解析出的一致
    const submitForm = {
      ...form,
      merchant_id: merchantId,
      product_id: Number(productId),
      price: Number(form.price),
      stock: Number(form.stock),
    };

    try {
      await skuAPI.createSku(submitForm);
      alert('创建SKU成功');
      fetchSkus(); // 刷新列表
      // 重置表单（保留merchant_id和product_id）
      setForm({ ...submitForm, sku_code: '', price: '', stock: '' });
    } catch (e) {
      alert(`创建SKU失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  // 7. 初始化：解析token，获取user_id（商户ID）
  useEffect(() => {
    // 第一步：获取localStorage中的user_token
    const userToken = localStorage.getItem('user_token');
    if (!userToken) {
      // 无token → 跳登录页
      navigate('/login', { replace: true });
      return;
    }

    // 第二步：解析token中的user_id
    const payload = parseJwt(userToken) as JwtPayload | null;
    if (!payload || !payload.user_id) {
      // token解析失败/无user_id → 清理token并跳登录
      localStorage.removeItem('user_token');
      alert('登录状态失效，请重新登录');
      navigate('/login', { replace: true });
      return;
    }

    // 第三步：赋值商户ID，并更新表单的merchant_id
    setMerchantId(payload.user_id);
    setForm(prev => ({
      ...prev,
      merchant_id: payload.user_id,
      product_id: Number(productId) || 0, // 同步商品ID
    }));
  }, [navigate, productId]); // 依赖productId，路由参数变化时重新赋值

  // 8. 商户ID+商品ID就绪后，加载SKU列表
  useEffect(() => {
    if (merchantId && productId && !Number.isNaN(Number(productId))) {
      fetchSkus();
    }
  }, [merchantId, productId, fetchSkus]);

  return (
    <div style={{ padding: '10px' }}>
      {/* 显示当前商户ID+商品ID，便于测试 */}
      <h1>
        SKU管理（商户ID：{merchantId || '未知'} | 商品ID：{productId}）
      </h1>

      {/* 创建SKU表单（补充商户ID显示，禁用修改） */}
      <div style={{ margin: '20px 0' }}>
        <h3>创建SKU</h3>
        {/* 新增：显示商户ID，禁止手动修改 */}
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="merchantId">商户ID：</label>
          <input
            id="merchantId"
            type="text"
            value={merchantId || ''}
            disabled
            placeholder="自动获取当前登录商户ID"
            style={{ marginLeft: '5px' }}
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="skuCode">规格编码：</label>
          <input
            id="skuCode"
            type="text"
            value={form.sku_code}
            onChange={e => setForm({ ...form, sku_code: e.target.value })}
            placeholder="如：红色-XL"
            style={{ marginLeft: '5px' }}
            disabled={!merchantId} // 无商户ID时禁用
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="skuPrice">价格（分）：</label>
          <input
            id="skuPrice"
            type="number"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
            placeholder="如：9900"
            style={{ marginLeft: '5px' }}
            min={0}
            disabled={!merchantId} // 无商户ID时禁用
          />
        </div>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="skuStock">库存：</label>
          <input
            id="skuStock"
            type="number"
            value={form.stock}
            onChange={e => setForm({ ...form, stock: e.target.value })}
            placeholder="如：100"
            style={{ marginLeft: '5px' }}
            min={0}
            disabled={!merchantId} // 无商户ID时禁用
          />
        </div>
        {/* 无商户ID/商品ID时禁用创建按钮 */}
        <button
          type="button"
          onClick={handleCreate}
          disabled={
            !merchantId || !productId || Number.isNaN(Number(productId))
          }
        >
          {!merchantId ? '加载商户信息中...' : '创建SKU'}
        </button>
      </div>

      {/* SKU列表 */}
      <div>
        <h3>SKU列表</h3>
        {loading ? (
          <div>加载中...</div>
        ) : (
          <div>
            {skus.length === 0 ? (
              <div>暂无SKU，可点击上方按钮创建</div>
            ) : (
              skus.map(item => (
                <div
                  key={item.id}
                  style={{
                    margin: '10px 0',
                    padding: '5px',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <div>SKU ID：{item.id}</div>
                  <div>规格：{item.sku_code}</div>
                  <div>价格：{item.price} 分</div>
                  <div>库存：{item.stock}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 返回商品列表 */}
      <div style={{ marginTop: '20px' }}>
        <Link to="/">← 返回商品列表</Link>
      </div>
    </div>
  );
}
