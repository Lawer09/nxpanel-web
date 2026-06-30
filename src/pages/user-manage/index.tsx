import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import {
  App,
  Badge,
  Button,
  Card,
  Descriptions,
  Dropdown,
  Popover,
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
} from '@/services/user/api';
import AidLoginBanRuleModal from './components/AidLoginBanRuleModal';
import BlockedIpModal from './components/BlockedIpModal';
import GenerateUserModal from './components/GenerateUserModal';
import SendMailModal from './components/SendMailModal';
import UserDetailDrawer from './components/UserDetailDrawer';
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

const formatReportTrafficMb = (value?: number | string | null): string => {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  if (!Number.isFinite(num)) return '-';
  const mb = num > 1024 * 1024 ? num / (1024 * 1024) : num;
  return `${mb.toFixed(2)} MB`;
};

const formatCreatedAtQueryValue = (
  value: unknown,
  endOfDay = false,
): string | number | undefined => {
  if (value == null || value === '') return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return `${trimmed} ${endOfDay ? '23:59:59' : '00:00:00'}`;
    }
    const parsed = dayjs(trimmed);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD HH:mm:ss') : trimmed;
  }
  const parsed = dayjs(value as dayjs.ConfigType);
  if (!parsed.isValid()) return undefined;
  return (endOfDay ? parsed.endOf('day') : parsed).format('YYYY-MM-DD HH:mm:ss');
};

const renderMetaValue = (
  value?: string | number | null,
  maxWidth = 170,
): React.ReactNode => {
  if (value == null || value === '') return '-';
  const text = String(value);
  return (
    <Tooltip title={text}>
      <span
        style={{
          display: 'inline-block',
          maxWidth,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          verticalAlign: 'bottom',
        }}
      >
        {text}
      </span>
    </Tooltip>
  );
};

const UserManagePage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<API.UserItem | undefined>();
  const [generateOpen, setGenerateOpen] = useState(false);
  const [sendMailOpen, setSendMailOpen] = useState(false);
  const [blockedIpOpen, setBlockedIpOpen] = useState(false);
  const [banRuleOpen, setBanRuleOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.UserItem[]>([]);
  const [currentFilter, setCurrentFilter] = useState<API.UserFilter[]>([]);
  const [currentQuery, setCurrentQuery] = useState<API.UserFetchParams>({
    current: 1,
    pageSize: 15,
    sort: [{ id: 'created_at', desc: true }],
  });
  const [resultSummary, setResultSummary] = useState<{
    total: number;
    banned: boolean;
    idSearch?: string;
    emailSearch?: string;
    metaAppId?: string;
    metaChannel?: string;
  }>({ total: 0, banned: false });

  const openUserDetail = (record: API.UserItem) => {
    setCurrentUser(record);
    setDetailOpen(true);
  };

  const openUserEdit = (record?: API.UserItem) => {
    if (record) {
      setCurrentUser(record);
    }
    setDetailOpen(false);
    setEditOpen(true);
  };

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
      ellipsis: true,
      render: (_, record) => (
        <Tooltip title={record.email}>
          <Text
            style={{
              cursor: 'pointer',
              color: '#1677ff',
              display: 'inline-block',
              maxWidth: '100%',
            }}
            ellipsis
            onClick={() => {
              openUserDetail(record);
            }}
          >
            {record.email}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '当前套餐',
      dataIndex: ['plan', 'name'],
      width: 130,
      search: false,
      render: (_, record) =>
        record.plan ? (
          <Tag color="blue">{record.plan.name}</Tag>
        ) : (
          <Tag color="default">无套餐</Tag>
        ),
    },
    {
      title: '搜索邮箱',
      dataIndex: 'email_search',
      hideInTable: true,
    },
    {
      title: '用户 ID',
      dataIndex: 'id_search',
      hideInTable: true,
    },
    {
      title: '注册包名',
      dataIndex: 'meta_app_id',
      hideInTable: true,
    },
    {
      title: '注册渠道',
      dataIndex: 'meta_channel',
      hideInTable: true,
    },
    {
      title: '仅封禁用户',
      dataIndex: 'only_banned',
      valueType: 'switch',
      hideInTable: true,
      search: {
        transform: (value) => (value ? { onlyBanned: true } : {}),
      },
    },
    {
      title: '注册时间',
      dataIndex: 'created_at_range',
      valueType: 'dateTimeRange',
      hideInTable: true,
      search: {
        transform: (value) => ({
          createdAtFrom: formatCreatedAtQueryValue(value?.[0]),
          createdAtTo: formatCreatedAtQueryValue(value?.[1]),
        }),
      },
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
    // {
    //   title: '佣金余额',
    //   dataIndex: 'commission_balance',
    //   width: 100,
    //   search: false,
    //   render: (_, record) =>
    //     record.commission_balance != null
    //       ? `¥${Number(record.commission_balance).toFixed(2)}`
    //       : '-',
    // },
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
    // {
    //   title: '邀请人',
    //   dataIndex: 'invite_user',
    //   width: 160,
    //   search: false,
    //   render: (_, record) =>
    //     record.invite_user ? (
    //       <Tooltip title={`ID: ${record.invite_user.id}`}>
    //         <Text type="secondary" style={{ fontSize: 12 }}>
    //           {record.invite_user.email}
    //         </Text>
    //       </Tooltip>
    //     ) : (
    //       '-'
    //     ),
    // },
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
      title: '注册信息',
      dataIndex: ['register_metadata', 'app_id'],
      width: 240,
      search: false,
      render: (_, record) => {
        const meta = record.register_metadata;
        const appId = meta?.app_id;
        const ip = meta?.ip;
        const country = meta?.country;
        if (!appId && !ip && !country) return '-';
        const metaLabelStyle: React.CSSProperties = {
          width: 74,
          minWidth: 74,
          whiteSpace: 'nowrap',
        };
        const content = (
          <Descriptions column={2} size="small" bordered style={{ width: 540, maxWidth: '50vw' }}>
            <Descriptions.Item label="应用包名" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.app_id, 210)}
            </Descriptions.Item>
            <Descriptions.Item label="应用版本" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.app_version)}
            </Descriptions.Item>
            <Descriptions.Item label="来源" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.utm_source)}
            </Descriptions.Item>
            <Descriptions.Item label="媒介" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.utm_medium)}
            </Descriptions.Item>
            <Descriptions.Item label="渠道" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.channel_type)}
            </Descriptions.Item>
            <Descriptions.Item label="Referrer" span={2} labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.raw_referrer, 540)}
            </Descriptions.Item>
            <Descriptions.Item label="安装TS" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.install_begin_ts)}
            </Descriptions.Item>
            <Descriptions.Item label="点击TS" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.click_ts)}
            </Descriptions.Item>
            <Descriptions.Item label="品牌" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.brand)}
            </Descriptions.Item>
            <Descriptions.Item label="平台" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.platform)}
            </Descriptions.Item>
            <Descriptions.Item label="国家" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.country)}
            </Descriptions.Item>
            <Descriptions.Item label="IP" labelStyle={metaLabelStyle}>
              {renderMetaValue(ip)}
            </Descriptions.Item>
            <Descriptions.Item label="城市" labelStyle={metaLabelStyle}>
              {renderMetaValue(meta?.city)}
            </Descriptions.Item>
          </Descriptions>
        );
        return (
          <Popover content={content} title="注册信息" trigger="click">
            <Space
              direction="vertical"
              size={0}
              style={{ width: '100%', cursor: 'pointer', color: '#1677ff' }}
            >
              <Text style={{ maxWidth: 210 }} ellipsis={{ tooltip: appId || '-' }}>
                包名：{appId || '-'}
              </Text>
              <Text style={{ maxWidth: 210 }} ellipsis={{ tooltip: ip || '-' }}>
                IP：{ip || '-'}
              </Text>
              <Text style={{ maxWidth: 210 }} ellipsis={{ tooltip: country || '-' }}>
                国家：{country || '-'}
              </Text>
            </Space>
          </Popover>
        );
      },
    },
    {
      title: '上报流量',
      dataIndex: 'report_traffic',
      width: 120,
      search: false,
      render: (_, record) => formatReportTrafficMb(record.report_traffic),
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
            openUserDetail(record);
          }}
        >
          查看详情
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
      const blob = await dumpUserCSV({
        filter: currentQuery.filter,
        sort: currentQuery.sort,
      });
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
      <Card
        size="small"
        style={{ marginBottom: 16 }}
        styles={{ body: { paddingBlock: 12 } }}
      >
        <Space size={[16, 12]} wrap>
          <Text>当前结果：{resultSummary.total} 个用户</Text>
          {resultSummary.banned ? <Tag color="error">仅看封禁用户</Tag> : null}
          {resultSummary.idSearch ? <Tag>用户 ID：{resultSummary.idSearch}</Tag> : null}
          {resultSummary.emailSearch ? <Tag>邮箱：{resultSummary.emailSearch}</Tag> : null}
          {resultSummary.metaAppId ? <Tag>包名：{resultSummary.metaAppId}</Tag> : null}
          {resultSummary.metaChannel ? <Tag>渠道：{resultSummary.metaChannel}</Tag> : null}
        </Space>
      </Card>
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
              给选中用户发邮件
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
          const meta: Record<string, string | number> = {};
          if (params.meta_app_id) {
            meta.app_id = params.meta_app_id;
          }
          if (params.meta_channel) {
            meta.channel_type = params.meta_channel;
          }
          const query: API.UserFetchParams = {
            id: params.id_search || undefined,
            current: params.current,
            pageSize: params.pageSize,
            onlyBanned: params.onlyBanned ? true : undefined,
            createdAtFrom: formatCreatedAtQueryValue(params.createdAtFrom),
            createdAtTo: formatCreatedAtQueryValue(params.createdAtTo, true),
            meta: Object.keys(meta).length ? meta : undefined,
            filter: filter.length ? filter : undefined,
            sort: [{ id: 'created_at', desc: true }],
          };
          setCurrentFilter(filter);
          setCurrentQuery(query);
          const res = await fetchUsers(query);
          if (res.code !== 0) {
            messageApi.error(res.msg || '列表获取失败');
            return { data: [], success: false, total: 0 };
          }
          const total = (res.data as any)?.total || 0;
          setResultSummary({
            total,
            banned: !!params.onlyBanned,
            idSearch: params.id_search,
            emailSearch: params.email_search,
            metaAppId: params.meta_app_id,
            metaChannel: params.meta_channel,
          });
          return {
            data: (res.data as any)?.data || [],
            success: true,
            total,
          };
        }}
        pagination={{ defaultPageSize: 15, showSizeChanger: true }}
        toolBarRender={() => [
          <Button key="generate" onClick={() => setGenerateOpen(true)}>
            生成用户
          </Button>,
          <Button key="blockedIp" onClick={() => setBlockedIpOpen(true)}>
            封禁 IP
          </Button>,
          <Button key="banRule" onClick={() => setBanRuleOpen(true)}>
            封禁策略
          </Button>,
          <Button
            key="sendMail"
            onClick={() => {
              setCurrentFilter(currentQuery.filter ?? []);
              setSendMailOpen(true);
            }}
          >
            给当前筛选结果发邮件
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
      <UserDetailDrawer
        open={detailOpen}
        user={currentUser}
        onClose={() => setDetailOpen(false)}
        onEdit={() => openUserEdit()}
      />

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

      {/* Blocked IP modal */}
      <BlockedIpModal open={blockedIpOpen} onOpenChange={setBlockedIpOpen} />

      {/* Ban rule modal */}
      <AidLoginBanRuleModal open={banRuleOpen} onOpenChange={setBanRuleOpen} />

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
