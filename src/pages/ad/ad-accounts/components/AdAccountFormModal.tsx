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
  const authType = Form.useWatch('authType', form);
  const [confirmLoading, setConfirmLoading] = useState(false);

  useEffect(() => {
    if (open) {
      if (current) {
        const oauth = current.credentialsJson?.oauth;
            form.setFieldsValue({
              sourcePlatform: current.sourcePlatform,
              accountName: current.accountName,
              accountLabel: current.accountLabel,
              authType: current.authType,
              credentialsJson: current.authType !== 'oauth' && current.credentialsJson
                ? JSON.stringify(current.credentialsJson, null, 2)
                : '',
              oauthClientId: oauth?.clientId || oauth?.client_id || '',
              oauthClientSecret: oauth?.clientSecret || oauth?.client_secret || '',
              oauthRefreshToken: oauth?.refreshToken || oauth?.refresh_token || '',
              oauthTokenUrl: oauth?.tokenUrl || oauth?.token_url || 'https://oauth2.googleapis.com/token',
              status: current.status,
              tags: current.tags,
              assignedServerId: current.assignedServerId || undefined,
              backupServerId: current.backupServerId || undefined,
              isolationGroup: current.isolationGroup,
            });
      } else {
        form.resetFields();
        form.setFieldsValue({ status: 'enabled', authType: 'oauth' });
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
            const rt = values.oauthRefreshToken;
            const cid = values.oauthClientId;
            const cs = values.oauthClientSecret;
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
              if (values.oauthTokenUrl) {
                oauthData.token_url = values.oauthTokenUrl;
              }
          credentials = { oauth: oauthData };
        }
      } else if (values.credentialsJson) {
        try {
          credentials = JSON.parse(values.credentialsJson);
        } catch {
          messageApi.error('凭据 JSON 格式不正确');
          return;
        }
      }
      const {
        oauthRefreshToken,
        oauthClientId,
        oauthClientSecret,
        oauthTokenUrl,
        credentialsJson,
        ...rest
      } = values;
      const payload: API.AdAccountUpsertRequest = {
        ...rest,
        credentialsJson: credentials as any,
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
            name="sourcePlatform"
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
            name="accountName"
            label="账号名"
            rules={[{ required: true, message: '请输入账号名' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="如 accounts/pub-1234567890" />
          </Form.Item>
        </Space>

        <Form.Item name="accountLabel" label="名称">
          <Input placeholder="可选，便于识别" />
        </Form.Item>

        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item
            name="authType"
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
          name="credentialsJson"
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
              name="oauthRefreshToken"
              label="Refresh Token"
              rules={[{ required: !isEdit, message: '请输入 Refresh Token' }]}
            >
              <Input.Password placeholder="Refresh Token" visibilityToggle />
            </Form.Item>
            <Space size="middle" style={{ display: 'flex' }}>
              <Form.Item
                name="oauthClientId"
                label="Client ID"
                rules={[{ required: !isEdit, message: '请输入 Client ID' }]}
                style={{ flex: 1 }}
              >
                <Input placeholder="Client ID" />
              </Form.Item>
              <Form.Item
                name="oauthClientSecret"
                label="Client Secret"
                rules={[{ required: !isEdit, message: '请输入 Client Secret' }]}
                style={{ flex: 1 }}
              >
                <Input.Password placeholder="Client Secret" visibilityToggle />
              </Form.Item>
            </Space>
            <Form.Item
              name="oauthTokenUrl"
              label="Token URL"
              initialValue="https://oauth2.googleapis.com/token"
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="https://oauth2.googleapis.com/token" />
            </Form.Item>
          </Card>
        )}

        <Space size="middle" style={{ display: 'flex' }}>
          <Form.Item name="assignedServerId" label="主节点" style={{ flex: 1 }}>
            <Select
              allowClear
              placeholder="选择主节点"
              options={syncServers.map((s) => ({
                label: `${s.serverName} (${s.serverId})`,
                value: s.serverId,
              }))}
            />
          </Form.Item>
          <Form.Item name="backupServerId" label="备节点" style={{ flex: 1 }}>
            <Select
              allowClear
              placeholder="选择备节点"
              options={syncServers.map((s) => ({
                label: `${s.serverName} (${s.serverId})`,
                value: s.serverId,
              }))}
            />
          </Form.Item>
        </Space>

        <Form.Item name="isolationGroup" label="隔离组">
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
