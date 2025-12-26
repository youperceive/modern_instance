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

request.interceptors.request.use(
  config => {
    // 1. 读取localStorage里的user_token
    const token = localStorage.getItem('user_token') || '';
    console.log('🚀 准备传递的Token：', token); // 控制台打印，确认Token非空

    // 2. 核心：把Token加到请求头（字段名必须是user_token，和后端一致）
    if (token) {
      config.headers.user_token = token;
    }

    return config;
  },
  error => {
    console.error('请求拦截器错误：', error);
    return Promise.reject(error);
  },
);

// ========== 登录相关类型（和Register的类型风格对齐） ==========
export interface LoginForm {
  targetType: number; // 1=手机，2=邮箱
  target: string; // 手机号/邮箱
  password: string; // 密码
}

export interface LoginParams {
  target: string;
  target_type: number; // 蛇形命名，匹配后端JSON tag
  password: string;
}

interface BaseResp {
  code: number;
  msg: string;
}

export interface LoginResponse {
  baseResp: BaseResp;
  token?: string; // 登录成功返回的Token
}
// ========== 验证码接口类型（匹配后端GenerateCaptchaRequest） ==========
export interface GenerateCaptchaParams {
  type: number; // 1=手机，2=邮箱（base_k.TargetType）
  target: string; // 手机号/邮箱（验证码发送目标）
  biz_type: string; // 业务类型
}

export interface GenerateCaptchaResp {
  baseResp: {
    code: number;
    msg: string;
  };
}

// ========== 注册表单类型（前端用） ==========
export interface RegisterForm {
  registerType: number; // 1=手机，2=邮箱（对应Type）
  target: string; // 手机号/邮箱（对应Target）
  username: string; // 用户名
  password: string; // 密码
  confirmPassword: string; // 确认密码
  userType: number; // 1=普通，2=商户
  captcha: string; // 验证码
  captchaId?: string; // 验证码ID
}

// ========== 注册接口参数（匹配后端user_account.RegisterRequest） ==========
export interface RegisterParams {
  username: string;
  target: string; // 手机号/邮箱
  target_type: number; // 1=手机，2=邮箱
  password: string;
  captcha: string;
  user_type: number; // 1=普通，2=商户
}

// ========== 通用返回类型 ==========
export interface baseResp {
  code: number;
  msg: string;
}

// ========== 接口定义 ==========
export const authAPI = {
  generateCaptcha: (data: GenerateCaptchaParams) =>
    request.post<GenerateCaptchaResp>('/verify_code/generate', data),
  register: (data: RegisterParams) =>
    request.post<{ baseResp: baseResp }>('/user/register', data),
  login: (data: LoginParams) =>
    request.post<LoginResponse>('/user/login', data),
};
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
// ========== 商户相关类型（和现有authAPI/productAPI风格对齐） ==========
// 商户基础类型（对齐后端Model，和现有LoginForm/RegisterForm风格一致）
export interface Merchant {
  id: number;
  name?: string; // 可选，后端返回名称为空时自动忽略
}

// 商户列表响应类型（匹配后端真实返回结构：baseResp + data）
// 复用你已定义的BaseResp，避免重复定义
interface ListMerchantResponse {
  baseResp: BaseResp; // 复用现有BaseResp（{code: number; msg: string}）
  data: Merchant[]; // 商户列表数据
}

// ========== 商户接口定义（和skuAPI/listSku风格完全一致） ==========
export const merchantAPI = {
  // 查询所有商户ID列表（GET请求，无入参）
  // 风格对齐：request.get<返回类型>('路径')，和现有post风格统一
  listMerchant: () => request.get<ListMerchantResponse>('/list_merchant'),
};

// ========== 复用你已定义的BaseResp（无需重复定义，此处仅标注来源） ==========
// 注：以下BaseResp已在你的authAPI代码中定义，此处仅为说明，无需重复编写
// interface BaseResp {
//   code: number;
//   msg: string;
// }
export interface OrderItem {
  product_id: number; // 原ProductID → product_id
  sku_id: number; // 原SkuID → sku_id
  count: number; // 原Count → count
  price: number; // 原Price → price
  ext?: Record<string, string>; // 原Ext → ext
}

export interface CreateOrderParams {
  type: number; // 原Type → type
  status: number; // 原Status → status
  resp_user_id?: number; // 原RespUserID → resp_user_id
  items: OrderItem[]; // 原Items → items
  ext?: Record<string, string>; // 原Ext → ext
}

export interface CreateOrderResponse {
  baseResp: {
    code: number;
    msg: string;
  };
  order_id?: string;
}

/** QueryOrderIdType枚举（IDL：1=REQ_USER 发起人，2=RESP_USER 接收人） */
export enum QueryOrderIdType {
  REQ_USER = 1,
  RESP_USER = 2,
}

/** 查询订单ID列表请求参数（下划线命名，对齐API） */
export interface QueryOrderIdParams {
  type: QueryOrderIdType;
  user_id?: number; // REQ_USER/RESP_USER场景必填，非负
  ext_key?: string; // EXT_KEY场景必填
  ext_val?: string; // EXT_KEY场景必填
  page?: number; // 默认1，≥1
  page_size?: number; // 默认20，1≤page_size≤100
}

/** 查询订单ID列表响应（下划线命名，对齐API） */
export interface QueryOrderIdResponse {
  baseResp: {
    code: number;
    msg: string;
  };
  order_id: string[]; // 订单ID列表（MongoDB ObjectID字符串）
  total: number; // 总订单数
  page: number;
  page_size: number;
}

/** 订单商品明细（下划线命名，对齐API） */
export interface OrderItem {
  product_id: number;
  sku_id: number;
  count: number;
  price: number;
  ext?: Record<string, string>;
}

/** 订单详情（下划线命名，对齐API） */
export interface Order {
  id: string; // MongoDB ObjectID字符串
  type: number;
  status: number;
  req_user_id: number; // 发起人ID（下划线）
  resp_user_id: number; // 接收人ID（下划线）
  items: OrderItem[]; // 商品明细
  created_at: string; // 时间字符串（下划线）
  updated_at: string; // 时间字符串（下划线）
  ext?: Record<string, string>;
}

/** 查询订单详情请求参数（下划线命名，对齐API） */
export interface QueryOrderInfoParams {
  id: string; // 订单ID（MongoDB ObjectID字符串）
}

/** 查询订单详情响应（下划线命名，对齐API） */
export interface QueryOrderInfoResponse {
  baseResp: {
    code: number;
    msg: string;
  };
  order: Order;
}

export const orderAPI = {
  createOrder: (data: CreateOrderParams) =>
    request.post<CreateOrderResponse>('/create', data),
  // 查询订单ID列表（新增，仿照createOrder风格）
  queryOrderId: (data: QueryOrderIdParams) =>
    request.post<QueryOrderIdResponse>('/query_order_id', data),
  // 查询订单详情（新增，仿照createOrder风格）
  queryOrderInfo: (data: QueryOrderInfoParams) =>
    request.post<QueryOrderInfoResponse>('/query_order_info', data),
};

export interface CreateOrderParams {
  type: number;
  status: number;
  resp_user_id?: number;
  items: OrderItem[];
  ext?: Record<string, string>;
}

export interface CreateOrderResponse {
  baseResp: {
    code: number;
    msg: string;
  };
  order_id?: string;
}
