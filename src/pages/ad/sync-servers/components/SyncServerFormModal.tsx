import {
  App,
  Form,
  Input,
  Modal,
  Select,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { createSyncServer, updateSyncServer } from '@/services/ad/api';

interface Props {
  open: boolean;
  current?: API.SyncServer;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SyncServerFormModal: React.FC<Props> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [confirmLoading, setConfirmLoading] = useState(false);
  const isEdit = !!current;

  useEffect(() => {
    if (open) {
      if (current) {
        form.setFieldsValue({
          serverId: current.serverId,
          serverName: current.serverName,
          hostIp: current.hostIp,
          secretKey: current.secretKey,
          tags: current.tags,
          status: current.status,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, current]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      const res = isEdit
        ? await updateSyncServer(current!.serverId, values)
        : await createSyncServer(values);
      setConfirmLoading(false);
      if (res.code !== 0) {
        messageApi.error(res.msg || (isEdit ? '更新失败' : '创建失败'));
        return;
      }
      messageApi.success(isEdit ? '更新成功' : '创建成功');
      form.resetFields();
      onSuccess();
    } catch {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑同步节点' : '新建同步节点'}
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      confirmLoading={confirmLoading}
      width={520}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="serverId"
          label="节点 ID"
          rules={[{ required: true, message: '请输入节点 ID' }]}
        >
          <Input placeholder="如 sync-node-01" disabled={isEdit} />
        </Form.Item>
        <Form.Item
          name="serverName"
          label="节点名称"
          rules={[{ required: true, message: '请输入节点名称' }]}
        >
          <Input placeholder="如 Singapore Worker" />
        </Form.Item>
        <Form.Item name="hostIp" label="主机 IP">
          <Input placeholder="如 1.2.3.4" />
        </Form.Item>
        <Form.Item name="secretKey" label="Secret Key">
          <Input.Password placeholder="节点通信密钥" />
        </Form.Item>
        <Form.Item name="tags" label="标签">
          <Select mode="tags" placeholder="输入后回车添加" />
        </Form.Item>
        {isEdit && (
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { label: '在线', value: 'online' },
                { label: '离线', value: 'offline' },
                { label: '维护中', value: 'maintenance' },
              ]}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default SyncServerFormModal;
