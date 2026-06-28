import { ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import type { FormInstance } from 'antd';
import {
  Alert,
  Button,
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
} from 'antd';
import React from 'react';
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
  isProviderCapabilitySupported,
  normalizeDevErrorMessage,
  renderActionButton,
} from '../../utils';

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
}) => (
  <Drawer
    title={detail ? `Machine #${detail.id}` : 'Machine Detail'}
    open={Boolean(detail)}
    width={960}
    onClose={onClose}
  >
    {detail ? (
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
            label: 'Basic',
            children: (
              <Descriptions bordered column={2}>
                <Descriptions.Item label="Machine ID">
                  {detail.machine_id || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Name">
                  {detail.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Provider">
                  {detail.provider_code || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Account">
                  {detail.account_name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Region">
                  {detail.region || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Zone">
                  {detail.zone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Instance Type">
                  {detail.instance_type || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {detail.status || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Source">
                  {detail.source || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Sync Status">
                  {detail.sync_status || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Create Task ID">
                  {detail.create_task_id ? (
                    <a
                      onClick={() =>
                        history.push(buildAssetTaskDetailPath(detail.create_task_id || ''))
                      }
                    >
                      {detail.create_task_id}
                    </a>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Create Attempts">
                  {formatText(detail.create_attempt)}
                </Descriptions.Item>
                <Descriptions.Item label="Client Request ID">
                  {detail.client_request_id || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="External Instance ID">
                  {detail.external_instance_id || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Last Synced">
                  {formatTime(detail.last_synced_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Created By">
                  {formatText(detail.created_by)}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {formatTime(detail.created_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                  {formatTime(detail.updated_at)}
                </Descriptions.Item>
                <Descriptions.Item label="CPU Cores">
                  {formatText(detail.spec?.cpu_cores)}
                </Descriptions.Item>
                <Descriptions.Item label="Memory MiB">
                  {formatText(detail.spec?.memory_mb)}
                </Descriptions.Item>
                <Descriptions.Item label="Disk GiB">
                  {formatText(detail.spec?.disk_gb)}
                </Descriptions.Item>
                <Descriptions.Item label="Bandwidth Mbps">
                  {formatText(detail.spec?.bandwidth_mbps)}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'ip-bindings',
            label: 'IP Bindings',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
                      rules={[{ required: true, message: 'Please select IP.' }]}
                    >
                      <Select
                        loading={bindLoading}
                        showSearch
                        optionFilterProp="label"
                        options={bindOptions.map((item) => ({
                          label: `${item.ip} (#${item.id}) ${item.status ? `[${item.status}]` : ''}`,
                          value: item.id,
                        }))}
                      />
                    </Form.Item>
                    <Form.Item
                      name="bind_type"
                      label="Bind Type"
                      style={{ width: 180 }}
                    >
                      <Input placeholder="manual" />
                    </Form.Item>
                    <Form.Item
                      name="provider_binding_id"
                      label="Provider Binding ID"
                      style={{ flex: 1 }}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="is_primary"
                      label="Primary"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Space>
                  <Button type="primary" htmlType="submit">
                    Bind IP
                  </Button>
                </Form>
                <ProTable<API.AssetMachineIpBinding>
                  rowKey="id"
                  search={false}
                  options={false}
                  pagination={false}
                  dataSource={detail.ips || []}
                  columns={[
                    { title: 'IP', dataIndex: 'ip', renderText: formatText },
                    {
                      title: 'Bind Type',
                      dataIndex: 'bind_type',
                      renderText: formatText,
                    },
                    {
                      title: 'Primary',
                      dataIndex: 'is_primary',
                      render: (_, record) =>
                        record.is_primary ? (
                          <Tag color="green">Primary</Tag>
                        ) : (
                          '-'
                        ),
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
                      title: 'Actions',
                      valueType: 'option',
                      render: (_, record) => {
                        const provider = providerMap.get(
                          detail.provider_code || '',
                        );
                        const switchSupported = isProviderCapabilitySupported(
                          provider,
                          IP_SWITCH_PRIMARY_ACTION_KEYS,
                        );
                        return [
                          renderActionButton(
                            <a
                              key="primary"
                              onClick={async () => {
                                try {
                                  await switchPrimaryAssetMachineIp(detail.id, {
                                    ip_id: record.ip_id || 0,
                                  });
                                  onSuccess('Primary IP switched.');
                                  await onReloadDetail(
                                    detail.id,
                                    'ip-bindings',
                                  );
                                } catch (error: any) {
                                  onError(normalizeDevErrorMessage(error));
                                }
                              }}
                            >
                              Set Primary
                            </a>,
                            switchSupported === false
                              ? 'Current provider capability does not support primary IP switching.'
                              : undefined,
                          ),
                          <Popconfirm
                            key="unbind"
                            title="Unbind this IP?"
                            onConfirm={async () => {
                              try {
                                await unbindAssetMachineIp(detail.id, {
                                  ip_id: record.ip_id || 0,
                                });
                                onSuccess('IP unbound.');
                                await onReloadDetail(detail.id, 'ip-bindings');
                              } catch (error: any) {
                                onError(normalizeDevErrorMessage(error));
                              }
                            }}
                          >
                            <a>Unbind</a>
                          </Popconfirm>,
                        ];
                      },
                    },
                  ]}
                />
              </Space>
            ),
          },
          {
            key: 'create-request',
            label: 'Create Request',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {detail.last_error_summary ? (
                  <Alert
                    type="warning"
                    showIcon
                    message="Last error"
                    description={detail.last_error_summary}
                  />
                ) : null}
                <Descriptions bordered column={2}>
                <Descriptions.Item label="Create Task ID">
                    {detail.create_task_id ? (
                      <a
                        onClick={() =>
                          history.push(buildAssetTaskDetailPath(detail.create_task_id || ''))
                        }
                      >
                        {detail.create_task_id}
                      </a>
                    ) : (
                      '-'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Create Attempts">
                    {formatText(detail.create_attempt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Client Request ID" span={2}>
                    {detail.client_request_id || '-'}
                  </Descriptions.Item>
                </Descriptions>
                <JsonBlock
                  title="create_request_json"
                  value={detail.create_request_json}
                />
              </Space>
            ),
          },
          {
            key: 'metadata',
            label: 'Metadata',
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <JsonBlock title="tags" value={detail.tags} />
                <JsonBlock title="metadata" value={detail.metadata} />
                <JsonBlock title="spec.extra" value={detail.spec?.spec} />
              </Space>
            ),
          },
        ]}
      />
    ) : null}
  </Drawer>
);

export default MachineDetailDrawer;
