import { App, Form, Input, Modal, Select, Space } from 'antd';
import React, { useEffect } from 'react';
import {
  createAssetImage,
  updateAssetImage,
} from '@/services/asset-service/api';
import AssetTagEditor from '../AssetTagEditor';
import {
  normalizeAssetTags,
  normalizeDevErrorMessage,
} from '../../utils';

const SOURCE_OPTIONS = [
  { label: 'Manual', value: 'manual' },
  { label: 'Import', value: 'import' },
  { label: 'Provider', value: 'provider' },
];

type FormValues = {
  provider_id?: number;
  provider_image_id?: string;
  name?: string;
  type?: string;
  os_type?: string;
  category?: string;
  version?: string;
  status?: string;
  source?: string;
  zone_ids_text?: string;
  provider_zone_ids_text?: string;
  tags?: API.AssetTagItem[];
};

type Props = {
  open: boolean;
  providers: API.AssetProvider[];
  editing?: API.AssetImage | null;
  onCancel: () => void;
  onSuccess: () => void;
};

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

const ImageEditModal: React.FC<Props> = ({
  open,
  providers,
  editing,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = React.useState(false);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      provider_id: editing?.provider_id || undefined,
      provider_image_id: editing?.provider_image_id || undefined,
      name: editing?.name || '',
      type: editing?.type || undefined,
      os_type: editing?.os_type || undefined,
      category: editing?.category || undefined,
      version: editing?.version || undefined,
      status: editing?.status || undefined,
      source: editing?.source || 'manual',
      zone_ids_text: editing?.zone_ids?.join(', ') || '',
      tags: editing?.tags || [],
    });
  }, [editing, form, open]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload: API.AssetImageCreateParams = {
        provider_id: values.provider_id,
        provider_image_id: values.provider_image_id?.trim() || undefined,
        name: values.name?.trim() || '',
        type: values.type?.trim() || undefined,
        os_type: values.os_type?.trim() || undefined,
        category: values.category?.trim() || undefined,
        version: values.version?.trim() || undefined,
        status: values.status?.trim() || undefined,
        source: values.source?.trim() || undefined,
        zone_ids: parseNumberList(values.zone_ids_text),
        provider_zone_ids: parseStringList(values.provider_zone_ids_text),
        tags: normalizeAssetTags(values.tags),
      };

      setSaving(true);
      if (editing) {
        await updateAssetImage({ id: editing.id, ...payload });
        message.success('Image updated.');
      } else {
        await createAssetImage(payload);
        message.success('Image created.');
      }
      onSuccess();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={editing ? `Edit Image #${editing.id}` : 'Create Image'}
      open={open}
      width={860}
      destroyOnHidden
      confirmLoading={saving}
      onCancel={onCancel}
      onOk={() => void handleSubmit()}
    >
      <Form<FormValues> form={form} layout="vertical">
        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item name="provider_id" label="Provider" style={{ flex: 1 }}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              options={providers.map((item) => ({
                label: `${item.name || item.code} (#${item.id})`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="source" label="Source" style={{ flex: 1 }}>
            <Select allowClear options={SOURCE_OPTIONS} />
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item name="provider_image_id" label="Provider Image ID" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label="Name"
            style={{ flex: 1 }}
            rules={[{ required: true, message: 'Enter image name.' }]}
          >
            <Input />
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item name="type" label="Type" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="os_type" label="OS Type" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Status" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
          <Form.Item name="category" label="Category" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
          <Form.Item name="version" label="Version" style={{ flex: 1 }}>
            <Input />
          </Form.Item>
        </Space>

        <Space size={16} align="start" style={{ width: '100%' }}>
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

        <AssetTagEditor name="tags" label="Tags" />
      </Form>
    </Modal>
  );
};

export default ImageEditModal;
