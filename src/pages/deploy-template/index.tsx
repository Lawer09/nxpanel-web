import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Divider, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  deleteDeployTemplate,
  fetchDeployTemplates,
  previewDeployTemplate,
  setDefaultDeployTemplate,
} from '@/services/swagger/deployTemplate';
import TemplateFormModal from './components/TemplateFormModal';
import TemplatePreviewDrawer from './components/TemplatePreviewDrawer';

const { Text } = Typography;

const CORE_LABELS: Record<number, string> = {
  1: 'Xray',
  2: 'Sing-box',
  3: 'Mihomo',
};
const TLS_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: '无 TLS', color: 'default' },
  1: { label: 'TLS', color: 'green' },
  2: { label: 'XTLS', color: 'cyan' },
};
const NODE_TYPE_COLOR: Record<string, string> = {
  vless: 'blue',
  vmess: 'purple',
  trojan: 'orange',
  shadowsocks: 'red',
  hysteria: 'magenta',
  hysteria2: 'geekblue',
  tuic: 'volcano',
  anytls: 'gold',
};

const DeployTemplatePage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<
    API.DeployTemplate | undefined
  >();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<
    Record<string, any> | undefined
  >();
  const [previewName, setPreviewName] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreview = async (template: API.DeployTemplate) => {
    setPreviewName(template.name);
    setPreviewData(undefined);
    setPreviewOpen(true);
    setPreviewLoading(true);
    const res = await previewDeployTemplate({ id: template.id });
    setPreviewLoading(false);
    if (res.code !== 0 && (res as any).code !== 200) {
      messageApi.error(res.msg || '预览失败');
      setPreviewOpen(false);
      return;
    }
    setPreviewData(res.data);
  };

  const handleSetDefault = async (template: API.DeployTemplate) => {
    const res = await setDefaultDeployTemplate({ id: template.id });
    if (res.code !== 0) {
      messageApi.error(res.msg || '设置失败');
      return;
    }
    messageApi.success(`「${template.name}」已设为默认模板`);
    actionRef.current?.reload();
  };

  const handleDelete = (template: API.DeployTemplate) => {
    modalApi.confirm({
      title: `确认删除模板「${template.name}」？`,
      okType: 'danger',
      onOk: async () => {
        const res = await deleteDeployTemplate({ id: template.id });
        if (res.code !== 0) {
          messageApi.error(res.msg || '删除失败');
          return;
        }
        messageApi.success('模板已删除');
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<API.DeployTemplate>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
    },
    {
      title: '模板名称',
      dataIndex: 'name',
      render: (_, record) => (
        <Space>
          <a
            onClick={() => {
              setCurrentTemplate(record);
              setFormOpen(true);
            }}
          >
            {record.name}
          </a>
          {record.is_default && (
            <Tag color="gold" style={{ fontSize: 11 }}>
              默认
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '节点类型',
      dataIndex: 'node_type',
      width: 110,
      valueType: 'select',
      fieldProps: {
        options: [
          'vless',
          'vmess',
          'trojan',
          'shadowsocks',
          'hysteria',
          'hysteria2',
          'tuic',
          'anytls',
        ].map((v) => ({ label: v, value: v })),
      },
      render: (_, r) => (
        <Tag color={NODE_TYPE_COLOR[r.node_type] ?? 'default'}>
          {r.node_type}
        </Tag>
      ),
    },
    {
      title: '核心',
      dataIndex: 'core_type',
      width: 90,
      search: false,
      render: (v) =>
        v != null ? (
          <Tag>{CORE_LABELS[v as number] ?? String(v)}</Tag>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'TLS',
      dataIndex: 'tls',
      width: 90,
      search: false,
      render: (v) => {
        if (v == null) return <Text type="secondary">-</Text>;
        const t = TLS_LABELS[v as number];
        return t ? (
          <Tag color={t.color}>{t.label}</Tag>
        ) : (
          <Tag>{String(v)}</Tag>
        );
      },
    },
    {
      title: '传输协议',
      dataIndex: 'network',
      width: 90,
      search: false,
      render: (v) =>
        v ? <Tag>{v as string}</Tag> : <Text type="secondary">-</Text>,
    },
    {
      title: '证书域名',
      dataIndex: 'cert_domain',
      width: 170,
      search: false,
      render: (v) => v || <Text type="secondary">-</Text>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      search: false,
      ellipsis: true,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 155,
      search: false,
      render: (v) =>
        v ? dayjs.unix(v as number).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'option',
      valueType: 'option',
      width: 200,
      render: (_, record) => (
        <Space split={<Divider type="vertical" />}>
          <a
            onClick={() => {
              setCurrentTemplate(record);
              setFormOpen(true);
            }}
          >
            编辑
          </a>
          <a onClick={() => handlePreview(record)}>预览</a>
          {!record.is_default && (
            <Tooltip title="设置后将取消旧的默认模板">
              <a onClick={() => handleSetDefault(record)}>设为默认</a>
            </Tooltip>
          )}
          <a style={{ color: '#ff4d4f' }} onClick={() => handleDelete(record)}>
            删除
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.DeployTemplate>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await fetchDeployTemplates({
            page: params.current,
            page_size: params.pageSize,
            name: params.name,
            node_type: params.node_type,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取列表失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data ?? [],
            success: true,
            total: res.data?.total ?? 0,
          };
        }}
        pagination={{ defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            onClick={() => {
              setCurrentTemplate(undefined);
              setFormOpen(true);
            }}
          >
            新建模板
          </Button>,
        ]}
        size="middle"
        bordered
      />

      <TemplateFormModal
        open={formOpen}
        current={currentTemplate}
        onOpenChange={setFormOpen}
        onSuccess={() => {
          setFormOpen(false);
          actionRef.current?.reload();
        }}
      />

      <TemplatePreviewDrawer
        open={previewOpen}
        previewData={previewData}
        templateName={previewName}
        loading={previewLoading}
        onClose={() => setPreviewOpen(false)}
      />
    </PageContainer>
  );
};

export default DeployTemplatePage;
