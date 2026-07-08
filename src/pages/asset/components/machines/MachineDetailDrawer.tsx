import type { ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import type { FormInstance } from 'antd';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import React, { useMemo } from 'react';
import {
  bindAssetMachineIp,
  switchPrimaryAssetMachineIp,
  unbindAssetMachineIp,
} from '@/services/asset-service/api';
import JsonBlock from '../../../dev/components/JsonBlock';
import { IP_SWITCH_PRIMARY_ACTION_KEYS } from '../../constants';
import {
  buildAssetTaskDetailPath,
  formatText,
  formatTime,
  getMachineStatusColor,
  isProviderCapabilitySupported,
  normalizeDevErrorMessage,
  renderActionButton,
} from '../../utils';

const { Text } = Typography;

type Props = {
  detail: API.AssetMachine | null;
  detailTab: string;
  bindForm: FormInstance<API.AssetMachineBindIpParams>;
  bindOptions: API.AssetIp[];
  bindLoading: boolean;
  providerMap: Map<string, API.AssetProvider>;
  onClose: () => void;
  onTabChange: (key: string) => void;
  onReloadDetail: (machineId: number, nextTab?: string) => Promise<void>;
  onLoadBindOptions: (machine: API.AssetMachine) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

const MachineDetailDrawer: React.FC<Props> = ({
  detail,
  detailTab,
  bindForm,
  bindOptions,
  bindLoading,
  providerMap,
  onClose,
  onTabChange,
  onReloadDetail,
  onLoadBindOptions,
  onSuccess,
  onError,
}) => {
  const provider = useMemo(
    () => providerMap.get(detail?.provider_code || ''),
    [detail?.provider_code, providerMap],
  );
  const primaryIp = detail?.ips?.find((item) => item.is_primary) || detail?.ips?.[0];
  const ipCount = detail?.ips?.length || 0;
  const switchPrimarySupported = isProviderCapabilitySupported(
    provider,
    IP_SWITCH_PRIMARY_ACTION_KEYS,
  );

  const ipColumns: ProColumns<API.AssetMachineIpBinding>[] = [
    {
      title: 'IP',
      dataIndex: 'ip',
      renderText: formatText,
    },
    {
      title: 'Bind Type',
      dataIndex: 'bind_type',
      renderText: formatText,
    },
    {
      title: 'Primary',
      dataIndex: 'is_primary',
      width: 100,
      render: (_, record) =>
        record.is_primary ? <Tag color="green">primary</Tag> : <Tag>secondary</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      renderText: formatText,
    },
    {
      title: 'Bound At',
      dataIndex: 'bound_at',
      renderText: formatTime,
    },
    {
      title: 'Action',
      valueType: 'option',
      render: (_, record) => [
        renderActionButton(
          <a
            key="primary"
            onClick={() =>
              void (async () => {
                try {
                  await switchPrimaryAssetMachineIp(detail!.id, {
                    ip_id: record.ip_id || 0,
                  });
                  onSuccess('Primary IP updated.');
                  await onReloadDetail(detail!.id, 'ip-bindings');
                } catch (error: any) {
                  onError(normalizeDevErrorMessage(error));
                }
              })()
            }
          >
            Set primary
          </a>,
          record.is_primary
            ? 'Already primary.'
            : switchPrimarySupported === false
              ? 'Current provider capability does not support switching primary IP.'
              : undefined,
        ),
        <Popconfirm
          key="unbind"
          title="Unbind this IP from the machine?"
          onConfirm={() =>
            void (async () => {
              try {
                await unbindAssetMachineIp(detail!.id, {
                  ip_id: record.ip_id || 0,
                });
                onSuccess('IP binding removed.');
                await onReloadDetail(detail!.id, 'ip-bindings');
              } catch (error: any) {
                onError(normalizeDevErrorMessage(error));
              }
            })()
          }
        >
          <a>Unbind</a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <Drawer
      title={
        detail
          ? detail.name || detail.provider_machine_id || `Machine #${detail.id}`
          : 'Machine Detail'
      }
      extra={
        detail ? (
          <Space size={8} wrap>
            <Tag color={getMachineStatusColor(detail.status)}>
              {detail.status || '-'}
            </Tag>
            {detail.sync_status ? <Tag bordered={false}>{detail.sync_status}</Tag> : null}
            <Button size="small" onClick={() => void onReloadDetail(detail.id, detailTab)}>
              Refresh
            </Button>
          </Space>
        ) : null
      }
      open={Boolean(detail)}
      width={1040}
      onClose={onClose}
    >
      {detail ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {detail.last_error_summary ? (
            <Alert
              type="warning"
              showIcon
              message="Last Error"
              description={detail.last_error_summary}
            />
          ) : null}

          <Descriptions bordered size="small" column={3}>
            <Descriptions.Item label="Local ID">{detail.id}</Descriptions.Item>
            <Descriptions.Item label="Provider Machine ID">
              {detail.provider_machine_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Account">{detail.account_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="Provider">{detail.provider_code || '-'}</Descriptions.Item>
            <Descriptions.Item label="Primary IP">{primaryIp?.ip || '-'}</Descriptions.Item>
            <Descriptions.Item label="Source">{detail.source || '-'}</Descriptions.Item>
            <Descriptions.Item label="Create Task">
              {detail.create_task_id ? (
                <a onClick={() => history.push(buildAssetTaskDetailPath(detail.create_task_id || ''))}>
                  {detail.create_task_id}
                </a>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Last Synced">
              {formatTime(detail.last_synced_at)}
            </Descriptions.Item>
            <Descriptions.Item label="Updated At">
              {formatTime(detail.updated_at)}
            </Descriptions.Item>
          </Descriptions>

          <Card size="small">
            <Space size={[12, 12]} wrap>
              {detail.create_task_id ? (
                <Button
                  type="primary"
                  onClick={() =>
                    history.push(buildAssetTaskDetailPath(detail.create_task_id || ''))
                  }
                >
                  View Create Task
                </Button>
              ) : null}
              <Button
                onClick={() => {
                  onTabChange('ip-bindings');
                  onLoadBindOptions(detail);
                }}
              >
                {`IP Bindings (${ipCount})`}
              </Button>
              <Text type="secondary">
                {detail.provider_machine_id
                  ? `Provider instance: ${detail.provider_machine_id}`
                  : 'Provider instance id is not assigned yet.'}
              </Text>
            </Space>
          </Card>

          <Tabs
            activeKey={detailTab}
            onChange={(key) => {
              onTabChange(key);
              if (key === 'ip-bindings') {
                onLoadBindOptions(detail);
              }
            }}
            items={[
              {
                key: 'basic',
                label: 'Overview',
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Descriptions bordered size="small" column={2}>
                      <Descriptions.Item label="Name">{detail.name || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Status">{detail.status || '-'}</Descriptions.Item>
                      <Descriptions.Item label="Sync Status">
                        {detail.sync_status || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Billing Type">
                        {detail.billing_type || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Asset Zone ID">
                        {formatText(detail.asset_zone_id)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Asset Image ID">
                        {formatText(detail.asset_image_id)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Asset Instance Type ID">
                        {formatText(detail.asset_instance_type_id)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Asset Subnet ID">
                        {formatText(detail.asset_subnet_id)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Asset IP ID">
                        {formatText(detail.asset_ip_id)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Security Groups">
                        {detail.asset_security_group_ids?.length
                          ? detail.asset_security_group_ids.join(', ')
                          : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="System Disk (GB)">
                        {formatText(detail.system_disk_size_gb)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Bandwidth (Mbps)">
                        {formatText(detail.bandwidth_mbps)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Create Attempt">
                        {formatText(detail.create_attempt)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Client Request ID">
                        {detail.client_request_id || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created By">
                        {formatText(detail.created_by)}
                      </Descriptions.Item>
                      <Descriptions.Item label="Created At">
                        {formatTime(detail.created_at)}
                      </Descriptions.Item>
                    </Descriptions>
                    <Card size="small" title="Tags">
                      <Space size={[8, 8]} wrap>
                        {detail.tags?.length
                          ? detail.tags.map((tag) => (
                              <Tag key={`${tag.key}:${tag.value}`}>
                                {`${tag.key}=${tag.value}`}
                              </Tag>
                            ))
                          : <Text type="secondary">No tags</Text>}
                      </Space>
                    </Card>
                  </Space>
                ),
              },
              {
                key: 'ip-bindings',
                label: `IP Bindings (${ipCount})`,
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Descriptions bordered size="small" column={3}>
                      <Descriptions.Item label="Primary IP">
                        {primaryIp?.ip || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Binding Count">{ipCount}</Descriptions.Item>
                      <Descriptions.Item label="Provider">
                        {detail.provider_code || '-'}
                      </Descriptions.Item>
                    </Descriptions>
                    <Form<API.AssetMachineBindIpParams>
                      form={bindForm}
                      layout="vertical"
                      onFinish={async (values) => {
                        try {
                          await bindAssetMachineIp(detail.id, values);
                          onSuccess('IP binding created.');
                          bindForm.resetFields();
                          await onReloadDetail(detail.id, 'ip-bindings');
                        } catch (error: any) {
                          onError(normalizeDevErrorMessage(error));
                        }
                      }}
                    >
                      <Space size={16} align="start" style={{ width: '100%' }}>
                        <Form.Item
                          name="ip_id"
                          label="IP"
                          style={{ flex: 1 }}
                          rules={[{ required: true, message: 'Select an IP.' }]}
                        >
                          <Select
                            loading={bindLoading}
                            showSearch
                            optionFilterProp="label"
                            options={bindOptions.map((item) => ({
                              label: `${item.ip || item.external_ip_id || item.id} (#${item.id})`,
                              value: item.id,
                            }))}
                          />
                        </Form.Item>
                        <Form.Item name="bind_type" label="Bind Type" style={{ width: 180 }}>
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name="is_primary"
                          label="Primary"
                          valuePropName="checked"
                          style={{ width: 120 }}
                        >
                          <Switch />
                        </Form.Item>
                        <Form.Item label=" ">
                          <Button type="primary" htmlType="submit">
                            Bind IP
                          </Button>
                        </Form.Item>
                      </Space>
                    </Form>
                    <ProTable<API.AssetMachineIpBinding>
                      rowKey="id"
                      size="small"
                      search={false}
                      options={false}
                      pagination={false}
                      columns={ipColumns}
                      dataSource={detail.ips || []}
                      locale={{ emptyText: 'No IP bindings returned.' }}
                    />
                  </Space>
                ),
              },
              {
                key: 'raw',
                label: 'Raw',
                children: <JsonBlock title="machine_detail" value={detail} />,
              },
            ]}
          />
        </Space>
      ) : null}
    </Drawer>
  );
};

export default MachineDetailDrawer;
