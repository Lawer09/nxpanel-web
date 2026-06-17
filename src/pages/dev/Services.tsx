import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Descriptions, Drawer, Space, Tag, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { listRegisteredServices } from '@/services/node-control/api';
import { getNodeControlAuthConfig } from '@/services/node-control/request';
import NodeControlDisabledAlert from './components/NodeControlDisabledAlert';

const { Text } = Typography;

const maskToken = (value?: string) => {
  if (!value) {
    return '-';
  }
  if (value.length <= 8) {
    return '********';
  }
  return `${value.slice(0, 4)}****${value.slice(-4)}`;
};

const ServicesPage: React.FC = () => {
  const { message } = App.useApp();
  const authConfig = getNodeControlAuthConfig();
  const [data, setData] = useState<API.RegisteredServicesPayload>({
    services: [],
    routes: [],
    service_auth: [],
  });
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<API.RegisteredServiceRoute | null>(null);

  const loadRows = async () => {
    if (!authConfig.isConfigured) {
      return;
    }
    setLoading(true);
    try {
      const response = await listRegisteredServices();
      if (response.code !== 0) {
        message.error(response.message || 'Failed to load services.');
        return;
      }
      setData({
        services: response.data?.services ?? [],
        routes: response.data?.routes ?? [],
        service_auth: response.data?.service_auth ?? [],
      });
    } catch (error: any) {
      message.error(error?.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const serviceAuthMap = useMemo(() => {
    const map = new Map<string, API.RegisteredServiceAuth>();
    data.service_auth.forEach((item) => {
      map.set(item.service_name, item);
    });
    return map;
  }, [data.service_auth]);

  const serviceColumns: ProColumns<API.RegisteredServiceRoute>[] = [
    {
      title: 'Service Name',
      dataIndex: 'service_name',
      render: (_, record) => <Tag>{record.service_name}</Tag>,
    },
    { title: 'IP', dataIndex: 'ip' },
    {
      title: 'Base URL',
      dataIndex: 'base_url',
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'Route Root Path',
      dataIndex: 'route_root_path',
      copyable: true,
    },
    {
      title: 'Auth Token',
      dataIndex: 'service_name',
      render: (_, record) => {
        const auth = serviceAuthMap.get(record.service_name);
        return auth ? (
          <Text copyable={{ text: auth.service_token }}>{maskToken(auth.service_token)}</Text>
        ) : (
          '-'
        );
      },
    },
    {
      title: 'Actions',
      valueType: 'option',
      render: (_, record) => [
        <a key="detail" onClick={() => setDetail(record)}>
          Detail
        </a>,
      ],
    },
  ];

  const routeColumns: ProColumns<API.RegisteredServiceRoute>[] = [
    {
      title: 'Service Name',
      dataIndex: 'service_name',
      render: (_, record) => <Tag>{record.service_name}</Tag>,
    },
    { title: 'IP', dataIndex: 'ip' },
    {
      title: 'Base URL',
      dataIndex: 'base_url',
      copyable: true,
      ellipsis: true,
    },
    {
      title: 'Route Root Path',
      dataIndex: 'route_root_path',
      copyable: true,
    },
  ];

  const authColumns: ProColumns<API.RegisteredServiceAuth>[] = [
    {
      title: 'Service Name',
      dataIndex: 'service_name',
      render: (_, record) => <Tag>{record.service_name}</Tag>,
    },
    {
      title: 'Service Token',
      dataIndex: 'service_token',
      render: (_, record) => (
        <Text copyable={{ text: record.service_token }}>{maskToken(record.service_token)}</Text>
      ),
    },
  ];

  if (!authConfig.isConfigured) {
    return (
      <PageContainer>
        <NodeControlDisabledAlert />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <ProTable<API.RegisteredServiceRoute>
          rowKey={(record) => `${record.service_name}-${record.ip}-${record.route_root_path}`}
          loading={loading}
          columns={serviceColumns}
          search={false}
          pagination={false}
          dataSource={data.services}
          headerTitle="Services"
          toolBarRender={() => [
            <Button key="refresh" onClick={() => void loadRows()}>
              Refresh
            </Button>,
          ]}
        />
        <ProTable<API.RegisteredServiceRoute>
          rowKey={(record) => `${record.service_name}-${record.ip}-${record.route_root_path}`}
          loading={loading}
          columns={routeColumns}
          search={false}
          pagination={false}
          dataSource={data.routes}
          headerTitle="Routes"
          options={false}
        />
        <ProTable<API.RegisteredServiceAuth>
          rowKey="service_name"
          loading={loading}
          columns={authColumns}
          search={false}
          pagination={false}
          dataSource={data.service_auth}
          headerTitle="Service Auth"
          options={false}
        />
      </Space>

      <Drawer
        title={detail ? `Service ${detail.service_name}` : 'Service Detail'}
        open={Boolean(detail)}
        width={640}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Service Name">{detail.service_name}</Descriptions.Item>
            <Descriptions.Item label="IP">{detail.ip}</Descriptions.Item>
            <Descriptions.Item label="Base URL">
              <Text copyable>{detail.base_url}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Route Root Path">
              <Text copyable>{detail.route_root_path}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Service Token">
              {serviceAuthMap.get(detail.service_name) ? (
                <Text copyable={{ text: serviceAuthMap.get(detail.service_name)?.service_token }}>
                  {maskToken(serviceAuthMap.get(detail.service_name)?.service_token)}
                </Text>
              ) : (
                '-'
              )}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default ServicesPage;
