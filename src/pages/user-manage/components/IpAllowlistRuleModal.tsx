import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { App, Button, Modal, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import type { ProjectUserAppMapping } from '@/services/project/types';
import { deleteIpAllowlistRule, fetchIpAllowlistRules } from '@/services/user/api';
import IpAllowlistRuleFormModal from './IpAllowlistRuleFormModal';

const { Text } = Typography;

type IpAllowlistRuleModalProps = {
  open: boolean;
  mappings: ProjectUserAppMapping[];
  onOpenChange: (open: boolean) => void;
};

const formatTimestamp = (value?: number | null) =>
  value ? dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const renderUser = (user?: API.IpAllowlistRuleUserLite | null) =>
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

const IpAllowlistRuleModal: React.FC<IpAllowlistRuleModalProps> = ({
  open,
  mappings,
  onOpenChange,
}) => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRule, setCurrentRule] = useState<API.IpAllowlistRuleItem | undefined>();

  const openCreate = () => {
    setCurrentRule(undefined);
    setFormOpen(true);
  };

  const openEdit = (record: API.IpAllowlistRuleItem) => {
    setCurrentRule(record);
    setFormOpen(true);
  };

  const columns: ProColumns<API.IpAllowlistRuleItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    {
      title: '规则名称',
      dataIndex: 'name',
      width: 200,
      search: false,
      render: (_, record) => (
        <Tooltip title={record.name}>
          <Text ellipsis style={{ maxWidth: 180 }}>
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
      title: '国家',
      dataIndex: 'country',
      hideInTable: true,
    },
    {
      title: '项目代号',
      dataIndex: 'projectCode',
      hideInTable: true,
    },
    {
      title: '包名 / 应用 ID',
      dataIndex: 'packageName',
      hideInTable: true,
    },
    {
      title: '匹配国家',
      dataIndex: 'countries',
      width: 220,
      search: false,
      render: (_, record) => renderTags(record.countries),
    },
    {
      title: '匹配项目',
      dataIndex: 'projectCodes',
      width: 220,
      search: false,
      render: (_, record) => renderTags(record.projectCodes),
    },
    {
      title: '匹配包名',
      dataIndex: 'packageNames',
      width: 260,
      search: false,
      render: (_, record) => renderTags(record.packageNames),
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
              title: `确认删除白名单策略 ${record.name}？`,
              content: '删除后该白名单策略将不再生效。',
              okType: 'danger',
              onOk: async () => {
                const res = await deleteIpAllowlistRule({ id: record.id });
                if (res.code !== 0) {
                  messageApi.error(res.msg || '删除失败');
                  return;
                }
                messageApi.success('白名单策略已删除');
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
      title="IP 白名单策略"
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width={1320}
      destroyOnHidden
    >
      <ProTable<API.IpAllowlistRuleItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const enabled =
            params.enabled === undefined || params.enabled === ''
              ? undefined
              : params.enabled === true || params.enabled === 'true';
          const country = params.country ? String(params.country).trim().toUpperCase() : undefined;
          const projectCode = params.projectCode
            ? String(params.projectCode).trim()
            : undefined;
          const packageName = params.packageName ? String(params.packageName).trim() : undefined;
          const res = await fetchIpAllowlistRules({
            enabled,
            country,
            projectCode,
            packageName,
            current: params.current,
            pageSize: params.pageSize,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '白名单策略列表获取失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data || [],
            success: true,
            total: res.data?.total || 0,
          };
        }}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        search={{ labelWidth: 90 }}
        scroll={{ x: 1780 }}
        size="small"
        bordered
        toolBarRender={() => [
          <Button key="create" type="primary" onClick={openCreate}>
            新增规则
          </Button>,
        ]}
      />

      <IpAllowlistRuleFormModal
        open={formOpen}
        current={currentRule}
        mappings={mappings}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          actionRef.current?.reload();
        }}
      />
    </Modal>
  );
};

export default IpAllowlistRuleModal;
