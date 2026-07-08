import { App, Form, Input, Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import { createAssetRegion } from '@/services/asset-service/api';
import { normalizeDevErrorMessage } from '../../utils';

type FormValues = {
  provider_id?: number;
  provider_region_id?: string;
  region_name?: string;
  source?: string;
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

const RegionCreateModal: React.FC<Props> = ({
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
    });
  }, [form, open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await createAssetRegion({
        provider_id: Number(values.provider_id),
        provider_region_id: values.provider_region_id?.trim() || '',
        region_name: values.region_name?.trim() || undefined,
        source: values.source || 'manual',
      });
      message.success('Region created.');
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Region"
      open={open}
      destroyOnHidden
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
    >
      <Form<FormValues> form={form} layout="vertical">
        <Form.Item
          name="provider_id"
          label="Provider"
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
        <Form.Item
          name="provider_region_id"
          label="Provider Region ID"
          rules={[{ required: true, message: 'Enter provider region id.' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="region_name" label="Region Name">
          <Input />
        </Form.Item>
        <Form.Item name="source" label="Source">
          <Select options={SOURCE_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RegionCreateModal;
