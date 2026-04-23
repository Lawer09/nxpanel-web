import {
  App,
  Form,
  Input,
  Modal,
  Select,
  Space,
} from 'antd';
import React, { useEffect } from 'react';
import {
  createAdAccount,
  updateAdAccount,
} from '@/services/ad/api';

const { TextArea } = Input;

interface Props {
  open: boolean;
  current?: API.AdAccount;
  syncServers: API.SyncServer[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const AdAccountFormModal: React.FC<Props> = ({
  open,
  current,
  syncServers,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const isEdit = !!current;

  useEffect(() => {
    if (open) {
      if (current) {
        form.setFieldsValue({
          source_platform: current.source_platform,
          account_name: current.account_name,
          account_label: current.account_label,
          auth_type: current.auth_type,
          credentials_json: '',
          status: current.status,
          tags: current.tags,
          assigned_server_id: current.assigned_server_id || undefined,
          backup_server_id: current.backup_server_id || undefined,
          isolation_group: current.isolation_group,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ status: 'enabled', auth_type: 'oauth' });
      }
    }
  }, [open, current]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      // parse credentials_json
      let credentials: Record<string, any> = {};
      if (values.credentials_json) {
        try {
          credentials = JSON.parse(values.credentials_json);
        } catch {
          messageApi.error('凭据 JSON 格式不正确');
          return;
        }
      }
      const payload: API.AdAccountUpsertRequest = {
        ...values,
        credentials_json: credentials,
      };
      const res = isEdit
        ? await updateAdAccount(current!.id, payload)
        : await createAdAccount(payload);
      if (res.code !== 0) {
        messageApi.error(res.msg || (isEdit ? '更新失败' : '创建失败'));
        return;
      }
      messageApi.success(isEdit ? '更新成功' : '创建成功');
      onSuccess();
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑广告账号' : '新建广告账号'}
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      width={640}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item
            name="source_platform"
            label="平台"
            rules={[{ required: true, message: '请选择平台' }]}
            style={{ flex: 1 }}
          >
            <Select
              placeholder="选择平台"
              options={[
                { label: 'AdMob', value: 'admob' },
                { label: 'Meta', value: 'meta' },
                { label: 'Unity', value: 'unity' },
                { label: 'AppLovin', value: 'applovin' },
                { label: 'ironSource', value: 'ironsource' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="account_name"
            label="账号名"
            rules={[{ required: true, message: '请输入账号名' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="如 accounts/pub-1234567890" />
          </Form.Item>
        </Space>

        <Form.Item name="account_label" label="显示名 / 标签">
          <Input placeholder="可选，便于识别" />
        </Form.Item>

        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item
            name="auth_type"
            label="认证方式"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select
              options={[
                { label: 'OAuth', value: 'oauth' },
                { label: 'Service Account', value: 'service_account' },
                { label: 'API Key', value: 'api_key' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true }]}
            style={{ flex: 1 }}
          >
            <Select
              options={[
                { label: '启用', value: 'enabled' },
                { label: '停用', value: 'disabled' },
              ]}
            />
          </Form.Item>
        </Space>

        <Form.Item
          name="credentials_json"
          label="凭据 JSON"
          rules={[{ required: !isEdit, message: '请输入凭据' }]}
          extra={isEdit ? '留空则不更新凭据' : undefined}
        >
          <TextArea rows={4} placeholder='{"client_id":"...","client_secret":"..."}' />
        </Form.Item>

        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item name="assigned_server_id" label="主节点" style={{ flex: 1 }}>
            <Select
              allowClear
              placeholder="选择主节点"
              options={syncServers.map((s) => ({
                label: `${s.server_name} (${s.server_id})`,
                value: s.server_id,
              }))}
            />
          </Form.Item>
          <Form.Item name="backup_server_id" label="备节点" style={{ flex: 1 }}>
            <Select
              allowClear
              placeholder="选择备节点"
              options={syncServers.map((s) => ({
                label: `${s.server_name} (${s.server_id})`,
                value: s.server_id,
              }))}
            />
          </Form.Item>
        </Space>

        <Form.Item name="isolation_group" label="隔离组">
          <Input placeholder="可选" />
        </Form.Item>

        <Form.Item name="tags" label="标签">
          <Select mode="tags" placeholder="输入后回车添加" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AdAccountFormModal;
