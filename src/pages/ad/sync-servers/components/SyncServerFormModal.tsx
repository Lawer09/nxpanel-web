import {
  App,
  Form,
  Input,
  Modal,
  Select,
} from 'antd';
import React from 'react';
import { createSyncServer } from '@/services/ad/api';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SyncServerFormModal: React.FC<Props> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const res = await createSyncServer({
        ...values,
        tags: values.tags,
      });
      if (res.code !== 0) {
        messageApi.error(res.msg || '创建失败');
        return;
      }
      messageApi.success('创建成功');
      form.resetFields();
      onSuccess();
    } catch {
      // validation
    }
  };

  return (
    <Modal
      title="新建同步节点"
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="server_id"
          label="节点 ID"
          rules={[{ required: true, message: '请输入节点 ID' }]}
        >
          <Input placeholder="如 sync-node-01" />
        </Form.Item>
        <Form.Item
          name="server_name"
          label="节点名称"
          rules={[{ required: true, message: '请输入节点名称' }]}
        >
          <Input placeholder="如 Singapore Worker" />
        </Form.Item>
        <Form.Item name="host_ip" label="主机 IP">
          <Input placeholder="如 1.2.3.4" />
        </Form.Item>
        <Form.Item name="tags" label="标签">
          <Select mode="tags" placeholder="输入后回车添加" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SyncServerFormModal;
