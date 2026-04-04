import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { message } from 'antd';
import React from 'react';
import { saveProvider } from '@/services/provider/api';

type ProviderFormModalValues = Partial<API.ProviderSaveParams> & {
  regions_text?: string;
  services_text?: string;
  metadata_text?: string;
  api_credentials_text?: string;
  supported_operations_text?: string;
};

type ProviderFormModalProps = {
  open: boolean;
  current?: API.ProviderItem;
  asnOptions: Array<{ label: string; value: number; asn: string }>;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const parseJsonField = (value?: string, fieldName?: string) => {
  if (!value?.trim()) {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch (_error) {
    throw new Error(`${fieldName} 必须是合法 JSON`);
  }
};

const ProviderFormModal: React.FC<ProviderFormModalProps> = ({
  open,
  current,
  asnOptions,
  onOpenChange,
  onSuccess,
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <ModalForm<ProviderFormModalValues>
      title={current ? '编辑 Provider' : '新增 Provider'}
      open={open}
      initialValues={{
        ...current,
        is_active: current?.id ? current.is_active : true,
        regions_text: current?.regions
          ? JSON.stringify(current.regions, null, 2)
          : undefined,
        services_text: current?.services
          ? JSON.stringify(current.services, null, 2)
          : undefined,
        metadata_text: current?.metadata
          ? JSON.stringify(current.metadata, null, 2)
          : undefined,
        api_credentials_text: current?.api_credentials
          ? JSON.stringify(current.api_credentials, null, 2)
          : undefined,
        supported_operations_text: current?.supported_operations
          ? JSON.stringify(current.supported_operations, null, 2)
          : undefined,
      }}
      modalProps={{
        destroyOnHidden: true,
      }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        try {
          const selectedAsn = asnOptions.find(
            (item) => item.value === values.asn_id,
          );
          const payload: API.ProviderSaveParams = {
            id: current?.id,
            name: values.name,
            description: values.description,
            website: values.website,
            email: values.email,
            phone: values.phone,
            country: values.country,
            type: values.type,
            asn_id: values.asn_id,
            asn: selectedAsn?.asn,
            reliability: values.reliability,
            reputation: values.reputation,
            speed_level: values.speed_level,
            stability: values.stability,
            is_active: values.is_active,
            regions: parseJsonField(values.regions_text, 'regions'),
            services: parseJsonField(values.services_text, 'services'),
            metadata: parseJsonField(values.metadata_text, 'metadata'),
            driver: values.driver,
            api_credentials: parseJsonField(values.api_credentials_text, 'api_credentials'),
            supported_operations: parseJsonField(values.supported_operations_text, 'supported_operations'),
          };
          const res = await saveProvider(payload);
          if (res.code !== 0) {
            messageApi.error(res.msg || '保存失败');
            return false;
          }
          messageApi.success(current ? 'Provider 已更新' : 'Provider 已创建');
          onSuccess();
          return true;
        } catch (error: any) {
          messageApi.error(error?.message || '保存失败');
          return false;
        }
      }}
    >
      {contextHolder}
      <ProFormText
        name="name"
        label="Provider 名称"
        disabled={Boolean(current?.id)}
        rules={[{ required: true, message: '请输入 Provider 名称' }]}
      />
      <ProFormTextArea name="description" label="描述" />
      <ProFormText name="website" label="官网" />
      <ProFormText
        name="email"
        label="邮箱"
        rules={[{ type: 'email', message: '邮箱格式错误' }]}
      />
      <ProFormText name="phone" label="电话" />
      <ProFormText
        name="country"
        label="国家代码"
        rules={[{ pattern: /^[A-Za-z]{2}$/, message: '请输入 2 位国家代码' }]}
      />
      <ProFormText name="type" label="类型" />
      <ProFormSelect
        name="asn_id"
        label="关联 ASN"
        options={asnOptions}
        showSearch
        fieldProps={{
          optionFilterProp: 'label',
          allowClear: true,
        }}
      />
      <ProFormDigit name="reliability" label="可靠性" min={0} max={100} />
      <ProFormDigit name="reputation" label="声誉" min={0} max={100} />
      <ProFormDigit name="speed_level" label="速度等级" min={0} max={100} />
      <ProFormDigit name="stability" label="稳定性" min={0} max={100} />
      <ProFormSwitch name="is_active" label="是否活跃" />
      <ProFormTextArea
        name="regions_text"
        label="覆盖地区(JSON)"
        fieldProps={{ autoSize: { minRows: 3, maxRows: 8 } }}
      />
      <ProFormTextArea
        name="services_text"
        label="服务(JSON)"
        fieldProps={{ autoSize: { minRows: 3, maxRows: 8 } }}
      />
      <ProFormTextArea
        name="metadata_text"
        label="metadata(JSON)"
        fieldProps={{ autoSize: { minRows: 3, maxRows: 8 } }}
      />
      <ProFormText
        name="driver"
        label="驱动标识"
        fieldProps={{ maxLength: 50 }}
        tooltip="驱动程序标识符，如 vultr、aws 等"
      />
      <ProFormTextArea
        name="api_credentials_text"
        label="API 凭证(JSON)"
        fieldProps={{ autoSize: { minRows: 3, maxRows: 8 } }}
        tooltip="API 密钥等凭证信息，将自动加密存储"
      />
      <ProFormTextArea
        name="supported_operations_text"
        label="支持的操作(JSON 数组)"
        fieldProps={{ autoSize: { minRows: 2, maxRows: 6 } }}
        tooltip='例如：["create", "delete", "reboot"]'
      />
    </ModalForm>
  );
};

export default ProviderFormModal;
