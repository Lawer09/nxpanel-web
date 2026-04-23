import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Tag, Space, Modal } from 'antd';
import React, { useRef, useState } from 'react';
import { fetchTickets, closeTicket } from '@/services/ticket/api';
import TicketDetailModal from './components/TicketDetailModal';

const LEVEL_MAP: Record<string, { text: string; color: string }> = {
  '0': { text: '低', color: 'default' },
  '1': { text: '中', color: 'warning' },
  '2': { text: '高', color: 'error' },
};

const STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '开启', color: 'success' },
  1: { text: '关闭', color: 'default' },
};

const REPLY_STATUS_MAP: Record<number, { text: string; color: string }> = {
  0: { text: '已回复', color: 'success' },
  1: { text: '待回复', color: 'warning' },
};

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
};

const TicketManage: React.FC = () => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<API.TicketItem | undefined>();

  // 监听从详情对话框切换工单的事件
  React.useEffect(() => {
    const handleOpenTicket = (e: CustomEvent<API.TicketItem>) => {
      setCurrentTicket(e.detail);
      setDetailModalOpen(true);
    };
    window.addEventListener('openTicket', handleOpenTicket as EventListener);
    return () => {
      window.removeEventListener('openTicket', handleOpenTicket as EventListener);
    };
  }, []);

  const handleBatchClose = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要关闭的工单');
      return;
    }

    modal.confirm({
      title: '确认关闭',
      content: `确定要关闭选中的 ${selectedRowKeys.length} 个工单吗？`,
      onOk: async () => {
        try {
          const promises = selectedRowKeys.map((id) =>
            closeTicket({ id: Number(id) }),
          );
          const results = await Promise.all(promises);
          const successCount = results.filter((res) => res.code === 0).length;
          
          if (successCount === selectedRowKeys.length) {
            message.success('批量关闭成功');
          } else {
            message.warning(`成功关闭 ${successCount}/${selectedRowKeys.length} 个工单`);
          }
          
          setSelectedRowKeys([]);
          actionRef.current?.reload();
        } catch (error) {
          message.error('批量关闭失败');
        }
      },
    });
  };

  const handleClose = async (record: API.TicketItem) => {
    modal.confirm({
      title: '确认关闭',
      content: `确定要关闭工单"${record.subject}"吗？`,
      onOk: async () => {
        const res = await closeTicket({ id: record.id });
        if (res.code === 0) {
          message.success('关闭成功');
          actionRef.current?.reload();
        } else {
          message.error(res.msg || '关闭失败');
        }
      },
    });
  };

  const columns: ProColumns<API.TicketItem>[] = [
    {
      title: '工单号',
      dataIndex: 'id',
      width: 100,
      search: false,
    },
    {
      title: '主题',
      dataIndex: 'subject',
      ellipsis: true,
      search: false,
    },
    {
      title: '用户邮箱',
      dataIndex: ['user', 'email'],
      width: 200,
      search: false,
      render: (_, record) => record.user?.email || '-',
    },
    {
      title: '优先级',
      dataIndex: 'level',
      width: 100,
      valueType: 'select',
      valueEnum: {
        '0': { text: '低' },
        '1': { text: '中' },
        '2': { text: '高' },
      },
      render: (_, record) => {
        const level = LEVEL_MAP[record.level] || LEVEL_MAP['0'];
        return <Tag color={level.color}>{level.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        0: { text: '开启' },
        1: { text: '关闭' },
      },
      render: (_, record) => {
        const status = STATUS_MAP[record.status];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '回复状态',
      dataIndex: 'reply_status',
      width: 120,
      search: false,
      render: (_, record) => {
        if (record.reply_status === null) return '-';
        const replyStatus = REPLY_STATUS_MAP[record.reply_status];
        return <Tag color={replyStatus.color}>{replyStatus.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      search: false,
      render: (_, record) => formatTimestamp(record.created_at),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 180,
      search: false,
      render: (_, record) => formatTimestamp(record.updated_at),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => [
        <a
          key="view"
          onClick={() => {
            setCurrentTicket(record);
            setDetailModalOpen(true);
          }}
        >
          查看
        </a>,
        record.status === 0 && (
          <a
            key="close"
            onClick={() => handleClose(record)}
            style={{ color: '#ff4d4f' }}
          >
            关闭
          </a>
        ),
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.TicketItem>
        headerTitle="工单管理"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="batchClose"
            danger
            disabled={selectedRowKeys.length === 0}
            onClick={handleBatchClose}
          >
            批量关闭 ({selectedRowKeys.length})
          </Button>,
        ]}
        request={async (params) => {
          const res = await fetchTickets({
            page: params.current || 1,
            pageSize: params.pageSize || 10,
            status: params.status !== undefined ? Number(params.status) : undefined,
            email: params.email,
          });
          
          if (res.code !== 0) {
            message.error(res.msg || '获取工单列表失败');
            return {
              data: [],
              total: 0,
              success: false,
            };
          }

          return {
            data: res.data?.data || [],
            total: res.data?.total || 0,
            success: true,
          };
        }}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys),
          preserveSelectedRowKeys: true,
        }}
        scroll={{ x: 1200 }}
      />

      <TicketDetailModal
        open={detailModalOpen}
        ticket={currentTicket}
        onClose={() => {
          setDetailModalOpen(false);
          setCurrentTicket(undefined);
        }}
        onSuccess={() => {
          actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
};

export default TicketManage;
