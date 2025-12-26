import { parseJwt } from '@/routes/page';
import { useNavigate } from '@modern-js/runtime/router';
import {
  type Order,
  type OrderItem,
  type QueryOrderIdParams,
  QueryOrderIdType,
  type QueryOrderInfoParams,
  orderAPI,
} from 'api';
import { useCallback, useEffect, useState } from 'react';

// JWT Payload类型（和商品管理页保持一致）
interface JwtPayload {
  user_id: number; // 对应token中的商户ID
  user_type: number;
}

export default function OrderListPage() {
  const navigate = useNavigate();

  // --------------- 状态管理（全明确类型，无 any）---------------
  const [orderIdList, setOrderIdList] = useState<string[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [orderDetail, setOrderDetail] = useState<Order | null>(null); // 替换 any 为 Order 类型
  const [loading, setLoading] = useState<boolean>(false);
  const [userType, setUserType] = useState<QueryOrderIdType>(
    QueryOrderIdType.REQ_USER,
  );
  const [userTypeDesc, setUserTypeDesc] =
    useState<string>('我的订单（发起人）');

  // --------------- 核心逻辑（无 any）---------------
  const parseUserTypeFromJWT = useCallback(() => {
    try {
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
      const userRole = payload.user_type;

      if (userRole === 1) {
        setUserType(QueryOrderIdType.REQ_USER);
        setUserTypeDesc('我的订单（发起人）');
      } else {
        setUserType(QueryOrderIdType.RESP_USER);
        setUserTypeDesc('我的订单（接收人）');
      }
    } catch (e) {
      console.error('解析用户类型失败：', e);
      alert('解析用户信息失败，默认展示发起人订单');
    }
  }, [navigate]);

  const getCurrentUserId = useCallback((): number => {
    try {
      const token = localStorage.getItem('user_token');
      const payload = token?.split('.')[1];
      const decoded = payload
        ? (JSON.parse(atob(payload)) as { user_id?: number })
        : {}; // 明确解析类型
      const userId = decoded.user_id || 0;
      return userId < 0 ? 0 : userId;
    } catch (e) {
      return 0;
    }
  }, []);

  const fetchOrderIdList = useCallback(async () => {
    setLoading(true);
    try {
      const currentPage = page < 1 ? 1 : page;
      const currentPageSize =
        pageSize < 1 ? 20 : pageSize > 100 ? 100 : pageSize;

      const reqParams: QueryOrderIdParams = {
        type: userType,
        user_id: getCurrentUserId(),
        page: currentPage,
        page_size: currentPageSize,
      };

      const res = await orderAPI.queryOrderId(reqParams);
      const responseData = res.data;
      const baseResp = responseData.baseResp || { code: -1, msg: '未知错误' };

      if (baseResp.code !== 0) {
        throw new Error(baseResp.msg || '查询订单ID列表失败');
      }

      setOrderIdList(
        Array.isArray(responseData.order_id) ? responseData.order_id : [],
      );
      setTotal(responseData.total || 0);
      setPage(responseData.page || currentPage);
      setPageSize(responseData.page_size || currentPageSize);
    } catch (e) {
      alert(
        `加载订单ID列表失败：${e instanceof Error ? e.message : '未知错误'}`,
      );
      console.error('订单ID列表加载错误：', e);
    } finally {
      setLoading(false);
    }
  }, [userType, page, pageSize, getCurrentUserId]);

  const fetchOrderDetail = useCallback(async (orderId: string) => {
    setLoading(true);
    try {
      const reqParams: QueryOrderInfoParams = { id: orderId };
      const res = await orderAPI.queryOrderInfo(reqParams);
      const responseData = res.data;
      const baseResp = responseData.baseResp || { code: -1, msg: '未知错误' };

      if (baseResp.code !== 0) {
        throw new Error(baseResp.msg || '查询订单详情失败');
      }

      setOrderDetail(responseData.order || null);
    } catch (e) {
      alert(`加载订单详情失败：${e instanceof Error ? e.message : '未知错误'}`);
      console.error('订单详情加载错误：', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------- 交互回调（无 any）---------------
  const handleSelectOrderId = useCallback(
    (orderId: string) => {
      setSelectedOrderId(orderId);
      fetchOrderDetail(orderId);
    },
    [fetchOrderDetail],
  );

  const handleChangePage = useCallback(
    (newPage: number) => {
      if (newPage < 1 || newPage > Math.ceil(total / pageSize)) return;
      setPage(newPage);
    },
    [total, pageSize],
  );

  const handleChangePageSize = useCallback((newSize: number) => {
    if (newSize < 1 || newSize > 100) return;
    setPageSize(newSize);
    setPage(1);
  }, []);

  const formatTime = useCallback((timeStr: string) => {
    if (!timeStr) return '无';
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch (e) {
      return timeStr;
    }
  }, []);

  const getOrderStatusText = useCallback((status: number) => {
    const statusMap = {
      0: '待处理',
      1: '已接单',
      2: '已完成',
      3: '已取消',
    };
    return statusMap[status as keyof typeof statusMap] || `未知状态(${status})`;
  }, []);

  // --------------- 挂载逻辑 ---------------
  useEffect(() => {
    parseUserTypeFromJWT();
  }, [parseUserTypeFromJWT]);

  useEffect(() => {
    if (userType) {
      fetchOrderIdList();
    }
  }, [userType, fetchOrderIdList]);

  // --------------- UI 渲染（无 any，item 明确为 OrderItem 类型）---------------
  return (
    <div style={{ padding: '20px' }}>
      <h1>订单管理</h1>

      {/* 订单ID列表（第一层） */}
      <div
        style={{
          marginBottom: '20px',
          paddingBottom: '10px',
          borderBottom: '1px solid #eee',
        }}
      >
        <h3>{userTypeDesc} - 订单ID列表</h3>

        {/* 分页控件 */}
        <div
          style={{
            marginBottom: '10px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            style={{
              padding: '4px 12px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.6 : 1,
            }}
            onClick={() => handleChangePage(1)}
            disabled={page === 1}
          >
            首页
          </button>
          <button
            type="button"
            style={{
              padding: '4px 12px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              opacity: page === 1 ? 0.6 : 1,
            }}
            onClick={() => handleChangePage(page - 1)}
            disabled={page === 1}
          >
            上一页
          </button>
          <span>
            第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页（总计 {total}{' '}
            条）
          </span>
          <button
            type="button"
            style={{
              padding: '4px 12px',
              cursor:
                page >= Math.ceil(total / pageSize) ? 'not-allowed' : 'pointer',
              opacity: page >= Math.ceil(total / pageSize) ? 0.6 : 1,
            }}
            onClick={() => handleChangePage(page + 1)}
            disabled={page >= Math.ceil(total / pageSize)}
          >
            下一页
          </button>
          <button
            type="button"
            style={{
              padding: '4px 12px',
              cursor:
                page >= Math.ceil(total / pageSize) ? 'not-allowed' : 'pointer',
              opacity: page >= Math.ceil(total / pageSize) ? 0.6 : 1,
            }}
            onClick={() => handleChangePage(Math.ceil(total / pageSize))}
            disabled={page >= Math.ceil(total / pageSize)}
          >
            尾页
          </button>
          <select
            value={pageSize}
            onChange={e => handleChangePageSize(Number(e.target.value))}
            style={{ padding: '4px' }}
          >
            <option value={10}>10条/页</option>
            <option value={20}>20条/页</option>
            <option value={50}>50条/页</option>
            <option value={100}>100条/页</option>
          </select>
        </div>

        {/* 订单ID列表内容 */}
        {loading ? (
          <div>加载订单ID中...</div>
        ) : orderIdList.length === 0 ? (
          <div>暂无订单</div>
        ) : (
          orderIdList.map(orderId => (
            <button
              type="button"
              key={orderId}
              style={{
                border:
                  selectedOrderId === orderId
                    ? '1px solid #1890ff'
                    : '1px solid #eee',
                borderRadius: '4px',
                padding: '10px 12px',
                margin: '5px 0',
                width: '200px',
                textAlign: 'left',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                outline: 'none',
                font: 'inherit',
                lineHeight: '1.4',
                whiteSpace: 'normal',
                wordBreak: 'break-all',
              }}
              onClick={() => handleSelectOrderId(orderId)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectOrderId(orderId);
                }
              }}
            >
              <div style={{ marginBottom: '4px' }}>订单ID</div>
              <div>{orderId}</div>
            </button>
          ))
        )}
      </div>

      {/* 订单详情（第二层） */}
      {selectedOrderId ? (
        <div>
          <h3>订单 {selectedOrderId} 详情</h3>
          {loading ? (
            <div>加载订单详情中...</div>
          ) : !orderDetail ? (
            <div>订单详情加载失败</div>
          ) : (
            <div
              style={{
                border: '1px solid #eee',
                borderRadius: '4px',
                padding: '10px',
                marginTop: '10px',
              }}
            >
              {/* 订单基础信息 */}
              <div
                style={{
                  marginBottom: '10px',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #f5f5f5',
                }}
              >
                <div>订单ID：{orderDetail.id}</div>
                <div>订单类型：{orderDetail.type}</div>
                <div>订单状态：{getOrderStatusText(orderDetail.status)}</div>
                <div>发起人ID：{orderDetail.req_user_id}</div>
                <div>接收人ID：{orderDetail.resp_user_id}</div>
                <div>创建时间：{formatTime(orderDetail.created_at)}</div>
                <div>更新时间：{formatTime(orderDetail.updated_at)}</div>
                <div>扩展字段：{JSON.stringify(orderDetail.ext || {})}</div>
              </div>

              {/* 订单商品明细（item 明确为 OrderItem 类型） */}
              <div>
                <h4>商品明细</h4>
                {orderDetail.items.length === 0 ? (
                  <div>无商品明细</div>
                ) : (
                  orderDetail.items.map(
                    (
                      item: OrderItem, // 明确指定 OrderItem 类型
                    ) => (
                      <div
                        key={`${item.product_id}-${item.sku_id}`}
                        style={{
                          margin: '5px 0',
                          padding: '5px',
                          borderBottom: '1px solid #f5f5f5',
                        }}
                      >
                        <div>商品ID：{item.product_id}</div>
                        <div>规格ID：{item.sku_id}</div>
                        <div>数量：{item.count} 件</div>
                        <div>单价：¥{(item.price / 100).toFixed(2)}</div>
                        <div>扩展字段：{JSON.stringify(item.ext || {})}</div>
                      </div>
                    ),
                  )
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: '#999' }}>请选择上方订单ID，查看其详情</div>
      )}
    </div>
  );
}
