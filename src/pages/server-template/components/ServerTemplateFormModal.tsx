import {
  ModalForm,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { App, Col, Divider, Row } from 'antd';
import React from 'react';
import { protocolOptions } from '@/pages/server/components/constants';
import ProtocolSettingsFields from '@/pages/server/components/ProtocolSettingsFields';
import {
  saveServerTemplate,
  updateServerTemplate,
} from '@/services/swagger/serverTemplate';

interface ServerTemplateFormModalProps {
  open: boolean;
  current?: API.ServerTemplate;
  groupOptions: { label: string; value: number }[];
  routeOptions: { label: string; value: number }[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const getInitialValues = (tpl?: API.ServerTemplate) => {
  if (!tpl) {
    return {
      type: 'vless',
      rate: 1,
      show: false,
      is_default: false,
      rate_time_enable: false,
      rate_time_ranges: [],
      group_ids: [],
      route_ids: [],
      tags: [],
      excludes: [],
      ips: [],
      protocol_settings: {},
    };
  }
  return {
    ...tpl,
    port: tpl.port != null ? String(tpl.port) : '',
    parent_id: tpl.parent_id ?? undefined,
    code: tpl.code ?? undefined,
    group_ids: tpl.group_ids ?? [],
    route_ids: tpl.route_ids ?? [],
    tags: tpl.tags ?? [],
    excludes: tpl.excludes ?? [],
    ips: tpl.ips ?? [],
    rate_time_enable: Boolean(tpl.rate_time_enable),
    rate_time_ranges: tpl.rate_time_ranges ?? [],
    protocol_settings: tpl.protocol_settings ?? {},
  };
};

const compactValue = (value: any): any => {
  if (Array.isArray(value)) {
    const list = value
      .map((item) => compactValue(item))
      .filter((item) => item !== undefined && item !== null && item !== '');
    return list.length ? list : undefined;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([key, val]) => [key, compactValue(val)] as const)
      .filter(([, val]) => val !== undefined && val !== null && val !== '');
    if (!entries.length) return undefined;
    return Object.fromEntries(entries);
  }
  return value;
};

const ServerTemplateFormModal: React.FC<ServerTemplateFormModalProps> = ({
  open,
  current,
  groupOptions,
  routeOptions,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();

  return (
    <ModalForm
      title={current ? `编辑节点模板 — ${current.name}` : '新建节点模板'}
      open={open}
      initialValues={getInitialValues(current)}
      width={760}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        const compactProtocol = compactValue(values.protocol_settings);
        const payload: API.ServerTemplateSaveParams = {
          name: values.name,
          type: values.type,
          description: values.description,
          is_default: values.is_default ?? false,
          host: values.host || undefined,
          port: values.port || undefined,
          server_port: values.server_port || undefined,
          rate: values.rate ?? 1,
          show: values.show,
          code: values.code || undefined,
          spectific_key: values.spectific_key || undefined,
          group_ids: values.group_ids ?? [],
          route_ids: values.route_ids ?? [],
          tags: values.tags ?? [],
          excludes: values.excludes ?? [],
          ips: values.ips ?? [],
          parent_id: values.parent_id || undefined,
          rate_time_enable: values.rate_time_enable,
          rate_time_ranges: (values.rate_time_ranges ?? []).map((r: any) => ({
            start: String(r.start || ''),
            end: String(r.end || ''),
            rate: Number(r.rate || 0),
          })),
          protocol_settings: compactProtocol,
        };

        let res: API.ApiResponse<API.ServerTemplate>;
        if (current) {
          res = await updateServerTemplate({ id: current.id, ...payload });
        } else {
          res = await saveServerTemplate(payload);
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
      {/* ── 基本信息 ─────────────────────────── */}
      <Divider orientation="left" style={{ fontSize: 13, marginTop: 0 }}>
        基本信息
      </Divider>
      <Row gutter={16}>
        <Col span={14}>
          <ProFormText
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
            placeholder="如 VLESS-Reality 生产模板"
          />
        </Col>
        <Col span={10}>
          <ProFormSelect
            name="type"
            label="协议类型"
            options={protocolOptions}
            rules={[{ required: true, message: '请选择协议类型' }]}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={16}>
          <ProFormText name="description" label="描述备注" placeholder="可选" />
        </Col>
        <Col span={4}>
          <ProFormSwitch name="is_default" label="设为默认" />
        </Col>
        <Col span={4}>
          <ProFormSwitch name="show" label="展示给用户" />
        </Col>
      </Row>

      {/* ── 节点地址 ─────────────────────────── */}
      <Divider orientation="left" style={{ fontSize: 13 }}>
        节点地址（可选）
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <ProFormText
            name="host"
            label="节点域名 / IP"
            placeholder="留空则模板不指定"
          />
        </Col>
        <Col span={6}>
          <ProFormText name="port" label="客户端端口" placeholder="如 443" />
        </Col>
        <Col span={6}>
          <ProFormDigit
            name="server_port"
            label="服务端端口"
            min={1}
            max={65535}
            placeholder="如 443"
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <ProFormDigit
            name="rate"
            label="基础倍率"
            min={0}
            fieldProps={{ step: 0.1 }}
          />
        </Col>
        <Col span={8}>
          <ProFormText name="code" label="节点标识码" placeholder="可选" />
        </Col>
        <Col span={8}>
          <ProFormDigit name="parent_id" label="父节点 ID" min={1} />
        </Col>
      </Row>
      <ProFormText
        name="spectific_key"
        label="特定密钥 (spectific_key)"
        placeholder="可选"
      />

      {/* ── 分配与标签 ───────────────────────── */}
      <Divider orientation="left" style={{ fontSize: 13 }}>
        分配与标签
      </Divider>
      <Row gutter={16}>
        <Col span={12}>
          <ProFormSelect
            name="group_ids"
            label="用户组"
            mode="multiple"
            options={groupOptions}
            fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
          />
        </Col>
        <Col span={12}>
          <ProFormSelect
            name="route_ids"
            label="路由规则"
            mode="multiple"
            options={routeOptions}
            fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
          />
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <ProFormSelect
            name="tags"
            label="标签"
            mode="tags"
            fieldProps={{ tokenSeparators: [','] }}
          />
        </Col>
        <Col span={8}>
          <ProFormSelect
            name="excludes"
            label="排除项"
            mode="tags"
            fieldProps={{ tokenSeparators: [','] }}
          />
        </Col>
        <Col span={8}>
          <ProFormSelect
            name="ips"
            label="IP 列表"
            mode="tags"
            fieldProps={{ tokenSeparators: [','] }}
          />
        </Col>
      </Row>

      {/* ── 动态倍率 ─────────────────────────── */}
      <ProFormSwitch name="rate_time_enable" label="启用分时倍率" />
      <ProFormDependency name={['rate_time_enable']}>
        {({ rate_time_enable }) =>
          rate_time_enable ? (
            <ProFormList
              name="rate_time_ranges"
              label="分时倍率规则"
              creatorButtonProps={{ creatorButtonText: '添加时间段' }}
              itemContainerRender={(doms) => <>{doms}</>}
            >
              <ProFormText
                name="start"
                label="开始"
                placeholder="00:00"
                rules={[
                  { required: true, message: '请输入开始时间' },
                  {
                    pattern: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
                    message: 'HH:mm 格式',
                  },
                ]}
              />
              <ProFormText
                name="end"
                label="结束"
                placeholder="08:00"
                rules={[
                  { required: true, message: '请输入结束时间' },
                  {
                    pattern: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
                    message: 'HH:mm 格式',
                  },
                ]}
              />
              <ProFormDigit
                name="rate"
                label="倍率"
                min={0}
                fieldProps={{ step: 0.1 }}
                rules={[{ required: true, message: '请输入倍率' }]}
              />
            </ProFormList>
          ) : null
        }
      </ProFormDependency>

      {/* ── 协议设置 ─────────────────────────── */}
      <Divider orientation="left" style={{ fontSize: 13 }}>
        协议设置（可选）
      </Divider>
      <ProtocolSettingsFields />
    </ModalForm>
  );
};

export default ServerTemplateFormModal;
