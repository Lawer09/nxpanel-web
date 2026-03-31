import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Divider, Space, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchServerGroups,
  fetchServerRoutes,
} from '@/services/swagger/server';
import {
  deleteServerTemplate,
  fetchServerTemplates,
  previewServerTemplate,
  setDefaultServerTemplate,
} from '@/services/swagger/serverTemplate';
import SaveFromNodeModal from './components/SaveFromNodeModal';
import ServerTemplateFormModal from './components/ServerTemplateFormModal';
import ServerTemplatePreviewDrawer from './components/ServerTemplatePreviewDrawer';

const { Text } = Typography;

const PROTOCOL_COLOR: Record<string, string> = {
  vless: 'blue',
  vmess: 'purple',
  trojan: 'orange',
  shadowsocks: 'red',
  hysteria: 'magenta',
  tuic: 'volcano',
  anytls: 'gold',
  socks: 'cyan',
  naive: 'lime',
  http: 'geekblue',
  mieru: 'green',
};

const ServerTemplatePage: React.FC = () => {
  const { message: messageApi, modal: modalApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<
    API.ServerTemplate | undefined
  >();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<
    Record<string, any> | undefined
  >();
  const [previewName, setPreviewName] = useState('');

  const [saveFromNodeOpen, setSaveFromNodeOpen] = useState(false);

  const [groupOptions, setGroupOptions] = useState<
    { label: string; value: number }[]
  >([]);
  const [routeOptions, setRouteOptions] = useState<
    { label: string; value: number }[]
  >([]);

  useEffect(() => {
    fetchServerGroups().then((res) => {
      if (res.data) {
        setGroupOptions(
          (res.data as any).map((g: any) => ({ label: g.name, value: g.id })),
        );
      }
    });
    fetchServerRoutes().then((res) => {
      if (res.data) {
        setRouteOptions(
          (res.data as any).map((r: any) => ({
            label: r.remarks,
            value: r.id,
          })),
        );
      }
    });
  }, []);

  const handlePreview = async (tpl: API.ServerTemplate) => {
    setPreviewName(tpl.name);
    setPreviewData(undefined);
    setPreviewOpen(true);
    setPreviewLoading(true);
    const res = await previewServerTemplate({ id: tpl.id });
    setPreviewLoading(false);
    if (res.code === 0) {
      setPreviewData(res.data);
    } else {
      messageApi.error(res.msg || '预览失败');
    }
  };

  const handleSetDefault = (tpl: API.ServerTemplate) => {
    modalApi.confirm({
      title: `将「${tpl.name}」设为默认模板？`,
      content: '原默认模板将自动取消。',
      onOk: async () => {
        const res = await setDefaultServerTemplate({ id: tpl.id });
        if (res.code !== 0) {
          messageApi.error(res.msg || '操作失败');
          return;
        }
        messageApi.success('已设为默认模板');
        actionRef.current?.reload();
      },
    });
  };

  const handleDelete = (tpl: API.ServerTemplate) => {
    modalApi.confirm({
      title: `确认删除模板「${tpl.name}」？`,
      okType: 'danger',
      onOk: async () => {
        const res = await deleteServerTemplate({ id: tpl.id });
        if (res.code !== 0) {
          messageApi.error(res.msg || '删除失败');
          return;
        }
        messageApi.success('已删除');
        actionRef.current?.reload();
      },
    });
  };

  const columns: ProColumns<API.ServerTemplate>[] = [
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
          <Text strong>{record.name}</Text>
          {record.is_default && <Tag color="gold">默认</Tag>}
        </Space>
      ),
    },
    {
      title: '协议',
      dataIndex: 'type',
      valueType: 'select',
      fieldProps: {
        options: [
          'vless',
          'vmess',
          'trojan',
          'shadowsocks',
          'hysteria',
          'tuic',
          'anytls',
          'socks',
          'naive',
          'http',
          'mieru',
        ].map((v) => ({ label: v, value: v })),
        allowClear: true,
      },
      render: (_, record) => (
        <Tag color={PROTOCOL_COLOR[record.type] ?? 'default'}>
          {record.type}
        </Tag>
      ),
    },
    {
      title: 'Host',
      dataIndex: 'host',
      search: false,
      render: (_, r) => r.host || <Text type="secondary">—</Text>,
    },
    {
      title: '端口',
      dataIndex: 'port',
      search: false,
      width: 70,
      render: (_, r) => r.port ?? <Text type="secondary">—</Text>,
    },
    {
      title: '倍率',
      dataIndex: 'rate',
      search: false,
      width: 70,
      render: (_, r) => r.rate ?? <Text type="secondary">—</Text>,
    },
    {
      title: '用户组',
      dataIndex: 'group_ids',
      search: false,
      render: (_, r) =>
        r.group_ids?.length ? (
          <Space size={2} wrap>
            {r.group_ids.map((id) => (
              <Tag key={id} style={{ fontSize: 11 }}>
                {groupOptions.find((g) => g.value === id)?.label ?? id}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">全部</Text>
        ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      search: false,
      ellipsis: true,
      render: (_, r) => r.description || <Text type="secondary">—</Text>,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      search: false,
      width: 150,
      render: (_, r) =>
        r.updated_at
          ? dayjs.unix(r.updated_at).format('YYYY-MM-DD HH:mm')
          : '—',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) =>
        [
          <a
            key="edit"
            onClick={() => {
              setCurrentTemplate(record);
              setFormOpen(true);
            }}
          >
            编辑
          </a>,
          <Divider key="d1" type="vertical" />,
          <a key="preview" onClick={() => handlePreview(record)}>
            预览
          </a>,
          <Divider key="d2" type="vertical" />,
          !record.is_default && (
            <a key="default" onClick={() => handleSetDefault(record)}>
              设为默认
            </a>
          ),
          !record.is_default && <Divider key="d3" type="vertical" />,
          <a
            key="delete"
            style={{ color: '#ff4d4f' }}
            onClick={() => handleDelete(record)}
          >
            删除
          </a>,
        ].filter(Boolean),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ServerTemplate>
        headerTitle="节点模板管理"
        actionRef={actionRef}
        rowKey="id"
        search={{ labelWidth: 80 }}
        toolBarRender={() => [
          <Tooltip key="fromNode" title="从已有节点提取配置保存为模板">
            <Button onClick={() => setSaveFromNodeOpen(true)}>
              从节点导入
            </Button>
          </Tooltip>,
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
        request={async (params) => {
          const res = await fetchServerTemplates({
            page: params.current ?? 1,
            page_size: params.pageSize ?? 20,
            name: params.name,
            type: params.type,
          });
          return {
            data: res.data?.data ?? [],
            total: res.data?.total ?? 0,
            success: res.code === 0,
          };
        }}
        columns={columns}
        pagination={{ defaultPageSize: 20, showSizeChanger: true }}
      />

      <ServerTemplateFormModal
        open={formOpen}
        current={currentTemplate}
        groupOptions={groupOptions}
        routeOptions={routeOptions}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setCurrentTemplate(undefined);
        }}
        onSuccess={() => {
          setFormOpen(false);
          setCurrentTemplate(undefined);
          actionRef.current?.reload();
        }}
      />

      <ServerTemplatePreviewDrawer
        open={previewOpen}
        loading={previewLoading}
        templateName={previewName}
        data={previewData}
        onClose={() => setPreviewOpen(false)}
      />

      <SaveFromNodeModal
        open={saveFromNodeOpen}
        onOpenChange={setSaveFromNodeOpen}
        onSuccess={() => {
          setSaveFromNodeOpen(false);
          actionRef.current?.reload();
        }}
      />
    </PageContainer>
  );
};

export default ServerTemplatePage;
