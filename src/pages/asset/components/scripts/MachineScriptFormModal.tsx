import { Form, Input, Modal, Select } from 'antd';
import React, { useEffect } from 'react';
import type { MachineScriptFormValues } from '../../types';
import AssetTagEditor from '../AssetTagEditor';

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
      title={editingId ? `编辑脚本 #${editingId}` : '新建机器脚本'}
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
          label="名称"
          rules={[{ required: true, message: '请输入脚本名称。' }]}
        >
          <Input placeholder="install-agent" />
        </Form.Item>
        <Form.Item name="description" label="说明">
          <Input placeholder="简要说明脚本用途" />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            options={[
              { label: '启用', value: 'active' },
              { label: '停用', value: 'disabled' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="content"
          label="脚本内容"
          rules={[{ required: true, message: '请输入脚本内容。' }]}
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
