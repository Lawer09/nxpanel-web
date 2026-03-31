import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Col, Divider, Form, Row } from 'antd';
import React, { useEffect } from 'react';
import {
  saveDeployTemplate,
  updateDeployTemplate,
} from '@/services/swagger/deployTemplate';

const NODE_TYPE_OPTIONS = [
  { label: 'VLESS', value: 'vless' },
  { label: 'VMess', value: 'vmess' },
  { label: 'Trojan', value: 'trojan' },
  { label: 'Shadowsocks', value: 'shadowsocks' },
  { label: 'Hysteria', value: 'hysteria' },
  { label: 'Hysteria2', value: 'hysteria2' },
  { label: 'TUIC', value: 'tuic' },
  { label: 'AnyTLS', value: 'anytls' },
];

const CORE_TYPE_OPTIONS = [
  { label: 'Xray', value: 1 },
  { label: 'Sing-box', value: 2 },
  { label: 'Mihomo', value: 3 },
];

const TLS_OPTIONS = [
  { label: '无 TLS', value: 0 },
  { label: 'TLS', value: 1 },
  { label: 'XTLS', value: 2 },
];

const CERT_MODE_OPTIONS = [
  { label: '无 (none)', value: 'none' },
  { label: "HTTP (Let's Encrypt)", value: 'http' },
  { label: 'DNS', value: 'dns' },
  { label: '自签名 (self)', value: 'self' },
];

interface TemplateFormModalProps {
  open: boolean;
  current?: API.DeployTemplate;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TemplateFormModal: React.FC<TemplateFormModalProps> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (current) {
        form.setFieldsValue({
          ...current,
          network_settings: current.network_settings
            ? JSON.stringify(current.network_settings, null, 2)
            : '',
          extra: current.extra ? JSON.stringify(current.extra, null, 2) : '',
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, current]);

  const parseJSON = (val?: string): Record<string, any> | undefined => {
    if (!val?.trim()) return undefined;
    try {
      return JSON.parse(val);
    } catch {
      return undefined;
    }
  };

  return (
    <ModalForm
      title={current ? `编辑模板 — ${current.name}` : '新建部署模板'}
      open={open}
      form={form}
      width={700}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        const ns = parseJSON(values.network_settings);
        const extra = parseJSON(values.extra);
        if (values.network_settings?.trim() && !ns) {
          messageApi.error('network_settings JSON 格式错误');
          return false;
        }
        if (values.extra?.trim() && !extra) {
          messageApi.error('extra JSON 格式错误');
          return false;
        }

        const payload = {
          name: values.name,
          node_type: values.node_type,
          description: values.description,
          core_type: values.core_type ?? undefined,
          tls: values.tls ?? undefined,
          cert_mode: values.cert_mode,
          cert_domain: values.cert_domain,
          network: values.network,
          network_settings: ns ?? undefined,
          group_ids: values.group_ids,
          route_ids: values.route_ids,
          is_default: values.is_default ?? false,
          extra: extra ?? undefined,
        };

        let res: API.ApiResponse<API.DeployTemplate>;
        if (current) {
          res = await updateDeployTemplate({ id: current.id, ...payload });
        } else {
          res = await saveDeployTemplate(payload);
        }

        if (res.code !== 0) {
          messageApi.error(res.msg || '保存失败');
          return false;
        }
        messageApi.success(current ? '模板已更新' : '模板已创建');
        onSuccess();
        return true;
      }}
    >
      <Row gutter={16}>
        <Col span={14}>
          <ProFormText
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          />
        </Col>
        <Col span={10}>
          <ProFormSelect
            name="node_type"
            label="节点类型"
            rules={[{ required: true, message: '请选择节点类型' }]}
            options={NODE_TYPE_OPTIONS}
          />
        </Col>
      </Row>

      <ProFormText name="description" label="描述备注" />

      <Divider orientation="left" style={{ fontSize: 13 }}>
        核心 & TLS
      </Divider>

      <Row gutter={16}>
        <Col span={8}>
          <ProFormSelect
            name="core_type"
            label="核心类型"
            options={CORE_TYPE_OPTIONS}
            fieldProps={{ allowClear: true }}
          />
        </Col>
        <Col span={8}>
          <ProFormSelect
            name="tls"
            label="TLS 模式"
            options={TLS_OPTIONS}
            fieldProps={{ allowClear: true }}
          />
        </Col>
        <Col span={8}>
          <ProFormSelect
            name="cert_mode"
            label="证书模式"
            options={CERT_MODE_OPTIONS}
            fieldProps={{ allowClear: true }}
          />
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <ProFormText name="cert_domain" label="证书域名" />
        </Col>
        <Col span={12}>
          <ProFormText
            name="network"
            label="传输协议 (network)"
            placeholder="如 ws / grpc / tcp"
          />
        </Col>
      </Row>

      <Divider orientation="left" style={{ fontSize: 13 }}>
        高级配置
      </Divider>

      <ProFormTextArea
        name="network_settings"
        label="传输层配置 (JSON)"
        fieldProps={{
          rows: 4,
          style: { fontFamily: 'monospace', fontSize: 12 },
        }}
        placeholder='{"path": "/ws", "host": "example.com"}'
      />

      <ProFormTextArea
        name="extra"
        label="额外自定义字段 (JSON)"
        fieldProps={{
          rows: 3,
          style: { fontFamily: 'monospace', fontSize: 12 },
        }}
        placeholder='{"key": "value"}'
      />

      <ProFormSwitch
        name="is_default"
        label="设为默认模板"
        tooltip="设置后将自动取消旧的默认模板"
      />
    </ModalForm>
  );
};

export default TemplateFormModal;
