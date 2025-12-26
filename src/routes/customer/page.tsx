import { useNavigate } from '@modern-js/runtime/router';
import { productAPI, skuAPI } from 'api';
import { type Merchant, merchantAPI } from 'api';
import { useCallback, useEffect, useState } from 'react';

// 类型定义（对齐API返回，精简且无冗余）
interface Product {
  id: number;
  name: string;
  merchant_id: number;
  ext: {
    desc: string;
  };
}

interface Sku {
  id: number;
  product_id: number;
  sku_code: string;
  price: number;
  stock: number;
}

export default function CustomerPage() {
  const navigate = useNavigate();

  // 核心状态（无修改）
  const [merchantList, setMerchantList] = useState<Merchant[]>([]);
  const [selectedMerchantId, setSelectedMerchantId] = useState<number | null>(
    null,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [skuList, setSkuList] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(false);

  // 加载商户列表逻辑（无修改）
  const fetchMerchants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await merchantAPI.listMerchant();
      console.log('商户API响应：', res);

      const responseData = res?.data || {};
      const baseResp = responseData?.baseResp || {};
      if (baseResp.code !== 0) {
        throw new Error(baseResp.msg || '查询商户列表失败');
      }

      setMerchantList(
        Array.isArray(responseData.data) ? responseData.data : [],
      );
    } catch (e) {
      alert(`加载商户列表失败：${e instanceof Error ? e.message : '未知错误'}`);
      console.error('商户列表加载错误详情：', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载商品逻辑（无修改）
  const fetchProductsByMerchant = useCallback(async (merchantId: number) => {
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
  }, []);

  // 加载SKU逻辑（无修改）
  const fetchSkuByProduct = useCallback(
    async (productId: number) => {
      if (!selectedMerchantId) return alert('未选择商户，无法加载SKU');
      setLoading(true);
      try {
        const res = await skuAPI.listSku({
          merchant_id: selectedMerchantId,
          product_id: productId,
        });
        const data = res.data as { skus: Sku[] };
        setSkuList(data.skus || []);
      } catch (e) {
        alert(`加载规格失败：${e instanceof Error ? e.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    },
    [selectedMerchantId],
  );

  // 点击回调逻辑（仅恢复：只加载SKU，不跳转）
  const handleSelectMerchant = (merchantId: number) => {
    setSelectedMerchantId(merchantId);
    setSelectedProductId(null);
    setSkuList([]);
    fetchProductsByMerchant(merchantId);
  };

  // 核心修改1：商品点击仅加载SKU，移除跳转逻辑
  const handleSelectProduct = (productId: number) => {
    setSelectedProductId(productId);
    fetchSkuByProduct(productId); // 仅加载该商品的SKU列表
  };

  // 核心修改2：新增SKU下单函数
  const handleOrderSku = (sku: Sku) => {
    // 获取当前商品名称
    const productName = products.find(p => p.id === sku.product_id)?.name || '';
    // 跳转到订单确认页，传递选中的SKU信息
    navigate('/order/commit', {
      state: {
        productId: sku.product_id,
        productName,
        skuId: sku.id,
        skuCode: sku.sku_code,
        price: sku.price,
        stock: sku.stock,
        merchantId: selectedMerchantId,
      },
    });
  };

  // 挂载逻辑（无修改）
  useEffect(() => {
    fetchMerchants();
  }, [fetchMerchants]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>商户商品查询</h1>

      {/* 商户列表：无修改 */}
      <div
        style={{
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '1px solid #eee',
        }}
      >
        <h3>商户列表</h3>
        {loading ? (
          <div>加载商户中...</div>
        ) : merchantList.length === 0 ? (
          <div>暂无商户</div>
        ) : (
          merchantList.map(merchant => (
            <button
              type="button"
              key={merchant.id}
              style={{
                border:
                  selectedMerchantId === merchant.id
                    ? '1px solid #1890ff'
                    : '1px solid #eee',
                borderRadius: '4px',
                padding: '10px 12px', // 微调内边距，适配两行内容
                margin: '5px 0',
                width: '200px', // 固定宽度
                textAlign: 'left',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                outline: 'none',
                font: 'inherit',
                lineHeight: '1.4', // 统一行高，确保换行后高度一致
                whiteSpace: 'normal', // 允许换行（默认nowrap会导致内容溢出）
                wordBreak: 'break-all', // 超长名称自动换行，避免溢出
              }}
              onClick={() => handleSelectMerchant(merchant.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectMerchant(merchant.id);
                }
              }}
            >
              {/* 核心修改：拆分为两行展示，移除竖线 */}
              <div style={{ marginBottom: '4px' }}>商户ID：{merchant.id}</div>
              {/* 名称有值时显示，无值则不渲染该div（避免空行） */}
              {merchant?.name?.trim() && <div>名称：{merchant.name}</div>}
            </button>
          ))
        )}
      </div>

      {/* 商品列表：无修改 */}
      {selectedMerchantId ? (
        <div
          style={{
            marginBottom: '20px',
            paddingBottom: '10px',
            borderBottom: '1px solid #eee',
          }}
        >
          <h3>商户 {selectedMerchantId} 的商品列表</h3>
          {loading ? (
            <div>加载商品中...</div>
          ) : products.length === 0 ? (
            <div>该商户暂无商品</div>
          ) : (
            products.map(product => (
              <button
                type="button"
                key={product.id}
                style={{
                  border:
                    selectedProductId === product.id
                      ? '1px solid #1890ff'
                      : '1px solid #eee',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  margin: '5px 0',
                  width: '300px',
                  textAlign: 'left',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  outline: 'none',
                  font: 'inherit',
                  display: 'block',
                }}
                onClick={() => handleSelectProduct(product.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectProduct(product.id);
                  }
                }}
              >
                <div>商品ID：{product.id}</div>
                <div>商品名称：{product.name}</div>
                <div>商品描述：{product.ext.desc || '无'}</div>
              </button>
            ))
          )}
        </div>
      ) : (
        <div style={{ color: '#999' }}>请选择左侧商户，查看其商品列表</div>
      )}

      {/* SKU列表：仅新增下单按钮，其他无修改 */}
      {selectedProductId ? (
        <div>
          <h3>商品 {selectedProductId} 的规格（SKU）</h3>
          {loading ? (
            <div>加载规格中...</div>
          ) : skuList.length === 0 ? (
            <div>该商品暂无规格</div>
          ) : (
            <div
              style={{
                border: '1px solid #eee',
                borderRadius: '4px',
                padding: '10px',
              }}
            >
              {skuList.map(sku => (
                <div
                  key={sku.id}
                  style={{
                    margin: '5px 0',
                    padding: '5px',
                    borderBottom: '1px solid #f5f5f5',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  {/* 原有SKU信息展示 */}
                  <div>
                    <div>规格ID：{sku.id}</div>
                    <div>规格编码：{sku.sku_code}</div>
                    <div>库存：{sku.stock} 件</div>
                    <div>价格：¥{(sku.price / 100).toFixed(2)}</div>
                  </div>
                  {/* 新增下单按钮 */}
                  <button
                    type="button"
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#1890ff',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: sku.stock <= 0 ? 'not-allowed' : 'pointer',
                      opacity: sku.stock <= 0 ? 0.6 : 1,
                    }}
                    onClick={() => handleOrderSku(sku)}
                    disabled={sku.stock <= 0}
                  >
                    {sku.stock <= 0 ? '库存不足' : '立即下单'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : selectedMerchantId ? (
        <div style={{ color: '#999' }}>请选择上方商品，查看其规格信息</div>
      ) : null}
    </div>
  );
}
