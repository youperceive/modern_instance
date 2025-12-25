import axios from 'axios';

// 替换为你的后端实际地址
const BASE_URL = 'http://172.31.77.44:8888';

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. 定义极简入参接口（仅保留用到的字段，无冗余）
// 商品相关入参类型
interface CreateProductParams {
  merchant_id: number;
  name: string;
  ext: {
    desc: string;
  };
}

interface ListProductParams {
  merchant_id: number;
  page_num: number;
  page_size: number;
}

interface DeleteProductParams {
  merchant_id: number;
  product_id: number;
}

// SKU 相关入参类型
interface ListSkuParams {
  merchant_id: number;
  product_id: number;
}

interface CreateSkuParams {
  merchant_id: number;
  product_id: number;
  sku_code: string;
  price: number;
  stock: number;
}

interface DeductSkuStockParams {
  sku_id: number;
  count: number;
}

// 2. 替换所有 any 为对应类型
// 商品接口
export const productAPI = {
  createProduct: (data: CreateProductParams) =>
    request.post('/create_product', data),
  listProduct: (data: ListProductParams) => request.post('/list_product', data),
  deleteProduct: (data: DeleteProductParams) =>
    request.post('/delete_product', data),
};

// SKU 接口
export const skuAPI = {
  listSku: (data: ListSkuParams) => request.post('/list_sku', data),
  createSku: (data: CreateSkuParams) => request.post('/create_sku', data),
  deductSkuStock: (data: DeductSkuStockParams) =>
    request.post('/deduct_sku', data),
};
