import { ProTable } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import type { FormInstance } from 'antd';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
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
  const primaryIp = detail?.ips?.find((item) => item.is_primary) || detail?.ips?.[0];
  const ipCount = detail?.ips?.length || 0;

  return (
    <Drawer
      title={
        detail
          ? detail.name || detail.machine_id || `机器 #${detail.id}`
          : '机器详情'
      }
      extra={
        detail ? (
          <Space size={8} wrap>
            <Tag color={getMachineStatusColor(detail.status)}>
              {detail.status || '-'}
            </Tag>
            {detail.sync_status ? <Tag bordered={false}>{detail.sync_status}</Tag> : null}
            <Button
              size="small"
              onClick={() => void onReloadDetail(detail.id, detailTab)}
            >
              刷新
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
              message="最近错误"
              description={detail.last_error_summary}
            />
          ) : null}
          <Descriptions bordered size="small" column={3}>
            <Descriptions.Item label="机器 ID">
              {detail.machine_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="供应商">
              {detail.provider_code || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="账号">
              {detail.account_name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="地域 / 可用区">
              {[detail.region, detail.zone].filter(Boolean).join(' / ') || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="主 IP">
              {primaryIp?.ip || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="外部实例 ID">
              {detail.external_instance_id || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="创建任务">
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
            <Descriptions.Item label="最近同步">
              {formatTime(detail.last_synced_at)}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
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
                  查看创建任务
                </Button>
              ) : null}
              <Button
                onClick={() => {
                  onTabChange('ip-bindings');
                  onLoadBindOptions(detail);
                }}
              >
                {`IP 绑定（${ipCount}）`}
              </Button>
              <Text type="secondary">
                {detail.external_instance_id
                  ? `外部实例：${detail.external_instance_id}`
                  : '当前还没有外部实例 ID。'}
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
                label: '概览',
                children: (
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card
                        size="small"
                        title="身份信息"
                        styles={{ body: { paddingBottom: 8 } }}
                      >
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="机器 ID">
                            {detail.machine_id || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="名称">
                            {detail.name || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="供应商">
                            {detail.provider_code || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="账号">
                            {detail.account_name || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="来源">
                            {detail.source || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="外部实例 ID">
                            {detail.external_instance_id || '-'}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card
                        size="small"
                        title="部署与规格"
                        styles={{ body: { paddingBottom: 8 } }}
                      >
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="地域">
                            {detail.region || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="可用区">
                            {detail.zone || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="实例规格">
                            {detail.instance_type || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="CPU 核数">
                            {formatText(detail.spec?.cpu_cores)}
                          </Descriptions.Item>
                          <Descriptions.Item label="内存 MiB">
                            {formatText(detail.spec?.memory_mb)}
                          </Descriptions.Item>
                          <Descriptions.Item label="磁盘 GiB">
                            {formatText(detail.spec?.disk_gb)}
                          </Descriptions.Item>
                          <Descriptions.Item label="带宽 Mbps">
                            {formatText(detail.spec?.bandwidth_mbps)}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card
                        size="small"
                        title="运行状态"
                        styles={{ body: { paddingBottom: 8 } }}
                      >
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="状态">
                            {detail.status || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="同步状态">
                            {detail.sync_status || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="主 IP">
                            {primaryIp?.ip || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="IP 绑定数">
                            {ipCount}
                          </Descriptions.Item>
                          <Descriptions.Item label="最近同步">
                            {formatTime(detail.last_synced_at)}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card
                        size="small"
                        title="生命周期"
                        styles={{ body: { paddingBottom: 8 } }}
                      >
                        <Descriptions bordered size="small" column={1}>
                          <Descriptions.Item label="创建任务 ID">
                            {detail.create_task_id ? (
                              <a
                                onClick={() =>
                                  history.push(
                                    buildAssetTaskDetailPath(detail.create_task_id || ''),
                                  )
                                }
                              >
                                {detail.create_task_id}
                              </a>
                            ) : (
                              '-'
                            )}
                          </Descriptions.Item>
                          <Descriptions.Item label="创建尝试次数">
                            {formatText(detail.create_attempt)}
                          </Descriptions.Item>
                          <Descriptions.Item label="客户端请求 ID">
                            {detail.client_request_id || '-'}
                          </Descriptions.Item>
                          <Descriptions.Item label="创建人">
                            {formatText(detail.created_by)}
                          </Descriptions.Item>
                          <Descriptions.Item label="创建时间">
                            {formatTime(detail.created_at)}
                          </Descriptions.Item>
                          <Descriptions.Item label="更新时间">
                            {formatTime(detail.updated_at)}
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'ip-bindings',
                label: `IP 绑定（${ipCount}）`,
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Descriptions bordered size="small" column={3}>
                      <Descriptions.Item label="主 IP">
                        {primaryIp?.ip || '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="绑定数量">
                        {ipCount}
                      </Descriptions.Item>
                      <Descriptions.Item label="供应商">
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
                          rules={[{ required: true, message: '请选择 IP。' }]}
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
                          label="绑定类型"
                          style={{ width: 180 }}
                        >
                          <Input placeholder="manual" />
                        </Form.Item>
                        <Form.Item
                          name="provider_binding_id"
                          label="供应商绑定 ID"
                          style={{ flex: 1 }}
                        >
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name="is_primary"
                          label="设为主 IP"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Space>
                      <Button type="primary" htmlType="submit">
                        绑定 IP
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
                          title: '绑定类型',
                          dataIndex: 'bind_type',
                          renderText: formatText,
                        },
                        {
                          title: '主 IP',
                          dataIndex: 'is_primary',
                          render: (_, record) =>
                            record.is_primary ? (
                              <Tag color="green">主 IP</Tag>
                            ) : (
                              '-'
                            ),
                        },
                        {
                          title: '状态',
                          dataIndex: 'status',
                          renderText: formatText,
                        },
                        {
                          title: '绑定时间',
                          dataIndex: 'bound_at',
                          renderText: formatTime,
                        },
                        {
                          title: '操作',
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
                                      onSuccess('主 IP 已切换。');
                                      await onReloadDetail(
                                        detail.id,
                                        'ip-bindings',
                                      );
                                    } catch (error: any) {
                                      onError(normalizeDevErrorMessage(error));
                                    }
                                  }}
                                >
                                  设为主 IP
                                </a>,
                                switchSupported === false
                                  ? '当前供应商不支持切换主 IP。'
                                  : undefined,
                              ),
                              <Popconfirm
                                key="unbind"
                                title="确认解绑该 IP？"
                                onConfirm={async () => {
                                  try {
                                    await unbindAssetMachineIp(detail.id, {
                                      ip_id: record.ip_id || 0,
                                    });
                                    onSuccess('IP 已解绑。');
                                    await onReloadDetail(detail.id, 'ip-bindings');
                                  } catch (error: any) {
                                    onError(normalizeDevErrorMessage(error));
                                  }
                                }}
                              >
                                <a>解绑</a>
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
                label: '创建请求',
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Descriptions bordered column={2}>
                      <Descriptions.Item label="创建任务 ID">
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
                      <Descriptions.Item label="创建尝试次数">
                        {formatText(detail.create_attempt)}
                      </Descriptions.Item>
                      <Descriptions.Item label="客户端请求 ID" span={2}>
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
                label: '高级信息',
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
        </Space>
      ) : null}
    </Drawer>
  );
};

export default MachineDetailDrawer;
