import { Link, useParams } from '@modern-js/runtime/router';
import { skuAPI } from 'api';
import { useCallback, useEffect, useState } from 'react';

// 1. 定义极简接口（替换 any，仅保留用到的字段）
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

// 动态路由：/sku/:productId
export default function SkuList() {
  // 获取路由中的商品ID（强类型）
  const { productId } = useParams<{ productId: string }>();

  // 2. 状态管理（明确类型，无 any）
  const [skus, setSkus] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateSkuForm>({
    merchant_id: 1001,
    product_id: Number(productId) || 0, // 容错：productId 为空时设为0
    sku_code: '',
    price: '',
    stock: '',
  });

  // 3. useCallback 缓存函数，修复 useEffect 依赖警告
  const fetchSkus = useCallback(async () => {
    // 容错：productId 无效时不请求
    if (!productId || Number.isNaN(Number(productId))) {
      alert(`商品ID无效：${productId}`);
      return;
    }

    setLoading(true);
    try {
      const res = await skuAPI.listSku({
        merchant_id: 1001,
        product_id: Number(productId),
      });
      // 断言返回值类型（极简处理）
      const data = res.data as { skus: Sku[] };
      setSkus(data.skus || []);
    } catch (e) {
      // 模板字符串替换拼接，精准捕获错误
      alert(`加载SKU失败：${e instanceof Error ? e.message : '未知错误'}`);
    } finally {
      setLoading(false);
    }
  }, [productId]); // 依赖：productId

  // 创建SKU
  const handleCreate = async () => {
    // 表单校验
    if (!form.sku_code) return alert('规格编码不能为空');
    if (!form.price || Number.isNaN(Number(form.price)))
      return alert('价格必须是数字');
    if (!form.stock || Number.isNaN(Number(form.stock)))
      return alert('库存必须是数字');

    try {
      await skuAPI.createSku({
        ...form,
        price: Number(form.price), // 字符串转数字，匹配接口类型
        stock: Number(form.stock),
      });
      alert('创建SKU成功');
      fetchSkus(); // 刷新列表
      // 重置表单
      setForm({ ...form, sku_code: '', price: '', stock: '' });
    } catch (e) {
      alert(`创建SKU失败：${e instanceof Error ? e.message : '未知错误'}`);
    }
  };

  // 4. useEffect 依赖完整，无警告
  useEffect(() => {
    fetchSkus();
  }, [fetchSkus]);

  return (
    <div style={{ padding: '10px' }}>
      <h1>SKU管理（商品ID：{productId}）</h1>

      {/* 创建SKU表单（label关联input，修复a11y报错） */}
      <div style={{ margin: '20px 0' }}>
        <h3>创建SKU</h3>
        <div style={{ margin: '10px 0' }}>
          <label htmlFor="skuCode">规格编码：</label>
          <input
            id="skuCode"
            type="text"
            value={form.sku_code}
            onChange={e => setForm({ ...form, sku_code: e.target.value })}
            placeholder="如：红色-XL"
            style={{ marginLeft: '5px' }}
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
          />
        </div>
        <button type="button" onClick={handleCreate}>
          创建SKU
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
