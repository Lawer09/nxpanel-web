import { Form, Input, Modal, Select } from 'antd';
import React, { useEffect } from 'react';
import AssetTagEditor from '../AssetTagEditor';
import type { MachineScriptFormValues } from '../../types';

const { TextArea } = Input;

type Props = {
  open: boolean;
  saving: boolean;
  initialValues?: Partial<MachineScriptFormValues>;
  editingId?: number;
  onCancel: () => void;
  onSubmit: (values: MachineScriptFormValues) => Promise<void>;
};

const MachineScriptFormModal: React.FC<Props> = ({
  open,
  saving,
  initialValues,
  editingId,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm<MachineScriptFormValues>();

  useEffect(() => {
    if (!open) {
      return;
    }
    form.setFieldsValue({
      name: initialValues?.name || '',
      description: initialValues?.description,
      content: initialValues?.content || '',
      status: initialValues?.status || 'active',
      metadata_text: initialValues?.metadata_text || '',
      tags: initialValues?.tags || [],
    });
  }, [form, initialValues, open]);

  return (
    <Modal
      title={editingId ? `Edit Script #${editingId}` : 'New Machine Script'}
      open={open}
      width={960}
      destroyOnHidden
      confirmLoading={saving}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(values);
      }}
    >
      <Form<MachineScriptFormValues> form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter script name.' }]}
        >
          <Input placeholder="install-agent" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input placeholder="Describe what this script does" />
        </Form.Item>
        <Form.Item name="status" label="Status">
          <Select
            options={[
              { label: 'active', value: 'active' },
              { label: 'disabled', value: 'disabled' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="content"
          label="Script Content"
          rules={[{ required: true, message: 'Please enter script content.' }]}
        >
          <TextArea
            rows={14}
            placeholder="#!/usr/bin/env bash"
            style={{ fontFamily: 'Consolas, Menlo, monospace' }}
          />
        </Form.Item>
        <AssetTagEditor name="tags" />
        <Form.Item name="metadata_text" label="Metadata JSON">
          <TextArea rows={6} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default MachineScriptFormModal;
