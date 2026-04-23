import {
  App,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
} from 'antd';
import React, { useEffect, useState } from 'react';
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
  const authType = Form.useWatch('auth_type', form);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (current) {
        const oauth = current.credentials_json?.oauth;
        form.setFieldsValue({
          source_platform: current.source_platform,
          account_name: current.account_name,
          account_label: current.account_label,
          auth_type: current.auth_type,
          credentials_json: current.auth_type !== 'oauth' && current.credentials_json
            ? JSON.stringify(current.credentials_json, null, 2)
            : '',
          oauth_client_id: oauth?.client_id || '',
          oauth_client_secret: oauth?.client_secret || '',
          oauth_refresh_token: oauth?.refresh_token || '',
          oauth_token_url: oauth?.token_url || '',
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
      setConfirmLoading(true);
      // build credentials_json
      let credentials: Record<string, any> | null = null;
      if (authType === 'oauth') {
        const rt = values.oauth_refresh_token;
        const cid = values.oauth_client_id;
        const cs = values.oauth_client_secret;
        const hasAll = rt && cid && cs;
        const hasAny = rt || cid || cs;
        if (hasAny && !hasAll) {
          messageApi.warning('Client ID、Client Secret、Refresh Token 需同时填写，否则不会更新凭据');
          credentials = null;
        } else if (hasAll) {
          const oauthData: Record<string, any> = {
            refresh_token: rt,
            client_id: cid,
            client_secret: cs,
          };
          if (values.oauth_token_url) {
            oauthData.token_url = values.oauth_token_url;
          }
          credentials = { oauth: oauthData };
        }
      } else if (values.credentials_json) {
        try {
          credentials = JSON.parse(values.credentials_json);
        } catch {
          messageApi.error('凭据 JSON 格式不正确');
          return;
        }
      }
      const {
        oauth_refresh_token,
        oauth_client_id,
        oauth_client_secret,
        oauth_token_url,
        credentials_json,
        ...rest
      } = values;
      const payload: API.AdAccountUpsertRequest = {
        ...rest,
        credentials_json: credentials as any,
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
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑广告账号' : '新建广告账号'}
      open={open}
      onCancel={() => onOpenChange(false)}
      onOk={handleOk}
      confirmLoading={confirmLoading}
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

        <Form.Item name="account_label" label="名称">
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
          rules={[{ required: !isEdit && authType !== 'oauth', message: '请输入凭据' }]}
          extra={isEdit ? '留空则不更新凭据' : undefined}
          hidden={authType === 'oauth'}
        >
          <TextArea rows={4} placeholder='{"client_id":"...","client_secret":"..."}' />
        </Form.Item>

        {authType === 'oauth' && (
          <Card
            size="small"
            title="OAuth 凭据"
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="oauth_refresh_token"
              label="Refresh Token"
              rules={[{ required: !isEdit, message: '请输入 Refresh Token' }]}
            >
              <Input.Password placeholder="Refresh Token" visibilityToggle />
            </Form.Item>
            <Space size="middle" style={{ display: 'flex' }}>
              <Form.Item
                name="oauth_client_id"
                label="Client ID"
                rules={[{ required: !isEdit, message: '请输入 Client ID' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Client ID" />
              </Form.Item>
              <Form.Item
                name="oauth_client_secret"
                label="Client Secret"
                rules={[{ required: !isEdit, message: '请输入 Client Secret' }]}
                style={{ flex: 1 }}
              >
                <Input.Password placeholder="Client Secret" visibilityToggle />
              </Form.Item>
            </Space>
            <Form.Item
              name="oauth_token_url"
              label="Token URL"
              initialValue="https://oauth2.googleapis.com/token"
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="https://oauth2.googleapis.com/token" />
            </Form.Item>
          </Card>
        )}

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
