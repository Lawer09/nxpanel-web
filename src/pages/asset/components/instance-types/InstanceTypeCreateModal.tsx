import { App, Form, Input, InputNumber, Modal, Select, Space, Switch } from 'antd';
import React, { useEffect, useState } from 'react';
import { createAssetInstanceType } from '@/services/asset-service/api';
import { normalizeDevErrorMessage } from '../../utils';

type FormValues = {
  provider_id?: number;
  provider_instance_type_id?: string;
  name?: string;
  cpu_count?: number;
  memory_mb?: number;
  bps?: number;
  pps?: number;
  with_stock?: boolean;
  internet_bandwidth_limit?: number;
  source?: string;
  zone_ids_text?: string;
  provider_zone_ids_text?: string;
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

const InstanceTypeCreateModal: React.FC<Props> = ({
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
      with_stock: true,
    });
  }, [form, open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const zoneIds = parseNumberList(values.zone_ids_text);
      const providerZoneIds = parseStringList(values.provider_zone_ids_text);

      setSaving(true);
      await createAssetInstanceType({
        provider_id: values.provider_id,
        provider_instance_type_id: values.provider_instance_type_id?.trim() || undefined,
        name: values.name?.trim() || undefined,
        cpu_count: values.cpu_count,
        memory_mb: values.memory_mb,
        bps: values.bps,
        pps: values.pps,
        with_stock: values.with_stock,
        internet_bandwidth_limit: values.internet_bandwidth_limit,
        source: values.source || 'manual',
        zone_id: zoneIds[0],
        zone_ids: zoneIds,
        provider_zone_id: providerZoneIds[0],
        provider_zone_ids: providerZoneIds,
      });
      message.success('Instance type created.');
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Instance Type"
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
            name="provider_instance_type_id"
            label="Provider Instance Type ID"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Enter provider instance type id.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item name="cpu_count" label="CPU Count" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="memory_mb" label="Memory MB" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="internet_bandwidth_limit" label="Bandwidth Limit" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Space>

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item name="bps" label="BPS" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="pps" label="PPS" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="with_stock"
            label="With Stock"
            valuePropName="checked"
            style={{ flex: 1 }}
          >
            <Switch />
          </Form.Item>
        </Space>

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item
            name="zone_ids_text"
            label="Local Zone IDs"
            style={{ flex: 1 }}
            extra="Comma separated local zone ids"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="provider_zone_ids_text"
            label="Provider Zone IDs"
            style={{ flex: 1 }}
            extra="Comma separated provider zone ids"
          >
            <Input />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};

export default InstanceTypeCreateModal;
