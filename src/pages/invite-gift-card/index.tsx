import { GiftOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { App, Badge, Button, Modal, Space, Tag, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import {
  batchDeleteInviteGiftCardRules,
  deleteInviteGiftCardRule,
  fetchInviteGiftCardRules,
  getInviteGiftCardStatistics,
  toggleInviteGiftCardRule,
} from '@/services/invite-gift-card/api';
import RuleFormModal from './components/RuleFormModal';
import StatisticsPanel from './components/StatisticsPanel';

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleString();
};

const TRIGGER_TYPE_MAP: Record<string, { text: string; color: string }> = {
  register: { text: '注册', color: 'blue' },
  order_paid: { text: '订单支付', color: 'green' },
};

const TARGET_MAP: Record<string, { text: string; color: string }> = {
  inviter: { text: '邀请人', color: 'purple' },
  invitee: { text: '被邀请人', color: 'cyan' },
  both: { text: '双方', color: 'orange' },
};

const InviteGiftCardRulePage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const { message: messageApi, modal } = App.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.InviteGiftCardRule>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const {
    data: statsData,
    loading: statsLoading,
    run: refreshStats,
  } = useRequest(getInviteGiftCardStatistics, {
    onSuccess: () => {
      actionRef.current?.reload();
    },
  });

  const handleToggle = async (record: API.InviteGiftCardRule) => {
    const res = await toggleInviteGiftCardRule({ id: record.id });
    if (res.code !== 0) {
      messageApi.error(res.msg || '状态切换失败');
      return;
    }
    messageApi.success(`已${res.data?.status ? '启用' : '禁用'}`);
    actionRef.current?.reload();
    refreshStats();
  };

  const handleDelete = async (record: API.InviteGiftCardRule) => {
    modal.confirm({
      title: '确认删除',
      content: `确定要删除规则"${record.name}"吗？`,
      onOk: async () => {
        const res = await deleteInviteGiftCardRule({ id: record.id });
        if (res.code !== 0) {
          messageApi.error(res.msg || '删除失败');
          return;
        }
        messageApi.success('删除成功');
        actionRef.current?.reload();
        refreshStats();
      },
    });
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      messageApi.warning('请选择要删除的规则');
      return;
    }

    modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条规则吗？`,
      onOk: async () => {
        const res = await batchDeleteInviteGiftCardRules({
          ids: selectedRowKeys.map((k) => Number(k)),
        });
        if (res.code !== 0) {
          messageApi.error(res.msg || '批量删除失败');
          return;
        }

        const { deleted_count, failed_count, failed } = res.data || {};
        if (failed_count && failed_count > 0) {
          modal.warning({
            title: '部分删除失败',
            content: (
              <div>
                <p>成功删除: {deleted_count} 条</p>
                <p>删除失败: {failed_count} 条</p>
                <ul>
                  {failed?.map((item: API.InviteGiftCardBatchDeleteResult['failed'][number]) => (
                    <li key={item.id}>
                      {item.name}: {item.reason}
                    </li>
                  ))}
                </ul>
              </div>
            ),
          });
        } else {
          messageApi.success(`成功删除 ${deleted_count} 条规则`);
        }

        setSelectedRowKeys([]);
        actionRef.current?.reload();
        refreshStats();
      },
    });
  };

  const columns: ProColumns<API.InviteGiftCardRule>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '规则名称',
      dataIndex: 'name',
      width: 180,
      render: (_, record) => (
        <Tooltip title={record.description}>
          <a
            onClick={() => {
              setCurrentRow(record);
              setFormOpen(true);
            }}
          >
            {record.name}
          </a>
        </Tooltip>
      ),
    },
    {
      title: '搜索',
      dataIndex: 'search',
      hideInTable: true,
    },
    {
      title: '触发类型',
      dataIndex: 'trigger_type',
      width: 120,
      valueEnum: {
        register: { text: '注册', status: 'Processing' },
        order_paid: { text: '订单支付', status: 'Success' },
      },
      render: (_, record) => {
        const config = TRIGGER_TYPE_MAP[record.trigger_type];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: '发放对象',
      dataIndex: 'target',
      width: 120,
      search: false,
      render: (_, record) => {
        const config = TARGET_MAP[record.target];
        return <Tag color={config?.color}>{config?.text}</Tag>;
      },
    },
    {
      title: '礼品卡模板',
      dataIndex: ['template', 'name'],
      width: 150,
      search: false,
      render: (_, record) => (
        <Tooltip title={record.template?.description}>
          <Space>
            <GiftOutlined />
            {record.template?.name || '-'}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '自动兑换',
      dataIndex: 'auto_redeem',
      width: 100,
      search: false,
      render: (_, record) =>
        record.auto_redeem ? (
          <Tag color="success">是</Tag>
        ) : (
          <Tag color="default">否</Tag>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        true: { text: '启用', status: 'Success' },
        false: { text: '禁用', status: 'Default' },
      },
      render: (_, record) => (
        <Badge
          status={record.status ? 'success' : 'default'}
          text={record.status ? '启用' : '禁用'}
        />
      ),
    },
    {
      title: '发放统计',
      width: 200,
      search: false,
      render: (_, record) => {
        const stats = record.statistics;
        if (!stats) return '-';
        return (
          <Space direction="vertical" size={0}>
            <span>总计: {stats.total_issued}</span>
            <span style={{ fontSize: 12, color: '#999' }}>
              已兑换: {stats.auto_redeemed_count} | 用户: {stats.unique_recipients}
            </span>
          </Space>
        );
      },
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      search: false,
      render: (_, record) => formatTimestamp(record.created_at),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 180,
      fixed: 'right',
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setCurrentRow(record);
            setFormOpen(true);
          }}
        >
          编辑
        </a>,
        <a key="toggle" onClick={() => handleToggle(record)}>
          {record.status ? '禁用' : '启用'}
        </a>,
        <a key="delete" onClick={() => handleDelete(record)}>
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <StatisticsPanel data={statsData} loading={statsLoading} />
      <ProTable<API.InviteGiftCardRule>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await fetchInviteGiftCardRules({
            current: params.current,
            pageSize: params.pageSize,
            trigger_type: params.trigger_type as API.TriggerType,
            status: params.status === 'true' ? true : params.status === 'false' ? false : undefined,
            search: params.search,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取列表失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data || [],
            success: true,
            total: res.data?.total || 0,
          };
        }}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            onClick={() => {
              setCurrentRow(undefined);
              setFormOpen(true);
            }}
          >
            新增规则
          </Button>,
          <Button key="refresh" onClick={() => refreshStats()}>
            刷新统计
          </Button>,
        ]}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
        }}
        tableAlertRender={({ selectedRowKeys }) => (
          <Space>
            已选择 <a>{selectedRowKeys.length}</a> 项
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <Button danger size="small" onClick={handleBatchDelete}>
              批量删除
            </Button>
            <a onClick={() => setSelectedRowKeys([])}>取消选择</a>
          </Space>
        )}
        scroll={{ x: 1400 }}
      />
      <RuleFormModal
        open={formOpen}
        current={currentRow}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        onSuccess={() => {
          actionRef.current?.reload();
          refreshStats();
        }}
      />
    </PageContainer>
  );
};

export default InviteGiftCardRulePage;
