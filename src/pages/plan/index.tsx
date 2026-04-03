import { PageContainer } from '@ant-design/pro-components';
import {
  App,
  Button,
  Divider,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  dropPlan,
  fetchPlans,
  sortPlans,
  updatePlan,
} from '@/services/swagger/plan';
import { fetchServerGroups } from '@/services/server/api';
import PlanFormModal from './components/PlanFormModal';

const { Text } = Typography;

const PERIOD_LABELS: Record<string, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  half_yearly: '半年付',
  yearly: '年付',
  two_yearly: '两年付',
  three_yearly: '三年付',
  onetime: '一次性',
  reset_traffic: '重置流量',
};

const RESET_METHOD_LABELS: Record<number, string> = {
  0: '每月1号',
  1: '按月（订阅日）',
  2: '不重置',
  3: '每年1月1日',
  4: '按年',
};

// const formatBytes = (bytes: number): string => {
//   if (bytes >= 1024 ** 4) return (bytes / 1024 ** 4).toFixed(1) + ' TB';
//   if (bytes >= 1024 ** 3) return (bytes / 1024 ** 3).toFixed(1) + ' GB';
//   if (bytes >= 1024 ** 2) return (bytes / 1024 ** 2).toFixed(1) + ' MB';
//   return bytes + ' B';
// };

const formatBytes = (bytes: number): string => {
  return bytes + ' GB';
};

const PlanPage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const [plans, setPlans] = useState<API.PlanItem[]>([]);
  const [groups, setGroups] = useState<API.ServerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<API.PlanItem | undefined>();
  const [switchLoading, setSwitchLoading] = useState<Record<string, boolean>>(
    {},
  );
  const dragIdRef = useRef<number | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    const res = await fetchPlans();
    setLoading(false);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取套餐列表失败');
      return;
    }
    setPlans(res.data ?? []);
  };

  useEffect(() => {
    loadPlans();
    fetchServerGroups().then((res) => {
      if (res.data) setGroups(res.data);
    });
  }, []);

  const handleToggle = async (
    plan: API.PlanItem,
    field: 'show' | 'renew' | 'sell',
    val: boolean,
  ) => {
    const key = `${plan.id}_${field}`;
    setSwitchLoading((s) => ({ ...s, [key]: true }));
    const res = await updatePlan({ id: plan.id, [field]: val });
    setSwitchLoading((s) => ({ ...s, [key]: false }));
    if (res.code !== 0) {
      messageApi.error(res.msg || '更新失败');
      return;
    }
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, [field]: val } : p)),
    );
  };

  const handleDelete = (plan: API.PlanItem) => {
    modalApi.confirm({
      title: `确认删除套餐「${plan.name}」？`,
      content: '套餐下存在用户或订单时无法删除。',
      okType: 'danger',
      onOk: async () => {
        const res = await dropPlan({ id: plan.id });
        if (res.code !== 0) {
          messageApi.error(res.msg || '删除失败');
          return;
        }
        messageApi.success('套餐已删除');
        loadPlans();
      },
    });
  };

  // Drag-to-reorder
  const handleDragStart = (id: number) => {
    dragIdRef.current = id;
  };

  const handleDrop = async (targetId: number) => {
    if (dragIdRef.current == null || dragIdRef.current === targetId) return;
    const ids = plans.map((p) => p.id);
    const fromIdx = ids.indexOf(dragIdRef.current);
    const toIdx = ids.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newIds = [...ids];
    newIds.splice(fromIdx, 1);
    newIds.splice(toIdx, 0, dragIdRef.current);
    setPlans(newIds.map((id) => plans.find((p) => p.id === id)!));
    const res = await sortPlans({ ids: newIds });
    if (res.code !== 0) {
      messageApi.error(res.msg || '排序失败');
      loadPlans();
    }
    dragIdRef.current = null;
  };

  return (
    <PageContainer
      extra={[
        <Button
          key="add"
          type="primary"
          onClick={() => {
            setCurrentPlan(undefined);
            setFormOpen(true);
          }}
        >
          新增套餐
        </Button>,
      ]}
    >
      <Table<API.PlanItem>
        rowKey="id"
        dataSource={plans}
        loading={loading}
        pagination={false}
        size="middle"
        bordered
        onRow={(record) => ({
          draggable: true,
          onDragStart: () => handleDragStart(record.id),
          onDragOver: (e) => e.preventDefault(),
          onDrop: () => handleDrop(record.id),
          style: { cursor: 'grab' },
        })}
        columns={[
          {
            title: '排序',
            key: 'sort',
            width: 50,
            align: 'center',
            render: () => (
              <span style={{ cursor: 'grab', color: '#bbb', fontSize: 18 }}>
                ⠿
              </span>
            ),
          },
          {
            title: '套餐名称',
            dataIndex: 'name',
            render: (name, record) => (
              <Space direction="vertical" size={2}>
                <Text strong>{name}</Text>
                <Space size={4} wrap>
                  {(record.tags ?? []).map((t) => (
                    <Tag key={t} color="blue" style={{ fontSize: 11 }}>
                      {t}
                    </Tag>
                  ))}
                </Space>
              </Space>
            ),
          },
          {
            title: '流量 / 限速',
            key: 'traffic',
            width: 160,
            render: (_, r) => (
              <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
                <span>{formatBytes(r.transfer_enable)}</span>
                <Text type="secondary">
                  {r.speed_limit ? `${r.speed_limit} Mbps` : '不限速'} /{' '}
                  {r.device_limit ? `${r.device_limit} 设备` : '不限设备'}
                </Text>
              </Space>
            ),
          },
          {
            title: '流量重置',
            dataIndex: 'reset_traffic_method',
            width: 130,
            render: (v) =>
              v == null ? (
                <Text type="secondary">跟随系统</Text>
              ) : (
                (RESET_METHOD_LABELS[v] ?? String(v))
              ),
          },
          {
            title: '价格',
            key: 'prices',
            render: (_, r) => {
              const prices = r.prices ?? {};
              const entries = Object.entries(PERIOD_LABELS)
                .map(([key, label]) => {
                  const v = prices[key as keyof API.PlanPrices];
                  return v != null
                    ? { label, val: v }
                    : null;
                })
                .filter(Boolean);
              if (!entries.length) return <Text type="secondary">未定价</Text>;
              return (
                <Space wrap size={4}>
                  {entries.map((e) => (
                    <Tag key={e!.label} style={{ fontSize: 11 }}>
                      {e!.label} ¥{e!.val}
                    </Tag>
                  ))}
                </Space>
              );
            },
          },
          {
            title: '用户',
            key: 'users',
            width: 90,
            align: 'center',
            render: (_, r) => (
              <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
                <span>总计: {r.users_count ?? 0}</span>
                <Text type="success">活跃: {r.active_users_count ?? 0}</Text>
              </Space>
            ),
          },
          {
            title: '显示',
            dataIndex: 'show',
            width: 70,
            align: 'center',
            render: (v, r) => (
              <Switch
                size="small"
                checked={!!v}
                loading={!!switchLoading[`${r.id}_show`]}
                onChange={(val) => handleToggle(r, 'show', val)}
              />
            ),
          },
          {
            title: '续费',
            dataIndex: 'renew',
            width: 70,
            align: 'center',
            render: (v, r) => (
              <Switch
                size="small"
                checked={!!v}
                loading={!!switchLoading[`${r.id}_renew`]}
                onChange={(val) => handleToggle(r, 'renew', val)}
              />
            ),
          },
          {
            title: '购买',
            dataIndex: 'sell',
            width: 70,
            align: 'center',
            render: (v, r) => (
              <Switch
                size="small"
                checked={!!v}
                loading={!!switchLoading[`${r.id}_sell`]}
                onChange={(val) => handleToggle(r, 'sell', val)}
              />
            ),
          },
          {
            title: '权限组',
            key: 'group',
            width: 100,
            render: (_, r) =>
              r.group ? (
                <Tag>{r.group.name}</Tag>
              ) : (
                <Text type="secondary">-</Text>
              ),
          },
          {
            title: '人数上限',
            dataIndex: 'capacity_limit',
            width: 90,
            align: 'center',
            render: (v) => (v ? v : <Text type="secondary">不限</Text>),
          },
          {
            title: '操作',
            key: 'option',
            width: 130,
            render: (_, record) => (
              <Space split={<Divider type="vertical" />}>
                <a
                  onClick={() => {
                    setCurrentPlan(record);
                    setFormOpen(true);
                  }}
                >
                  编辑
                </a>
                <a
                  style={{ color: '#ff4d4f' }}
                  onClick={() => handleDelete(record)}
                >
                  删除
                </a>
              </Space>
            ),
          },
        ]}
      />

      <PlanFormModal
        open={formOpen}
        current={currentPlan}
        groups={groups}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          loadPlans();
        }}
      />
    </PageContainer>
  );
};

export default PlanPage;
