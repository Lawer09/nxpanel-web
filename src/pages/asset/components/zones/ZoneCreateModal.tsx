import { App, Form, Input, Modal, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { createAssetZone } from '@/services/asset-service/api';
import { normalizeDevErrorMessage } from '../../utils';

type FormValues = {
  provider_id?: number;
  provider_zone_id?: string;
  provider_name?: string;
  country_code?: string;
  country_name?: string;
  city_code?: string;
  city_name?: string;
  time_zone?: string;
  source?: string;
  region_ids_text?: string;
  provider_region_ids_text?: string;
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

const parseNumberList = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

const parseStringList = (value?: string) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const ZoneCreateModal: React.FC<Props> = ({
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
      const regionIds = parseNumberList(values.region_ids_text);
      const providerRegionIds = parseStringList(values.provider_region_ids_text);

      setSaving(true);
      await createAssetZone({
        provider_id: values.provider_id,
        provider_zone_id: values.provider_zone_id?.trim() || undefined,
        provider_name: values.provider_name?.trim() || undefined,
        country_code: values.country_code?.trim() || undefined,
        country_name: values.country_name?.trim() || undefined,
        city_code: values.city_code?.trim() || undefined,
        city_name: values.city_name?.trim() || undefined,
        time_zone: values.time_zone?.trim() || undefined,
        source: values.source || 'manual',
        region_id: regionIds[0],
        region_ids: regionIds,
        provider_region_id: providerRegionIds[0],
        provider_region_ids: providerRegionIds,
      });
      message.success('Zone created.');
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Zone"
      open={open}
      width={920}
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
            name="provider_zone_id"
            label="Provider Zone ID"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Enter provider zone id.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="provider_name" label="Provider Name" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item name="country_code" label="Country Code" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="country_name" label="Country Name" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="time_zone" label="Time Zone" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item name="city_code" label="City Code" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="city_name" label="City Name" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item
            name="region_ids_text"
            label="Local Region IDs"
            style={{ flex: 1 }}
            extra="Comma separated local region ids"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="provider_region_ids_text"
            label="Provider Region IDs"
            style={{ flex: 1 }}
            extra="Comma separated provider region ids"
          >
            <Input />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default ZoneCreateModal;
