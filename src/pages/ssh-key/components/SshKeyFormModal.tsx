import {
  ModalForm,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { message } from 'antd';
import React from 'react';
import { saveSshKey, updateSshKey } from '@/services/ssh-key/api';

export type SshKeyFormModalValues = {
  name: string;
  tags?: string;
  provider_id?: number | null;
  provider_key_id?: string;
  public_key?: string;
  secret_key?: string;
  note?: string;
};

type SshKeyFormModalProps = {
  open: boolean;
  current?: API.SshKeyItem;
  providerOptions: Array<{ label: string; value: number }>;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const SshKeyFormModal: React.FC<SshKeyFormModalProps> = ({
  open,
  current,
  providerOptions,
  onOpenChange,
  onSuccess,
}) => {
  const [messageApi, contextHolder] = message.useMessage();

  return (
    <ModalForm<SshKeyFormModalValues>
      title={current ? '编辑密钥' : '新增密钥'}
      open={open}
      initialValues={{
        name: current?.name,
        tags: current?.tags,
        provider_id: current?.provider_id ?? undefined,
        provider_key_id: current?.provider_key_id ?? undefined,
        public_key: current?.public_key ?? undefined,
        note: current?.note ?? undefined,
      }}
      modalProps={{
        destroyOnHidden: true,
      }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        try {
          if (current?.id) {
            const payload: API.SshKeyUpdateParams = {
              id: current.id,
              name: values.name,
              tags: values.tags,
              provider_id: values.provider_id ?? null,
              provider_key_id: values.provider_key_id,
              public_key: values.public_key || undefined,
              note: values.note,
              secret_key: values.secret_key || undefined,
            };
            const res = await updateSshKey(payload);
            if (res.code !== 0) {
              messageApi.error(res.msg || '更新失败');
              return false;
            }
            messageApi.success('密钥已更新');
            onSuccess();
            return true;
          }

          const payload: API.SshKeySaveParams = {
            name: values.name,
            tags: values.tags,
            provider_id: values.provider_id ?? null,
            provider_key_id: values.provider_key_id,
            public_key: values.public_key || undefined,
            secret_key: values.secret_key || '',
            note: values.note,
          };
          const res = await saveSshKey(payload);
          if (res.code !== 0) {
            messageApi.error(res.msg || '创建失败');
            return false;
          }
          messageApi.success('密钥已创建');
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
        label="密钥名称"
        rules={[{ required: true, message: '请输入密钥名称' }]}
      />
      
      <ProFormSelect
        name="provider_id"
        label="云服务商"
        allowClear
        showSearch
        fieldProps={{ optionFilterProp: 'label' }}
        options={providerOptions}
      />
      <ProFormText name="provider_key_id" label="云服务商密钥 ID" />
      <ProFormTextArea
        name="public_key"
        label="公钥内容"
        fieldProps={{ autoSize: { minRows: 4, maxRows: 10 } }}
        placeholder="可选，如已保存公钥可填写"
      />
      <ProFormTextArea
        name="secret_key"
        label="密钥内容"
        fieldProps={{ autoSize: { minRows: 6, maxRows: 12 } }}
        rules={
          current?.id
            ? []
            : [{ required: true, message: '请输入密钥内容' }]
        }
        placeholder={current?.id ? '留空则不更新密钥内容' : '请输入密钥内容'}
      />
      <ProFormTextArea
        name="note"
        label="备注"
        fieldProps={{ autoSize: { minRows: 2, maxRows: 6 } }}
      />
      <ProFormText name="tags" label="标签" placeholder="如：production,aws" />
    </ModalForm>
  );
};

export default SshKeyFormModal;
