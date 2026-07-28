import React, { useEffect, useState } from 'react';
import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import type { FormInstance, Rule } from 'antd/es/form';
import { App, AutoComplete, Card, Col, Form, Input, Row, Select, Space, Tabs, Typography } from 'antd';
import { useRequest } from '@umijs/max';
import {
  createAdAccount,
  createProject,
  createTrafficAccount,
  createUserApp,
  updateProject,
} from '@/services/project/api';
import { getAdAccounts as fetchAdPlatformAccounts, getAdRevenueApps } from '@/services/ad/api';
import { getTrafficAccounts as fetchTrafficPlatformAccounts } from '@/services/traffic-platform/api';
import { fetchAdminUserOptions } from '@/services/user/api';
import type { ProjectItem } from '@/services/project/types';
import {
  normalizeProjectFormValues,
  PROJECT_FIELD_GROUPS,
  type ProjectFieldConfig,
} from '../fields';

interface ProjectTableFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (project?: Partial<ProjectItem>) => void;
  initialValues?: ProjectItem;
}

const STATUS_OPTIONS = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
  { label: '已归档', value: 'archived' },
];

type SelectOption = { label: string; value: number | string };

const ENABLED_OPTIONS = [
  { label: '启用', value: 1 },
  { label: '停用', value: 0 },
];

const getCreatedProject = (res: any): Partial<ProjectItem> | undefined => {
  const data = res?.data ?? res;
  return data?.data ?? data;
};

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
};

const extractPageRows = <T,>(res: any): T[] => {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.data)) return data.data.data;
  return [];
};

const isAndroidPlatform = (value: unknown) => `${value ?? ''}`.trim().toUpperCase() === 'ANDROID';

const buildAdminOptionLabel = (item: API.AdminUserOption) => {
  const nickname = item.nickname?.trim();
  return nickname ? `${nickname}（${item.email}）` : item.email;
};

const getInitialOwnerIds = (project?: ProjectItem): number[] => {
  if (!project) return [];
  const ownerIds = Array.isArray(project.ownerIds) ? project.ownerIds : [];
  if (ownerIds.length) {
    return ownerIds.map((ownerId) => Number(ownerId)).filter((ownerId) => ownerId > 0);
  }
  return project.ownerId ? [project.ownerId] : [];
};

const renderField = (
  field: ProjectFieldConfig,
  isEdit: boolean,
  form: FormInstance,
  ownerOptions: SelectOption[],
  ownerOptionsLoading: boolean,
) => {
  const rules: Rule[] = field.required ? [{ required: true, message: `请输入${field.label}` }] : [];
  if (field.name === 'storePageUrl') {
    rules.push({
      validator: async (_, value) => {
        if (!isAndroidPlatform(form.getFieldValue('appPlatform'))) return;
        if (typeof value === 'string' && value.trim()) return;
        return Promise.reject(new Error('请输入商店页链接'));
      },
    });
  }
  const commonProps = {
    name: field.name,
    label: field.label,
    rules: rules.length ? rules : undefined,
  };

  if (field.name === 'ownerName') {
    return (
      <ProFormSelect
        name="ownerIds"
        label={field.label}
        mode="multiple"
        options={ownerOptions}
        showSearch
        placeholder="选择负责人"
        allowClear
        fieldProps={{ optionFilterProp: 'label', loading: ownerOptionsLoading, maxTagCount: 'responsive' }}
      />
    );
  }

  if (field.multiline) {
    return <ProFormTextArea {...commonProps} fieldProps={{ rows: 4 }} />;
  }

  if (field.allowCustomInput) {
    return (
      <Form.Item {...commonProps}>
        <AutoComplete
          allowClear
          options={field.options}
          placeholder={`选择或输入${field.label}`}
          filterOption={(inputValue, option) =>
            `${option?.value ?? ''}`.toLowerCase().includes(inputValue.toLowerCase())
          }
        >
          <Input />
        </AutoComplete>
      </Form.Item>
    );
  }

  if (field.name === 'storePageUrl') {
    return (
      <Form.Item {...commonProps} dependencies={['appPlatform']}>
        <Input />
      </Form.Item>
    );
  }

  if (field.options) {
    return (
      <ProFormSelect
        {...commonProps}
        options={field.options}
        showSearch
        fieldProps={{ optionFilterProp: 'label' }}
      />
    );
  }

  return (
    <ProFormText
      {...commonProps}
      disabled={isEdit && field.disabledOnEdit}
    />
  );
};

const ProjectTableForm: React.FC<ProjectTableFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
  initialValues,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const isEdit = !!initialValues;
  const { data: adminOptionsRes, loading: adminOptionsLoading } = useRequest(
    fetchAdminUserOptions,
    { cacheKey: 'admin-user-options' },
  );
  const [trafficAccountOptions, setTrafficAccountOptions] = useState<SelectOption[]>([]);
  const [trafficAccountRows, setTrafficAccountRows] = useState<any[]>([]);
  const [adAccountOptions, setAdAccountOptions] = useState<SelectOption[]>([]);
  const [adAccountRows, setAdAccountRows] = useState<any[]>([]);
  const [adAppOptions, setAdAppOptions] = useState<SelectOption[]>([]);
  const [selectedTrafficPlatform, setSelectedTrafficPlatform] = useState<string>();
  const [selectedAdPlatform, setSelectedAdPlatform] = useState<string>();
  const [selectedAdAccountId, setSelectedAdAccountId] = useState<number>();
  const adminOptionRows: API.AdminUserOption[] = Array.isArray(adminOptionsRes)
    ? adminOptionsRes
    : Array.isArray((adminOptionsRes as any)?.data)
      ? (adminOptionsRes as any).data
      : Array.isArray((adminOptionsRes as any)?.data?.data)
        ? (adminOptionsRes as any).data.data
        : [];
  const ownerOptions = adminOptionRows.map((item) => ({
    label: buildAdminOptionLabel(item),
    value: item.id,
  }));

  useEffect(() => {
    if (!open) return;
    if (initialValues) {
      form.setFieldsValue({
        ...initialValues,
        ownerIds: getInitialOwnerIds(initialValues),
      });
      return;
    }
    form.resetFields();
    form.setFieldsValue({
      status: 'active',
      trafficAccount: { enabled: 1 },
      adAccount: { enabled: 1 },
      userApp: { enabled: 1 },
    });
    setSelectedTrafficPlatform(undefined);
    setSelectedAdPlatform(undefined);
    setSelectedAdAccountId(undefined);
    setAdAppOptions([]);
  }, [form, initialValues, open]);

  const loadTrafficAccounts = async (keyword?: string) => {
    const res = await fetchTrafficPlatformAccounts({ keyword, page: 1, pageSize: 200 });
    const list = extractPageRows<any>(res);
    setTrafficAccountRows(list);
    setTrafficAccountOptions(
      list.map((item) => ({
        label: `[${item.id}] ${item.accountName ?? '-'} (${item.platformCode ?? '-'})`,
        value: item.id,
      })),
    );
  };

  const loadAdAccounts = async (keyword?: string) => {
    const res = await fetchAdPlatformAccounts({ keyword, page: 1, pageSize: 200 });
    const list = extractPageRows<any>(res);
    setAdAccountRows(list);
    setAdAccountOptions(
      list.map((item) => ({
        label: `[${item.id}] ${item.accountLabel ? `${item.accountLabel} - ` : ''}${
          item.accountName ?? '-'
        } (${item.sourcePlatform ?? '-'})`,
        value: item.id,
      })),
    );
  };

  const loadAdApps = async (accountId: number) => {
    const res = await getAdRevenueApps({ accountId, page: 1, pageSize: 200 });
    const list = extractPageRows<any>(res);
    setAdAppOptions(
      list.map((item) => ({
        label: `${item.providerAppName ?? '-'} (${item.providerAppId ?? '-'})`,
        value: item.providerAppId,
      })),
    );
  };

  const handleTrafficAccountChange = (value?: number) => {
    const account = trafficAccountRows.find((item) => item.id === value);
    setSelectedTrafficPlatform(account?.platformCode);
  };

  const handleAdAccountChange = (value?: number) => {
    const account = adAccountRows.find((item) => item.id === value);
    setSelectedAdPlatform(account?.sourcePlatform);
    setSelectedAdAccountId(value);
    setAdAppOptions([]);
    form.setFieldsValue({ adAccount: { externalAppId: undefined } });
    if (value) {
      void loadAdApps(value);
    }
  };

  const renderCreateAssociationTab = () => (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Typography.Text type="secondary">
        流量账号和广告账号为可选项，用户 App 必填。项目创建成功后，系统会使用新项目 ID 自动新增对应关联。
      </Typography.Text>
      <Card size="small" title="流量账号关联">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={['trafficAccount', 'trafficPlatformAccountId']} label="流量账号">
              <Select
                allowClear
                showSearch
                filterOption={false}
                optionFilterProp="label"
                options={trafficAccountOptions}
                placeholder="搜索并选择流量账号"
                onFocus={() => {
                  if (trafficAccountOptions.length === 0) void loadTrafficAccounts();
                }}
                onSearch={(keyword) => void loadTrafficAccounts(keyword)}
                onChange={handleTrafficAccountChange}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <ProFormSelect
              name={['trafficAccount', 'enabled']}
              label="状态"
              options={ENABLED_OPTIONS}
            />
          </Col>
          <Col span={24}>
            <ProFormTextArea name={['trafficAccount', 'remark']} label="备注" fieldProps={{ rows: 2 }} />
          </Col>
        </Row>
      </Card>
      <Card size="small" title="广告账号关联">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name={['adAccount', 'adPlatformAccountId']} label="广告账号">
              <Select
                allowClear
                showSearch
                filterOption={false}
                optionFilterProp="label"
                options={adAccountOptions}
                placeholder="搜索并选择广告账号"
                onFocus={() => {
                  if (adAccountOptions.length === 0) void loadAdAccounts();
                }}
                onSearch={(keyword) => void loadAdAccounts(keyword)}
                onChange={handleAdAccountChange}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['adAccount', 'externalAppId']} label="App">
              <Select
                allowClear
                showSearch
                disabled={!selectedAdAccountId}
                optionFilterProp="label"
                options={adAppOptions}
                placeholder="选择 App（可选）"
                notFoundContent={selectedAdAccountId ? '暂无 App 数据' : '请先选择广告账号'}
                onFocus={() => {
                  if (selectedAdAccountId) void loadAdApps(selectedAdAccountId);
                }}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <ProFormSelect
              name={['adAccount', 'enabled']}
              label="状态"
              options={ENABLED_OPTIONS}
            />
          </Col>
          <Col span={24}>
            <ProFormTextArea name={['adAccount', 'remark']} label="备注" fieldProps={{ rows: 2 }} />
          </Col>
        </Row>
      </Card>
      <Card size="small" title="用户 App 关联">
        <Row gutter={16}>
          <Col span={12}>
            <ProFormText
              name={['userApp', 'appId']}
              label="App ID"
              placeholder="例如 com.example.app"
              rules={[{ required: true, message: '请输入 App ID' }]}
            />
          </Col>
          <Col span={12}>
            <ProFormText name={['userApp', 'appLink']} label="App Link" />
          </Col>
          <Col span={6}>
            <ProFormSelect
              name={['userApp', 'enabled']}
              label="状态"
              options={ENABLED_OPTIONS}
            />
          </Col>
          <Col span={24}>
            <ProFormTextArea name={['userApp', 'remark']} label="备注" fieldProps={{ rows: 2 }} />
          </Col>
        </Row>
      </Card>
    </Space>
  );

  return (
    <ModalForm
      title={isEdit ? '编辑项目' : '新建项目'}
      open={open}
      onOpenChange={onOpenChange}
      form={form}
      width={900}
      modalProps={{ destroyOnHidden: true }}
      onFinish={async (values) => {
        const {
          trafficAccount,
          adAccount,
          userApp,
          ...projectValues
        } = values;
        const payload = normalizeProjectFormValues(projectValues);
        if (Object.prototype.hasOwnProperty.call(payload, 'ownerIds')) {
          delete (payload as Record<string, unknown>).ownerName;
          delete (payload as Record<string, unknown>).ownerId;
        }
        try {
          if (isEdit) {
            const res = await updateProject({ ...payload, id: initialValues.id });
            const updatedProject = getCreatedProject(res);
            message.success('编辑成功');
            onSuccess(updatedProject ? { ...initialValues, ...updatedProject } : { ...initialValues, ...payload });
          } else {
            const res = await createProject(payload as any);
            const createdProject = getCreatedProject(res);
            const projectId = Number(createdProject?.id);
            if (!projectId) {
              message.success('创建成功');
              onSuccess(createdProject);
              return true;
            }

            const tasks: Array<{ label: string; promise: Promise<unknown> }> = [];
            const trafficPlatformAccountId = Number(trafficAccount?.trafficPlatformAccountId);
            if (trafficPlatformAccountId) {
              tasks.push({
                label: '流量账号',
                promise: selectedTrafficPlatform
                  ? createTrafficAccount({
                      projectId,
                      trafficPlatformAccountId,
                      platformCode: selectedTrafficPlatform,
                      bindType: 'account',
                      enabled: trafficAccount.enabled ?? 1,
                      remark: normalizeOptionalString(trafficAccount.remark) as string | undefined,
                    })
                  : Promise.reject(new Error('缺少流量平台编码')),
              });
            }

            const adPlatformAccountId = Number(adAccount?.adPlatformAccountId);
            if (adPlatformAccountId) {
              const externalAppId = normalizeOptionalString(adAccount?.externalAppId) as string | undefined;
              tasks.push({
                label: '广告账号',
                promise: selectedAdPlatform
                  ? createAdAccount({
                      projectId,
                      adPlatformAccountId,
                      platformCode: selectedAdPlatform,
                      externalAppId,
                      bindType: externalAppId ? 'app' : 'account',
                      enabled: adAccount.enabled ?? 1,
                      remark: normalizeOptionalString(adAccount.remark) as string | undefined,
                    })
                  : Promise.reject(new Error('缺少广告平台编码')),
              });
            }

            const appId = normalizeOptionalString(userApp?.appId) as string | undefined;
            if (appId) {
              tasks.push({
                label: '用户 App',
                promise: createUserApp({
                  projectId,
                  appId,
                  appLink: normalizeOptionalString(userApp?.appLink) as string | undefined,
                  enabled: userApp.enabled ?? 1,
                  remark: normalizeOptionalString(userApp?.remark) as string | undefined,
                }),
              });
            }

            if (tasks.length) {
              const results = await Promise.allSettled(tasks.map((task) => task.promise));
              const failedLabels = results
                .map((result, index) => (result.status === 'rejected' ? tasks[index].label : undefined))
                .filter(Boolean);
              if (failedLabels.length) {
                message.warning(`项目已创建，${failedLabels.join('、')}关联创建失败，请在详情中补充`);
              } else {
                message.success(`创建成功，已新增 ${tasks.length} 个关联`);
              }
            } else {
              message.success('创建成功');
            }
            onSuccess(createdProject);
          }
          return true;
        } catch (_error) {
          return false;
        }
      }}
      onValuesChange={(changedValues) => {
        if (Object.prototype.hasOwnProperty.call(changedValues, 'appPlatform')) {
          void form.validateFields(['storePageUrl']).catch(() => undefined);
        }
      }}
    >
      <Tabs
        items={[
          ...PROJECT_FIELD_GROUPS.map((group) => ({
            key: group.key,
            label: group.label,
            children: (
              <Row gutter={16}>
                {group.key === 'base' ? (
                  <Col span={8}>
                    <ProFormSelect
                      name="status"
                      label="状态"
                      options={STATUS_OPTIONS}
                      rules={[{ required: true, message: '请选择状态' }]}
                    />
                  </Col>
                ) : null}
                {group.fields.map((field) => (
                  <Col span={field.multiline ? 24 : 8} key={field.name}>
                    {renderField(field, isEdit, form, ownerOptions, adminOptionsLoading)}
                  </Col>
                ))}
              </Row>
            ),
          })),
          ...(!isEdit
            ? [
              {
                key: 'associations',
                label: '关联信息',
                children: renderCreateAssociationTab(),
              },
            ]
            : []),
        ]}
      />
    </ModalForm>
  );
};

export default ProjectTableForm;
