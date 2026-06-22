import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import { deleteAidLoginBanRule, fetchAidLoginBanRules } from '@/services/user/api';
import AidLoginBanRuleFormModal from './AidLoginBanRuleFormModal';

const { Text } = Typography;

type AidLoginBanRuleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const WEEKDAY_LABELS: Record<number, string> = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  7: '周日',
};

const formatTimestamp = (value?: number | null) =>
  value ? dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const renderUser = (user?: API.AidLoginBanRuleUserLite | null) =>
  user ? (
    <Space direction="vertical" size={0}>
      <Text>{user.email}</Text>
      <Text type="secondary" style={{ fontSize: 12 }}>
        ID: {user.id}
      </Text>
    </Space>
  ) : (
    '-'
  );

const renderTags = (values?: string[]) => {
  if (!values?.length) return <Tag>不限</Tag>;
  return (
    <Space size={4} wrap>
      {values.map((value) => (
        <Tag key={value}>{value}</Tag>
      ))}
    </Space>
  );
};

const renderWeeklyWindows = (windows?: API.AidLoginBanRuleWeeklyWindow[]) => {
  if (!windows?.length) return <Tag>不限</Tag>;
  const content = windows
    .map((item) => `${WEEKDAY_LABELS[item.weekday] ?? item.weekday} ${item.start}-${item.end}`)
    .join('；');
  return (
    <Tooltip title={content}>
      <Text ellipsis style={{ maxWidth: 260 }}>
        {content}
      </Text>
    </Tooltip>
  );
};

const AidLoginBanRuleModal: React.FC<AidLoginBanRuleModalProps> = ({ open, onOpenChange }) => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<API.AidLoginBanRuleItem | undefined>();

  const openCreate = () => {
    setCurrentRule(undefined);
    setFormOpen(true);
  };

  const openEdit = (record: API.AidLoginBanRuleItem) => {
    setCurrentRule(record);
    setFormOpen(true);
  };

  const columns: ProColumns<API.AidLoginBanRuleItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    {
      title: '规则名称',
      dataIndex: 'name',
      width: 180,
      search: false,
      render: (_, record) => (
        <Tooltip title={record.name}>
          <Text ellipsis style={{ maxWidth: 160 }}>
            {record.name}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      width: 100,
      valueType: 'select',
      valueEnum: {
        true: { text: '启用' },
        false: { text: '禁用' },
      },
      render: (_, record) =>
        record.enabled ? <Tag color="success">启用</Tag> : <Tag color="default">禁用</Tag>,
    },
    {
      title: '包名',
      dataIndex: 'packageName',
      hideInTable: true,
    },
    {
      title: '国家',
      dataIndex: 'country',
      hideInTable: true,
    },
    {
      title: '截止时间',
      dataIndex: 'cutoffAt',
      width: 170,
      search: false,
      render: (_, record) => record.cutoffAt || <Tag>不限</Tag>,
    },
    {
      title: '生效时间段',
      dataIndex: 'weeklyWindows',
      width: 280,
      search: false,
      render: (_, record) => renderWeeklyWindows(record.weeklyWindows),
    },
    {
      title: '封禁匹配包名列表',
      dataIndex: 'packageNames',
      width: 220,
      search: false,
      render: (_, record) => renderTags(record.packageNames),
    },
    {
      title: '封禁匹配项目代号',
      dataIndex: 'projectCodes',
      width: 200,
      search: false,
      render: (_, record) => renderTags(record.projectCodes),
    },
    {
      title: '封禁匹配国家列表',
      dataIndex: 'countries',
      width: 180,
      search: false,
      render: (_, record) => renderTags(record.countries),
    },
    {
      title: '原因',
      dataIndex: 'reason',
      width: 180,
      search: false,
      render: (_, record) =>
        record.reason ? (
          <Tooltip title={record.reason}>
            <Text ellipsis style={{ maxWidth: 160 }}>
              {record.reason}
            </Text>
          </Tooltip>
        ) : (
          '-'
        ),
    },
    {
      title: '创建人',
      dataIndex: 'createdBy',
      width: 190,
      search: false,
      render: (_, record) => renderUser(record.createdBy),
    },
    {
      title: '更新人',
      dataIndex: 'updatedBy',
      width: 190,
      search: false,
      render: (_, record) => renderUser(record.updatedBy),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      search: false,
      render: (_, record) => formatTimestamp(record.updatedAt),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => [
        <a key="edit" onClick={() => openEdit(record)}>
          编辑
        </a>,
        <a
          key="delete"
          style={{ color: '#ff4d4f' }}
          onClick={() => {
            modalApi.confirm({
              title: `确认删除封禁策略 ${record.name}？`,
              content: '删除后该封禁策略将不再生效。',
              okType: 'danger',
              onOk: async () => {
                const res = await deleteAidLoginBanRule({ id: record.id });
                if (res.code !== 0) {
                  messageApi.error(res.msg || '删除失败');
                  return;
                }
                messageApi.success('封禁策略已删除');
                actionRef.current?.reload();
              },
            });
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <Modal
      title="封禁策略"
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width={1280}
      destroyOnHidden
    >
      <ProTable<API.AidLoginBanRuleItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const enabled =
            params.enabled === undefined || params.enabled === ''
              ? undefined
              : params.enabled === true || params.enabled === 'true';
          const country = params.country ? String(params.country).trim().toUpperCase() : undefined;
          const res = await fetchAidLoginBanRules({
            enabled,
            packageName: params.packageName || undefined,
            country,
            current: params.current,
            pageSize: params.pageSize,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '封禁策略列表获取失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data || [],
            success: true,
            total: res.data?.total || 0,
          };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        search={{ labelWidth: 88 }}
        scroll={{ x: 2160 }}
        size="small"
        bordered
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={openCreate}>
            新增规则
          </Button>,
        ]}
      />

      <AidLoginBanRuleFormModal
        open={formOpen}
        current={currentRule}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          actionRef.current?.reload();
        }}
      />
    </Modal>
  );
};

export default AidLoginBanRuleModal;
