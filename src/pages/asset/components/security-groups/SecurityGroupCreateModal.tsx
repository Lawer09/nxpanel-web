import { App, Form, Input, Modal, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { createAssetSecurityGroup } from '@/services/asset-service/api';
import AssetTagEditor from '../AssetTagEditor';
import {
  normalizeAssetTags,
  normalizeDevErrorMessage,
} from '../../utils';

type FormValues = {
  provider_id?: number;
  provider_security_group_id?: string;
  name?: string;
  provider_name?: string;
  source?: string;
  tags?: API.AssetTagItem[];
};

type Props = {
  open: boolean;
  providers: API.AssetProvider[];
  onCancel: () => void;
  onSuccess: () => void;
};

const SOURCE_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Import', value: 'import' },
  { label: 'Provider', value: 'provider' },
];

const SecurityGroupCreateModal: React.FC<Props> = ({
  open,
  providers,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      source: 'manual',
      tags: [],
    });
  }, [form, open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await createAssetSecurityGroup({
        provider_id: values.provider_id,
        provider_security_group_id:
          values.provider_security_group_id?.trim() || undefined,
        name: values.name?.trim() || undefined,
        provider_name: values.provider_name?.trim() || undefined,
        source: values.source || 'manual',
        tags: normalizeAssetTags(values.tags),
      });
      message.success('Security group created.');
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Security Group"
      open={open}
      width={860}
      destroyOnHidden
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
    >
      <Form<FormValues> form={form} layout="vertical">
        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item
            name="provider_id"
            label="Provider"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Select a provider.' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={providers.map((item) => ({
                label: `${item.name || item.code} (#${item.id})`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="source" label="Source" style={{ flex: 1 }}>
            <Select options={SOURCE_OPTIONS} />
          </Form.Item>
        </Space>

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item
            name="provider_security_group_id"
            label="Provider Security Group ID"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Enter provider security group id.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Form.Item name="provider_name" label="Provider Name">
          <Input />
        </Form.Item>

        <AssetTagEditor name="tags" label="Tags" />
      </Form>
    </Modal>
  );
};

export default SecurityGroupCreateModal;
