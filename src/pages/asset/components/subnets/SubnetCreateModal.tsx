import { App, Form, Input, Modal, Select, Space } from 'antd';
import React, { useEffect, useState } from 'react';
import { createAssetSubnet } from '@/services/asset-service/api';
import AssetTagEditor from '../AssetTagEditor';
import {
  normalizeAssetTags,
  normalizeDevErrorMessage,
} from '../../utils';

type FormValues = {
  provider_id?: number;
  provider_subnet_id?: string;
  cidr_block?: string;
  gateway_ip_address?: string;
  vpc_id?: string;
  vpc_name?: string;
  source?: string;
  region_id?: number;
  provider_region_id?: string;
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

const SubnetCreateModal: React.FC<Props> = ({
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
      await createAssetSubnet({
        provider_id: values.provider_id,
        provider_subnet_id: values.provider_subnet_id?.trim() || undefined,
        cidr_block: values.cidr_block?.trim() || undefined,
        gateway_ip_address: values.gateway_ip_address?.trim() || undefined,
        vpc_id: values.vpc_id?.trim() || undefined,
        vpc_name: values.vpc_name?.trim() || undefined,
        source: values.source || 'manual',
        region_id: values.region_id,
        provider_region_id: values.provider_region_id?.trim() || undefined,
        tags: normalizeAssetTags(values.tags),
      });
      message.success('Subnet created.');
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create Subnet"
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
            name="provider_subnet_id"
            label="Provider Subnet ID"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Enter provider subnet id.' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="provider_region_id" label="Provider Region ID" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item name="cidr_block" label="CIDR Block" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="gateway_ip_address" label="Gateway IP" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Space size={16} style={{ width: '100%' }} align="start">
          <Form.Item name="vpc_id" label="VPC ID" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="vpc_name" label="VPC Name" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Form.Item name="region_id" label="Local Region ID">
          <Input />
        </Form.Item>

        <AssetTagEditor name="tags" label="Tags" />
      </Form>
    </Modal>
  );
};

export default SubnetCreateModal;
