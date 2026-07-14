import { App, Form, Input, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { createAssetTag } from '@/services/asset-service/api';
import { normalizeDevErrorMessage } from '../../utils';

type FormValues = {
  provider_tag_id?: string;
  key?: string;
  value?: string;
};

type Props = {
  open: boolean;
  onCancel: () => void;
  onSuccess: () => void;
};

const TagCreateModal: React.FC<Props> = ({ open, onCancel, onSuccess }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      form.resetFields();
    }
  }, [form, open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await createAssetTag({
        provider_tag_id: values.provider_tag_id?.trim() || undefined,
        key: values.key?.trim() || '',
        value: values.value?.trim() || undefined,
      });
      message.success('Tag created.');
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Tag"
      open={open}
      destroyOnHidden
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
    >
      <Form<FormValues> form={form} layout="vertical">
        <Form.Item name="provider_tag_id" label="Provider Tag ID">
          <Input placeholder="Optional, defaults to key:value" />
        </Form.Item>
        <Form.Item
          name="key"
          label="Key"
          rules={[{ required: true, message: 'Enter tag key.' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="value" label="Value">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TagCreateModal;
