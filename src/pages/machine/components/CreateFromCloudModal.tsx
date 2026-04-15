import { CloudDownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  App,
  Badge,
  Button,
  Divider,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { batchImportMachines } from '@/services/machine/api';
import {
  bindProviderEips,
  createProviderInstance,
  getProviderEips,
  getProviderInstances,
  getProviderInstanceTypes,
  getProviderSubnets,
  getProviderZones,
} from '@/services/provider/api';
import { fetchSshKeys } from '@/services/ssh-key/api';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  RUNNING: 'success',
  STOPPED: 'default',
  STARTING: 'processing',
  STOPPING: 'warning',
  ERROR: 'error',
};

interface CreateFromCloudModalProps {
  open: boolean;
  providerOptions: Array<{ label: string; value: number }>;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'create' | 'bind' | 'confirm';

interface CreatedInstance {
  instance_id: string;
  name?: string;
  status?: string;
  private_ips?: string[];
  nic_id?: string;
  zone_id?: string;
  selectedSshKeyId?: number;
  selectedEipId?: string;
  eipBound?: boolean;
}

const CreateFromCloudModal: React.FC<CreateFromCloudModalProps> = ({
  open,
  providerOptions,
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [createdInstances, setCreatedInstances] = useState<CreatedInstance[]>([]);
  const [createdProviderId, setCreatedProviderId] = useState<number>();
  const [selectedImportKeys, setSelectedImportKeys] = useState<React.Key[]>([]);
  const [refreshingInstances, setRefreshingInstances] = useState(false);
  const [bindingInstanceId, setBindingInstanceId] = useState<string | null>(null);
  const [refreshingSshKeys, setRefreshingSshKeys] = useState(false);
  const [importResult, setImportResult] = useState<API.BatchImportMachinesResult | null>(null);
  const [importResultVisible, setImportResultVisible] = useState(false);

  const [zoneOptions, setZoneOptions] = useState<
    Array<{ label: string; value: string; regionId?: string }>
  >([]);
  const [instanceTypeOptions, setInstanceTypeOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [instanceTypeAll, setInstanceTypeAll] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [subnetOptions, setSubnetOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [eipOptions, setEipOptions] = useState<
    Array<{ label: string; value: string; ipAddress?: string | string[] }>
  >([]);
  const [sshKeyOptions, setSshKeyOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);

  const [eipPage, setEipPage] = useState(1);
  const [sshKeyPage, setSshKeyPage] = useState(1);
  const [eipLoadingMore, setEipLoadingMore] = useState(false);
  const [sshKeyLoadingMore, setSshKeyLoadingMore] = useState(false);
  const [instanceTypePage, setInstanceTypePage] = useState(1);
  const [instanceTypeQuery, setInstanceTypeQuery] = useState('');
  const [subnetPage, setSubnetPage] = useState(1);
  const [subnetQuery, setSubnetQuery] = useState('');
  const [subnetLoadingMore, setSubnetLoadingMore] = useState(false);
  const [instanceTypeLoadingMore, setInstanceTypeLoadingMore] = useState(false);
  const instanceTypePageSize = 50;
  const [baseLoading, setBaseLoading] = useState(false);

  const providerId = Form.useWatch('providerId', form);
  const zoneId = Form.useWatch('zoneId', form);
  const selectedZone = useMemo(
    () => zoneOptions.find((z) => z.value === zoneId),
    [zoneId, zoneOptions],
  );

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setZoneOptions([]);
      setInstanceTypeOptions([]);
      setInstanceTypeAll([]);
      setSubnetOptions([]);
      setEipOptions([]);
      setSshKeyOptions([]);
      setCurrentStep(0);
      setCreatedInstances([]);
      setCreatedProviderId(undefined);
      setSelectedImportKeys([]);
      setRefreshingInstances(false);
      setBindingInstanceId(null);
      setRefreshingSshKeys(false);
      setImportResult(null);
      setImportResultVisible(false);
    }
  }, [open, form]);

  const loadEips = async (
    options: { page?: number; append?: boolean; providerId?: number } = {},
  ) => {
    const targetProviderId = options.providerId ?? providerId ?? createdProviderId;
    if (!targetProviderId) return;
    const page = options.page ?? 1;
    const append = options.append ?? false;
    const res = await getProviderEips({
      providerId: targetProviderId,
      regionId: selectedZone?.regionId,
      status: 'UNBIND',
      page,
      pageSize: 20,
    });
    if (res.code === 0 && res.data?.data) {
      const list = res.data.data.map((eip) => ({
        label: `${Array.isArray(eip.ipAddress) ? eip.ipAddress[0] : eip.ipAddress}${eip.eipId ? ` (${eip.eipId})` : ''}`,
        value: eip.eipId,
        ipAddress: eip.ipAddress,
      }));
      setEipOptions((prev) => (append ? [...prev, ...list] : list));
      setEipPage(page);
    }
  };

  const loadSshKeys = async (
    options: { page?: number; append?: boolean; providerId?: number } = {},
  ) => {
    const targetProviderId = options.providerId ?? providerId ?? createdProviderId;
    if (!targetProviderId) return;
    const page = options.page ?? 1;
    const append = options.append ?? false;
    const res = await fetchSshKeys({ providerId: Number(targetProviderId), page, pageSize: 20 });
    if (res.code === 0 && res.data?.data) {
      const list = res.data.data
        .filter((k) => k.provider_key_id)
        .map((k) => ({ label: k.name, value: k.id }));
      setSshKeyOptions((prev) => (append ? [...prev, ...list] : list));
      setSshKeyPage(page);
    }
  };

  const loadProviderBase = async () => {
    if (!providerId) return;
    setBaseLoading(true);
    try {
      const zonesRes = await getProviderZones({ providerId });
      if (zonesRes.code === 0 && zonesRes.data?.data) {
        setZoneOptions(
          zonesRes.data.data.map((z: any) => ({
            label: z.zone_name || z.zoneName || z.zone_id || z.zoneId,
            value: z.zone_id || z.zoneId,
            regionId: z.region_id || z.regionId,
          })),
        );
      }
      await loadSshKeys({ page: 1 });
    } catch (error) {
      messageApi.error('加载云端配置失败');
    } finally {
      setBaseLoading(false);
    }
  };

  useEffect(() => {
    if (!providerId) {
      setZoneOptions([]);
      setInstanceTypeOptions([]);
      setSubnetOptions([]);
      setEipOptions([]);
      setSshKeyOptions([]);
      setEipPage(1);
      setSshKeyPage(1);
      form.setFieldsValue({ zoneId: undefined, instanceType: undefined, subnetId: undefined });
      return;
    }

    loadProviderBase();
  }, [providerId, form]);

  const loadInstanceTypes = async (
    options: { page?: number; query?: string; append?: boolean } = {},
  ) => {
    if (!providerId || !zoneId) return;
    const page = options.page ?? 1;
    const query = options.query ?? instanceTypeQuery;
    const res = await getProviderInstanceTypes({ providerId, zoneId, instanceType: query || undefined });
    if (res.code === 0 && res.data?.data) {
      const list = res.data.data.map((t) => ({
        label: `${t.instanceType}${t.cpuCount || t.memory ? ` (${t.cpuCount || '-'}C/${t.memory || '-'}G)` : ''}`,
        value: t.instanceType,
      }));
      setInstanceTypeAll(list);
      setInstanceTypePage(page);
      setInstanceTypeOptions(list.slice(0, page * instanceTypePageSize));
    }
  };

  const loadSubnets = async (
    options: { page?: number; query?: string; append?: boolean } = {},
  ) => {
    if (!providerId || !selectedZone?.regionId) return;
    const page = options.page ?? 1;
    const query = options.query ?? subnetQuery;
    const append = options.append ?? false;
    const res = await getProviderSubnets({
      providerId,
      regionId: selectedZone.regionId,
      name: query || undefined,
      pageNum: page,
      pageSize: 100,
    });
    if (res.code === 0 && res.data?.data) {
      const list = res.data.data.map((s) => ({
        label: `${s.name || s.subnetId}${s.cidrBlock ? ` (${s.cidrBlock})` : ''}`,
        value: s.subnetId,
      }));
      setSubnetOptions((prev) => (append ? [...prev, ...list] : list));
      setSubnetPage(page);
    }
  };

  useEffect(() => {
    if (!providerId || !zoneId) {
      setInstanceTypeOptions([]);
      setInstanceTypeAll([]);
      setSubnetOptions([]);
      setInstanceTypeQuery('');
      setSubnetQuery('');
      setInstanceTypePage(1);
      setSubnetPage(1);
      form.setFieldsValue({ instanceType: undefined, subnetId: undefined });
      return;
    }
    Promise.all([
      loadInstanceTypes({ page: 1, query: '' }),
      loadSubnets({ page: 1, query: '' }),
    ]).catch(() => {
      messageApi.error('加载实例规格或子网失败');
    });
  }, [providerId, zoneId, selectedZone?.regionId, form, messageApi]);

  useEffect(() => {
    if (!zoneId) return;
    const currentName = form.getFieldValue('name');
    if (!currentName) {
      form.setFieldsValue({ name: `${zoneId}-20260404-{index}` });
    }
  }, [zoneId, form]);


  const createdInstancesTableColumns = useMemo(
    () => [
      {
        title: 'Instance ID',
        dataIndex: 'instance_id',
        width: 180,
        render: (id: string) => (
          <Text copyable style={{ fontSize: 12 }}>
            {id}
          </Text>
        ),
      },
      {
        title: '名称',
        dataIndex: 'name',
        width: 140,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 90,
        render: (status: string) => (
          <Badge
            status={(STATUS_COLOR[status] as any) || 'default'}
            text={status || '-'}
          />
        ),
      },
      {
        title: '私网 IP',
        width: 160,
        render: (_: any, r: CreatedInstance) => (
          <Space direction="vertical" size={0}>
            {(r.private_ips || []).slice(0, 2).map((ip) => (
              <Tag key={ip} style={{ fontSize: 11 }}>
                {ip}
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        title: 'EIP',
        width: 260,
        render: (_: any, r: CreatedInstance, index: number) => (
          <Select
            style={{ width: '100%' }}
            placeholder="选择 EIP"
            options={eipOptions}
            value={r.selectedEipId}
            showSearch
            optionFilterProp="label"
            disabled={r.eipBound}
            onChange={(value) => {
              const next = [...createdInstances];
              next[index].selectedEipId = value;
              setCreatedInstances(next);
            }}
            popupRender={(menu) => (
              <>
                {menu}
                <div style={{ padding: 8, textAlign: 'center' }}>
                  <Button
                    size="small"
                    loading={eipLoadingMore}
                    onClick={async () => {
                      setEipLoadingMore(true);
                      try {
                        await loadEips({ page: eipPage + 1, append: true });
                      } finally {
                        setEipLoadingMore(false);
                      }
                    }}
                  >
                    加载更多
                  </Button>
                </div>
              </>
            )}
          />
        ),
      },
      {
        title: '操作',
        width: 100,
        render: (_: any, r: CreatedInstance) => (
          <Button
            type="link"
            size="small"
            loading={bindingInstanceId === r.instance_id}
            disabled={r.eipBound || !r.selectedEipId}
            onClick={() => handleBindEip(r)}
          >
            {r.eipBound ? '已绑定' : '绑定'}
          </Button>
        ),
      },
    ],
    [createdInstances, eipOptions, eipLoadingMore, eipPage, bindingInstanceId],
  );

  const handleSubmit = async () => {
    if (currentStep === 0) {
      // Step 1: Create instances
      try {
        const values = await form.validateFields();
        const count = Number(values.instanceCount || 1);

        setLoading(true);
        const res = await createProviderInstance({
          providerId: values.providerId,
          zoneId: values.zoneId,
          instanceType: values.instanceType,
          subnetId: values.subnetId,
          sshKeyId: values.sshKeyId,
          name: values.name || undefined,
          instanceCount: count,
        });

        if (res.code !== 0) {
          messageApi.error(res.msg || '创建实例失败');
          return;
        }

        if (!res.data?.instanceIds || res.data.instanceIds.length === 0) {
          messageApi.error('未返回实例 ID');
          return;
        }

        messageApi.success(`创建请求已提交，实例 ID: ${res.data.instanceIds.join(', ')}`);

        // Fetch instance details
        const instanceRes = await getProviderInstances({
          providerId: values.providerId,
          instanceIds: res.data.instanceIds,
          page: 1,
          pageSize: 100,
        });

        if (instanceRes.code !== 0 || !instanceRes.data?.data) {
          messageApi.error('获取实例详情失败');
          return;
        }

        setCreatedInstances(
          instanceRes.data.data.map((inst) => ({
            instance_id: inst.instance_id,
            name: inst.name,
            status: inst.status,
            private_ips: inst.private_ips,
            nic_id: inst.nic_id,
            zone_id: inst.zone_id,
            eipBound: false,
          })),
        );
        setCreatedProviderId(values.providerId);
        
        // 进入第二步时加载 EIP 数据
        await loadEips({ page: 1 });
        
        setCurrentStep(1);
      } catch (error: any) {
        if (error?.errorFields) return;
        messageApi.error(error?.message || '创建失败');
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 1) {
      // Step 2: Move to confirm step (no validation needed, can proceed with 0 bindings)
      setCurrentStep(2);
    } else {
      // Step 3: Import selected machines
      try {
        if (selectedImportKeys.length === 0) {
          messageApi.warning('请至少选择一个实例进行导入');
          return;
        }

        if (!createdProviderId) {
          messageApi.error('供应商信息缺失');
          return;
        }

        setLoading(true);

        // Prepare machine import items for selected instances
        const items = createdInstances
          .filter((inst) => selectedImportKeys.includes(inst.instance_id))
          .map((inst) => {
            const eipOption = eipOptions.find((e) => e.value === inst.selectedEipId);
            const publicIp = Array.isArray(eipOption?.ipAddress)
              ? eipOption.ipAddress[0]
              : eipOption?.ipAddress;

            return {
              name: inst.name || inst.instance_id,
              hostname: inst.name || inst.instance_id,
              ip_address: publicIp || inst.private_ips?.[0] || '',
              private_ip_address: inst.private_ips?.[0] || '',
              port: 22,
              username: 'root',
              provider: createdProviderId,
              provider_instance_id: inst.instance_id,
              provider_nic_id: inst.nic_id,
              provider_zone_id: inst.zone_id,
              ssh_key_id: inst.selectedSshKeyId,
            };
          });

        const importRes = await batchImportMachines({ items });

        if (importRes.code !== 0) {
          messageApi.error(importRes.msg || '导入机器失败');
          return;
        }

        messageApi.success(`成功导入 ${items.length} 台机器`);
        setImportResult(importRes.data || null);
        setImportResultVisible(true);
        onSuccess();
      } catch (error: any) {
        messageApi.error(error?.message || '操作失败');
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const refreshInstancesInfo = async () => {
    if (!createdProviderId || createdInstances.length === 0) return;

    setRefreshingInstances(true);
    try {
      const instanceIds = createdInstances.map((inst) => inst.instance_id);
      const instanceRes = await getProviderInstances({
        providerId: createdProviderId,
        instanceIds,
        page: 1,
        pageSize: 100,
      });

      if (instanceRes.code !== 0 || !instanceRes.data?.data) {
        messageApi.error('刷新实例信息失败');
        return;
      }

      // 更新实例信息，保留已选择的 EIP 和绑定状态
      setCreatedInstances((prev) =>
        instanceRes.data!.data.map((inst) => {
          const existing = prev.find((p) => p.instance_id === inst.instance_id);
          return {
            instance_id: inst.instance_id,
            name: inst.name,
            status: inst.status,
            private_ips: inst.private_ips,
            nic_id: inst.nic_id,
            zone_id: inst.zone_id,
            selectedEipId: existing?.selectedEipId,
            eipBound: existing?.eipBound || false,
          };
        }),
      );

      messageApi.success('实例信息已刷新');
    } catch (error: any) {
      messageApi.error(error?.message || '刷新失败');
    } finally {
      setRefreshingInstances(false);
    }
  };

  const handleBindEip = async (instance: CreatedInstance) => {
    if (!instance.selectedEipId || !instance.nic_id || !instance.private_ips?.[0]) {
      messageApi.warning('请先选择 EIP');
      return;
    }

    if (!createdProviderId) {
      messageApi.error('供应商信息缺失');
      return;
    }

    setBindingInstanceId(instance.instance_id);
    try {
      const bindRes = await bindProviderEips({
        providerId: createdProviderId,
        bindings: [
          {
            nicId: instance.nic_id,
            elasticIpId: instance.selectedEipId,
            privateIpAddress: instance.private_ips[0],
          },
        ],
      });

      if (bindRes.code !== 0) {
        messageApi.error(bindRes.msg || '绑定 EIP 失败');
        return;
      }

      // 更新绑定状态
      setCreatedInstances((prev) =>
        prev.map((inst) =>
          inst.instance_id === instance.instance_id
            ? { ...inst, eipBound: true }
            : inst,
        ),
      );

      messageApi.success('绑定 EIP 成功');
    } catch (error: any) {
      messageApi.error(error?.message || '绑定失败');
    } finally {
      setBindingInstanceId(null);
    }
  };

  const confirmTableColumns = useMemo(
    () => [
      {
        title: 'Instance ID',
        dataIndex: 'instance_id',
        width: 180,
        render: (id: string) => (
          <Text copyable style={{ fontSize: 12 }}>
            {id}
          </Text>
        ),
      },
      {
        title: '名称',
        dataIndex: 'name',
        width: 140,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 90,
        render: (status: string) => (
          <Badge
            status={(STATUS_COLOR[status] as any) || 'default'}
            text={status || '-'}
          />
        ),
      },
      {
        title: '私网 IP',
        width: 160,
        render: (_: any, r: CreatedInstance) => (
          <Space direction="vertical" size={0}>
            {(r.private_ips || []).slice(0, 2).map((ip) => (
              <Tag key={ip} style={{ fontSize: 11 }}>
                {ip}
              </Tag>
            ))}
          </Space>
        ),
      },
      {
        title: '导入密钥',
        width: 200,
        render: (_: any, r: CreatedInstance, index: number) => (
          <Space.Compact style={{ width: '100%' }}>
            <Select
              style={{ width: '100%' }}
              placeholder="选择密钥"
              options={sshKeyOptions}
              value={r.selectedSshKeyId}
              showSearch
              optionFilterProp="label"
              onChange={(value) => {
                const next = [...createdInstances];
                next[index].selectedSshKeyId = value;
                setCreatedInstances(next);
              }}
            />
            <Button
              loading={refreshingSshKeys}
              onClick={async () => {
                setRefreshingSshKeys(true);
                try {
                  await loadSshKeys({ page: 1, providerId: createdProviderId });
                } finally {
                  setRefreshingSshKeys(false);
                }
              }}
              disabled={!createdProviderId}
            >
              刷新
            </Button>
          </Space.Compact>
        ),
      },
      {
        title: '绑定的 EIP',
        width: 180,
        render: (_: any, r: CreatedInstance) => {
          const eipOption = eipOptions.find((e) => e.value === r.selectedEipId);
          if (!eipOption) return '-';
          const publicIp = Array.isArray(eipOption.ipAddress)
            ? eipOption.ipAddress[0]
            : eipOption.ipAddress;
          return (
            <Space>
              <Tag color="blue">{publicIp}</Tag>
              {r.eipBound && <Tag color="success">已绑定</Tag>}
            </Space>
          );
        },
      },
    ],
    [createdInstances, eipOptions, sshKeyOptions],
  );

  return (
    <>
    <Modal
      title={
        <Space>
          <CloudDownloadOutlined />
          云端创建机器
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={900}
      destroyOnHidden
    >
      <Steps
        current={currentStep}
        style={{ marginBottom: 24 }}
        items={[
          { title: '创建实例' },
          { title: '绑定 EIP' },
          { title: '确认导入' },
        ]}
      />

      {currentStep === 0 && (
        <Form form={form} layout="vertical" initialValues={{ instanceCount: 1 }}>
        <Form.Item
          name="providerId"
          label="供应商"
          rules={[{ required: true, message: '请选择供应商' }]}
        >
          <Select
            options={providerOptions}
            placeholder="选择供应商"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name="zoneId"
          label="可用区"
          rules={[{ required: true, message: '请选择可用区' }]}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="zoneId" noStyle>
              <Select
                options={zoneOptions}
                placeholder={providerId ? '选择可用区' : '请先选择供应商'}
                showSearch
                optionFilterProp="label"
                disabled={!providerId}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Button
              loading={baseLoading}
              onClick={loadProviderBase}
              disabled={!providerId}
            >
              刷新
            </Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item
          name="instanceType"
          label="实例规格"
          rules={[{ required: true, message: '请选择实例规格' }]}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="instanceType" noStyle>
              <Select
                options={instanceTypeOptions}
                placeholder={zoneId ? '选择实例规格' : '请先选择可用区'}
                showSearch
                optionFilterProp="label"
                disabled={!zoneId}
                onSearch={(value) => {
                  setInstanceTypeQuery(value);
                  loadInstanceTypes({ page: 1, query: value });
                }}
                onOpenChange={(openDropdown) => {
                  if (openDropdown && zoneId) {
                    loadInstanceTypes({ page: 1, query: instanceTypeQuery || '' });
                  }
                }}
                popupRender={(menu) => (
                  <>
                    {menu}
                    <div style={{ padding: 8, textAlign: 'center' }}>
                      <Button
                        size="small"
                        loading={instanceTypeLoadingMore}
                        onClick={async () => {
                          setInstanceTypeLoadingMore(true);
                          try {
                            const nextPage = instanceTypePage + 1;
                            const nextList = instanceTypeAll.slice(0, nextPage * instanceTypePageSize);
                            setInstanceTypeOptions(nextList);
                            setInstanceTypePage(nextPage);
                          } finally {
                            setInstanceTypeLoadingMore(false);
                          }
                        }}
                        disabled={instanceTypeOptions.length >= instanceTypeAll.length}
                      >
                        加载更多
                      </Button>
                    </div>
                  </>
                )}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Button
              loading={instanceTypeLoadingMore}
              onClick={() => loadInstanceTypes({ page: 1, query: instanceTypeQuery })}
              disabled={!zoneId}
            >
              刷新
            </Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item
          name="subnetId"
          label="子网"
          rules={[{ required: true, message: '请选择子网' }]}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="subnetId" noStyle>
              <Select
                options={subnetOptions}
                placeholder={zoneId ? '选择子网' : '请先选择可用区'}
                showSearch
                optionFilterProp="label"
                disabled={!zoneId}
                onSearch={(value) => {
                  setSubnetQuery(value);
                  loadSubnets({ page: 1, query: value });
                }}
                onOpenChange={(openDropdown) => {
                  if (openDropdown && zoneId) {
                    loadSubnets({ page: 1, query: subnetQuery || '' });
                  }
                }}
                popupRender={(menu) => (
                  <>
                    {menu}
                    <div style={{ padding: 8, textAlign: 'center' }}>
                      <Button
                        size="small"
                        loading={subnetLoadingMore}
                        onClick={async () => {
                          setSubnetLoadingMore(true);
                          try {
                            await loadSubnets({
                              page: subnetPage + 1,
                              query: subnetQuery,
                              append: true,
                            });
                          } finally {
                            setSubnetLoadingMore(false);
                          }
                        }}
                      >
                        加载更多
                      </Button>
                    </div>
                  </>
                )}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Button
              loading={subnetLoadingMore}
              onClick={() => loadSubnets({ page: 1, query: subnetQuery })}
              disabled={!zoneId}
            >
              刷新
            </Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item
          name="sshKeyId"
          label="密钥"
          rules={[{ required: true, message: '请选择密钥' }]}
        >
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="sshKeyId" noStyle>
              <Select
                options={sshKeyOptions}
                placeholder={providerId ? '选择密钥（需配置 provider_key_id）' : '请先选择供应商'}
                showSearch
                optionFilterProp="label"
                disabled={!providerId}
                popupRender={(menu) => (
                  <>
                    {menu}
                    <div style={{ padding: 8, textAlign: 'center' }}>
                      <Button
                        size="small"
                        loading={sshKeyLoadingMore}
                        onClick={async () => {
                          setSshKeyLoadingMore(true);
                          try {
                            await loadSshKeys({ page: sshKeyPage + 1, append: true });
                          } finally {
                            setSshKeyLoadingMore(false);
                          }
                        }}
                      >
                        加载更多
                      </Button>
                    </div>
                  </>
                )}
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Button
              loading={baseLoading}
              onClick={() => loadSshKeys({ page: 1 })}
              disabled={!providerId}
            >
              刷新
            </Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item
          name="instanceCount"
          label="创建数量"
          rules={[{ required: true, message: '请输入创建数量' }]}
        >
          <Select
            options={Array.from({ length: 100 }).map((_, i) => ({
              label: String(i + 1),
              value: i + 1,
            }))}
          />
        </Form.Item>
        <Divider />

        <Form.Item name="name" label="实例名称（可选）">
          <Input placeholder="可选，仅用于创建名称" />
        </Form.Item>

        <Text type="secondary">
          第一步只创建实例，不绑定 EIP。创建完成后会进入绑定与导入步骤。
        </Text>

        <Divider />

        <Space style={{ marginTop: 16 }}>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            创建并下一步
          </Button>
        </Space>
      </Form>
      )}

      {currentStep === 1 && (
        <div>
          <Space style={{ marginBottom: 12 }}>
            <Button
              icon={<ReloadOutlined />}
              loading={refreshingInstances}
              onClick={refreshInstancesInfo}
              disabled={!createdProviderId}
            >
              刷新实例信息
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadEips({ page: 1, providerId: createdProviderId })}
              disabled={!createdProviderId}
            >
              刷新 EIP
            </Button>
          </Space>

          <Table<CreatedInstance>
            rowKey="instance_id"
            columns={createdInstancesTableColumns as any}
            dataSource={createdInstances}
            pagination={false}
            size="small"
            scroll={{ x: 900 }}
          />

          <Divider />

          <Text type="secondary">
            第二步：为实例选择 EIP 并点击"绑定"按钮进行绑定。没有选择 EIP 的实例不会被绑定。点击"下一步"进入确认导入步骤。
          </Text>

          <Divider />

          <Space style={{ marginTop: 16 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button onClick={handlePrev}>上一步</Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              下一步
            </Button>
          </Space>
        </div>
      )}

      {currentStep === 2 && (
        <div>
          <Typography.Title level={5}>选择要导入的机器</Typography.Title>

          <Table<CreatedInstance>
            rowKey="instance_id"
            rowSelection={{
              selectedRowKeys: selectedImportKeys,
              onChange: (keys) => setSelectedImportKeys(keys),
            }}
            columns={confirmTableColumns as any}
            dataSource={createdInstances}
            pagination={false}
            size="small"
            scroll={{ x: 800 }}
          />

          <Divider />

          <Text type="secondary">
            第三步：选择要导入的实例（可多选），确认后将导入到机器列表。已选择 {selectedImportKeys.length} 台。
          </Text>

          <Divider />

          <Space style={{ marginTop: 16 }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button onClick={handlePrev}>上一步</Button>
            <Button type="primary" loading={loading} onClick={handleSubmit}>
              确认导入
            </Button>
          </Space>
        </div>
      )}
    </Modal>

    <Modal
      title="导入结果"
      open={importResultVisible}
      onCancel={() => setImportResultVisible(false)}
      onOk={() => setImportResultVisible(false)}
      width={800}
    >
      <div style={{ marginBottom: 16 }}>
        <h4>导入统计</h4>
        <Space>
          <span>✓ 新建: {importResult?.summary?.created_count || 0}</span>
          <span>◈ 更新: {importResult?.summary?.updated_count || 0}</span>
          <span>✗ 失败: {importResult?.summary?.failed_count || 0}</span>
        </Space>
      </div>

      {importResult?.created && importResult.created.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ color: '#52c41a' }}>✓ 成功新建</h5>
          <Table
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Provider Instance ID', dataIndex: 'provider_instance_id', key: 'provider_instance_id' },
            ]}
            dataSource={importResult.created}
            size="small"
            pagination={false}
            rowKey="id"
            bordered
          />
        </div>
      )}

      {importResult?.updated && importResult.updated.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ color: '#1677ff' }}>◈ 成功更新</h5>
          <Table
            columns={[
              { title: 'ID', dataIndex: 'id', key: 'id' },
              { title: 'Provider Instance ID', dataIndex: 'provider_instance_id', key: 'provider_instance_id' },
            ]}
            dataSource={importResult.updated}
            size="small"
            pagination={false}
            rowKey="id"
            bordered
          />
        </div>
      )}

      {importResult?.failed && importResult.failed.length > 0 && (
        <div>
          <h5 style={{ color: '#ff4d4f' }}>✗ 导入失败</h5>
          <Table
            columns={[
              { title: '序号', dataIndex: 'index', key: 'index' },
              { title: 'Provider Instance ID', dataIndex: 'provider_instance_id', key: 'provider_instance_id' },
              { title: '原因', dataIndex: 'reason', key: 'reason' },
            ]}
            dataSource={importResult.failed}
            size="small"
            pagination={false}
            rowKey="index"
            bordered
          />
        </div>
      )}
    </Modal>
    </>
  );
};

export default CreateFromCloudModal;