import { Link } from '@modern-js/runtime/router';
import { productAPI } from 'api';
import { useCallback, useEffect, useState } from 'react';

// 1. 定义极简接口（替换 any，仅保留用到的字段）
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

// 根路由：商品列表（对应 /）
export default function ProductList() {
  // 2. 替换 any[] 为 Product[]
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  // 3. 给 form 声明类型（替换隐式 any）
  const [form, setForm] = useState<CreateProductForm>({
    merchant_id: 1001,
    name: '',
    ext: { desc: '' },
  });

  // 加载商品列表
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productAPI.listProduct({
        merchant_id: 1001,
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
  }, []); // fetchProducts 无外部依赖，依赖数组为空

  // 创建商品
  const handleCreate = async () => {
    if (!form.name) return alert('商品名称不能为空');
    try {
      await productAPI.createProduct(form);
      alert('创建成功');
      fetchProducts();
      setForm({ ...form, name: '', ext: { desc: '' } });
    } catch (e) {
      alert("创建失败：${e instanceof Error ? e.message : '未知错误'}");
    }
  };

  // 删除商品
  const handleDelete = async (productId: number) => {
    if (!confirm('确认删除？')) return;
    try {
      await productAPI.deleteProduct({
        merchant_id: 1001,
        product_id: productId,
      });
      alert('删除成功');
      fetchProducts();
    } catch (e) {
      alert("删除失败：${e instanceof Error ? e.message : '未知错误'}");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div>
      <h1>商户商品管理（仅功能，无样式）</h1>

      {/* 创建商品表单 */}
      <div>
        <h3>创建商品</h3>
        <div>
          <label htmlFor="">商品名称：</label>
          <input
            type="text"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="输入商品名称"
          />
        </div>
        <div>
          <label htmlFor="">扩展描述：</label>
          <input
            type="text"
            value={form.ext.desc}
            onChange={e =>
              setForm({ ...form, ext: { ...form.ext, desc: e.target.value } })
            }
            placeholder="输入商品描述"
          />
        </div>
        <button type="button" onClick={handleCreate}>
          创建商品
        </button>
      </div>

      {/* 商品列表 */}
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
                  style={{ margin: '10px 0', borderBottom: '1px solid #eee' }}
                >
                  <div>ID：{item.id}</div>
                  <div>名称：{item.name}</div>
                  <div>描述：{item.ext.desc || '无'}</div>
                  <button type="button" onClick={() => handleDelete(item.id)}>
                    删除
                  </button>
                  <Link to={`/sku/${item.id}`}>查看SKU</Link>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 跳转到扣减库存页 */}
      <div style={{ marginTop: '20px' }}>
        <Link to="/deduct">订单端-扣减SKU库存</Link>
      </div>
    </div>
  );
}
