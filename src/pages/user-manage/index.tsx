import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Badge,
  Button,
  Dropdown,
  Modal,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  banUsers,
  destroyUser,
  dumpUserCSV,
  fetchUsers,
  resetUserSecret,
} from '@/services/swagger/user';
import GenerateUserModal from './components/GenerateUserModal';
import SendMailModal from './components/SendMailModal';
import UserFormModal from './components/UserFormModal';

const { Text } = Typography;

const formatBytes = (bytes?: number | null): string => {
  if (bytes == null) return '-';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return parseFloat((bytes / k ** i).toFixed(2)) + ' ' + sizes[i];
};

const UserManagePage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<API.UserItem | undefined>();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [sendMailOpen, setSendMailOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.UserItem[]>([]);
  const [currentFilter, setCurrentFilter] = useState<API.UserFilter[]>([]);

  const columns: ProColumns<API.UserItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 70,
      search: false,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text
            style={{ cursor: 'pointer', color: '#1677ff' }}
            onClick={() => {
              setCurrentUser(record);
              setEditOpen(true);
            }}
          >
            {record.email}
          </Text>
          {record.plan && (
            <Tag color="blue" style={{ fontSize: 11 }}>
              {record.plan.name}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '搜索邮箱',
      dataIndex: 'email_search',
      hideInTable: true,
    },
    {
      title: '状态',
      dataIndex: 'banned',
      width: 80,
      search: false,
      render: (_, record) =>
        record.banned ? (
          <Badge status="error" text="封禁" />
        ) : (
          <Badge status="success" text="正常" />
        ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      width: 100,
      search: false,
      render: (_, record) =>
        record.balance != null ? `¥${Number(record.balance).toFixed(2)}` : '-',
    },
    {
      title: '佣金余额',
      dataIndex: 'commission_balance',
      width: 100,
      search: false,
      render: (_, record) =>
        record.commission_balance != null
          ? `¥${Number(record.commission_balance).toFixed(2)}`
          : '-',
    },
    {
      title: '流量使用',
      key: 'traffic',
      width: 160,
      search: false,
      render: (_, record) => {
        const used = (record.u ?? 0) + (record.d ?? 0);
        const total = record.transfer_enable;
        return (
          <Space direction="vertical" size={0} style={{ fontSize: 12 }}>
            <span>已用：{formatBytes(used)}</span>
            <span>总量：{formatBytes(total)}</span>
          </Space>
        );
      },
    },
    {
      title: '到期时间',
      dataIndex: 'expired_at',
      width: 150,
      search: false,
      render: (_, record) => {
        if (!record.expired_at) return <Tag color="green">长期有效</Tag>;
        const expired = dayjs.unix(record.expired_at);
        const isExpired = expired.isBefore(dayjs());
        return (
          <Tag color={isExpired ? 'red' : 'default'}>
            {expired.format('YYYY-MM-DD HH:mm')}
          </Tag>
        );
      },
    },
    {
      title: '邀请人',
      dataIndex: 'invite_user',
      width: 160,
      search: false,
      render: (_, record) =>
        record.invite_user ? (
          <Tooltip title={`ID: ${record.invite_user.id}`}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.invite_user.email}
            </Text>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '角色',
      key: 'roles',
      width: 110,
      search: false,
      render: (_, record) => (
        <Space size={2} wrap>
          {record.is_admin ? <Tag color="gold">管理员</Tag> : null}
          {record.is_staff ? <Tag color="cyan">员工</Tag> : null}
        </Space>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 155,
      search: false,
      render: (_, record) =>
        record.created_at
          ? dayjs.unix(record.created_at).format('YYYY-MM-DD HH:mm:ss')
          : '-',
    },
    {
      title: '操作',
      key: 'option',
      valueType: 'option',
      width: 180,
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setCurrentUser(record);
            setEditOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="resetSecret"
          onClick={() => {
            modalApi.confirm({
              title: '确认重置密钥？',
              content: '将重新生成 token 和 UUID，原订阅链接将失效。',
              onOk: async () => {
                const res = await resetUserSecret({ id: record.id });
                if (res.code !== 0) {
                  messageApi.error(res.msg || '重置失败');
                  return;
                }
                messageApi.success('密钥已重置');
                actionRef.current?.reload();
              },
            });
          }}
        >
          重置密钥
        </a>,
        <Dropdown
          key="more"
          menu={{
            items: [
              {
                key: 'ban',
                label: record.banned ? '解封' : '封禁',
                onClick: async () => {
                  const res = await banUsers({
                    filter: [{ id: 'id', value: String(record.id) }],
                  });
                  if (res.code !== 0) {
                    messageApi.error(res.msg || '操作失败');
                    return;
                  }
                  messageApi.success(record.banned ? '已解封' : '已封禁');
                  actionRef.current?.reload();
                },
              },
              {
                key: 'subscribe',
                label: '复制订阅链接',
                onClick: () => {
                  if (record.subscribe_url) {
                    navigator.clipboard.writeText(record.subscribe_url);
                    messageApi.success('订阅链接已复制');
                  } else {
                    messageApi.warning('暂无订阅链接');
                  }
                },
              },
              { type: 'divider' },
              {
                key: 'delete',
                label: <span style={{ color: '#ff4d4f' }}>删除</span>,
                onClick: () => {
                  modalApi.confirm({
                    title: `确认删除用户 ${record.email}？`,
                    content:
                      '此操作将删除该用户及其所有订单、邀请码、工单等关联数据，不可恢复！',
                    okType: 'danger',
                    onOk: async () => {
                      const res = await destroyUser({ id: record.id });
                      if (res.code !== 0) {
                        messageApi.error(res.msg || '删除失败');
                        return;
                      }
                      messageApi.success('用户已删除');
                      actionRef.current?.reload();
                    },
                  });
                },
              },
            ],
          }}
        >
          <a>更多</a>
        </Dropdown>,
      ],
    },
  ];

  const handleExportCSV = async () => {
    try {
      const blob = await dumpUserCSV({ filter: currentFilter });
      const url = window.URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_${dayjs().format('YYYY-MM-DD_HHmmss')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      messageApi.success('CSV 导出成功');
    } catch {
      messageApi.error('导出失败');
    }
  };

  return (
    <PageContainer>
      <ProTable<API.UserItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedRows.map((r) => r.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
          <Space>
            <span>已选 {selectedRowKeys.length} 项</span>
            <a onClick={onCleanSelected}>取消选择</a>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <a
              onClick={() => {
                setCurrentFilter(
                  selectedRows.map((r) => ({ id: 'id', value: String(r.id) })),
                );
                setSendMailOpen(true);
              }}
            >
              批量发邮件
            </a>
            <a
              style={{ color: '#ff4d4f' }}
              onClick={() => {
                modalApi.confirm({
                  title: `确认封禁选中的 ${selectedRows.length} 个用户？`,
                  okType: 'danger',
                  onOk: async () => {
                    const res = await banUsers({
                      filter: selectedRows.map((r) => ({
                        id: 'id',
                        value: String(r.id),
                      })),
                    });
                    if (res.code !== 0) {
                      messageApi.error(res.msg || '封禁失败');
                      return;
                    }
                    messageApi.success('已封禁选中用户');
                    setSelectedRows([]);
                    actionRef.current?.reload();
                  },
                });
              }}
            >
              批量封禁
            </a>
          </Space>
        )}
        request={async (params) => {
          const filter: API.UserFilter[] = [];
          if (params.email_search) {
            filter.push({ id: 'email', value: `like:${params.email_search}` });
          }
          setCurrentFilter(filter);
          const res = await fetchUsers({
            current: params.current,
            pageSize: params.pageSize,
            filter: filter.length ? filter : undefined,
            sort: [{ id: 'created_at', desc: true }],
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '列表获取失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: (res.data as any)?.data || [],
            success: true,
            total: (res.data as any)?.total || 0,
          };
        }}
        pagination={{ defaultPageSize: 15, showSizeChanger: true }}
        toolBarRender={() => [
          <Button key="generate" onClick={() => setGenerateOpen(true)}>
            生成用户
          </Button>,
          <Button
            key="sendMail"
            onClick={() => {
              setCurrentFilter([]);
              setSendMailOpen(true);
            }}
          >
            批量发邮件
          </Button>,
          <Button key="export" onClick={handleExportCSV}>
            导出 CSV
          </Button>,
        ]}
        scroll={{ x: 1400 }}
        size="small"
        bordered
      />

      {/* Edit modal */}
      <UserFormModal
        open={editOpen}
        current={currentUser}
        onOpenChange={setEditOpen}
        onSuccess={() => {
          setEditOpen(false);
          actionRef.current?.reload();
        }}
      />

      {/* Generate user modal */}
      <GenerateUserModal
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onSuccess={() => actionRef.current?.reload()}
      />

      {/* Send mail modal */}
      <SendMailModal
        open={sendMailOpen}
        filter={currentFilter}
        onOpenChange={setSendMailOpen}
        onSuccess={() => setSendMailOpen(false)}
      />
    </PageContainer>
  );
};

export default UserManagePage;
