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
import { saveAsn } from '@/services/swagger/asn';

type AsnFormModalValues = Partial<API.AsnSaveParams> & {
  metadata_text?: string;
};

type AsnFormModalProps = {
  open: boolean;
  current?: API.AsnItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const AsnFormModal: React.FC<AsnFormModalProps> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <ModalForm<AsnFormModalValues>
      title={current ? '编辑 ASN' : '新增 ASN'}
      open={open}
      initialValues={{
        ...current,
        metadata_text: current?.metadata
          ? JSON.stringify(current.metadata, null, 2)
          : undefined,
      }}
      modalProps={{
        destroyOnHidden: true,
      }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        let metadata: Record<string, any> | undefined;
        if (values.metadata_text?.trim()) {
          try {
            metadata = JSON.parse(values.metadata_text);
          } catch (_error) {
            messageApi.error('metadata 必须是合法 JSON');
            return false;
          }
        }
        const payload: API.AsnSaveParams = {
          id: current?.id,
          asn: current?.id ? undefined : values.asn,
          name: values.name,
          description: values.description,
          country: values.country,
          type: values.type,
          is_datacenter: values.is_datacenter,
          reliability: values.reliability,
          reputation: values.reputation,
          metadata,
        };
        const res = await saveAsn(payload);
        if (res.code !== 0) {
          messageApi.error(res.msg || '保存失败');
          return false;
        }
        messageApi.success(current ? 'ASN 已更新' : 'ASN 已创建');
        onSuccess();
        return true;
      }}
    >
      {contextHolder}
      <ProFormText
        name="asn"
        label="ASN 号"
        disabled={Boolean(current?.id)}
        rules={
          current?.id
            ? []
            : [
                { required: true, message: '请输入 ASN 号' },
                { pattern: /^AS\d{1,10}$/i, message: 'ASN 格式应为 AS123456' },
              ]
        }
      />
      <ProFormText
        name="name"
        label="名称"
        rules={[{ required: true, message: '请输入名称' }]}
      />
      <ProFormTextArea name="description" label="描述" />
      <ProFormText
        name="country"
        label="国家代码"
        rules={[{ pattern: /^[A-Za-z]{2}$/, message: '请输入 2 位国家代码' }]}
      />
      <ProFormSelect
        name="type"
        label="类型"
        options={[
          { label: 'ISP', value: 'ISP' },
          { label: 'CDN', value: 'CDN' },
          { label: '企业', value: '企业' },
        ]}
      />
      <ProFormSwitch name="is_datacenter" label="数据中心" />
      <ProFormDigit name="reliability" label="可靠性" min={0} max={100} />
      <ProFormDigit name="reputation" label="声誉" min={0} max={100} />
      <ProFormTextArea
        name="metadata_text"
        label="metadata(JSON)"
        fieldProps={{ autoSize: { minRows: 3, maxRows: 8 } }}
      />
    </ModalForm>
  );
};

export default AsnFormModal;
