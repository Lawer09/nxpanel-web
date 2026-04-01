import React, { useEffect, useRef, useState } from 'react';
import {
  ProFormDependency,
  ModalForm,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { Alert, Button, Col, Divider, Form, Row, Select, Space, Tag, Typography } from 'antd';
import { ThunderboltOutlined, SaveOutlined } from '@ant-design/icons';
import { getMachineList } from '@/services/swagger/machine';
import { fetchServerTemplates, getServerTemplateDetail } from '@/services/swagger/serverTemplate';
import { restartServerNode, saveServerNode } from '@/services/swagger/server';
import ProtocolSettingsFields from './ProtocolSettingsFields';
import { protocolOptions, type SelectOption } from './constants';

const { Text } = Typography;

type NodeFormModalValues = Partial<API.ServerNodeSaveParams> & {
  protocol_settings?: Record<string, any>;
};

type NodeFormModalProps = {
  open: boolean;
  node?: API.ServerNode;
  groupOptions: SelectOption[];
  routeOptions: SelectOption[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
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
    if (!entries.length) {
      return undefined;
    }
    return Object.fromEntries(entries);
  }
  return value;
};

const getInitialValues = (node?: API.ServerNode): NodeFormModalValues => {
  if (!node) {
    return {
      type: 'vless',
      rate: 1,
      show: true,
      rate_time_enable: false,
      rate_time_ranges: [],
      port: '',
      server_port: 443,
      group_ids: [],
      route_ids: [],
      tags: [],
      excludes: [],
      ips: [],
      protocol_settings: {},
    };
  }
  return {
    ...node,
    port: String(node.port || ''),
    parent_id: node.parent_id ?? undefined,
    code: node.code ?? undefined,
    group_ids: node.group_ids || [],
    route_ids: node.route_ids || [],
    rate_time_enable: Boolean(node.rate_time_enable),
    rate_time_ranges: node.rate_time_ranges || [],
    tags: node.tags || [],
    excludes: [],
    ips: [],
    protocol_settings: node.protocol_settings || {},
  };
};

// 协议颜色映射
const PROTOCOL_COLORS: Record<string, string> = {
  vless: 'blue', vmess: 'purple', trojan: 'red', shadowsocks: 'cyan',
  hysteria: 'orange', tuic: 'green', anytls: 'magenta', socks: 'default', naive: 'volcano',
};

const NodeFormModal: React.FC<NodeFormModalProps> = ({
  open,
  node,
  groupOptions,
  routeOptions,
  onOpenChange,
  onSuccess,
}) => {
  const [form] = Form.useForm<NodeFormModalValues>();
  const savedNodeIdRef = useRef<number | undefined>(undefined);

  // 机器列表
  const [machines, setMachines] = useState<API.Machine[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(false);
  // 模板列表
  const [templates, setTemplates] = useState<API.ServerTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  // 模板填充提示
  const [filledFrom, setFilledFrom] = useState<string | null>(null);

  // 打开时加载机器和模板
  useEffect(() => {
    if (!open) {
      setFilledFrom(null);
      savedNodeIdRef.current = undefined;
      return;
    }
    setMachinesLoading(true);
    getMachineList({ page: 1, pageSize: 200 })
      .then((res) => setMachines(res.data?.data || []))
      .finally(() => setMachinesLoading(false));

    setTemplatesLoading(true);
    fetchServerTemplates({ page: 1, page_size: 200 })
      .then((res) => setTemplates(res.data?.data || []))
      .finally(() => setTemplatesLoading(false));
  }, [open]);

  // 选择机器 → 填充 host
  const handleMachineSelect = (machineId: number) => {
    const m = machines.find((x) => x.id === machineId);
    if (!m) return;
    form.setFieldsValue({ host: m.ip_address });
    setFilledFrom(`已从机器「${m.name}」填充节点地址`);
  };

  // 选择模板 → 填充全部字段
  const handleTemplateSelect = async (templateId: number) => {
    const tpl = templates.find((x) => x.id === templateId);
    if (!tpl) return;
    // 如果没有 protocol_settings，拉取详情
    let detail = tpl;
    if (!detail.protocol_settings) {
      const res = await getServerTemplateDetail({ id: templateId });
      if (res.data) detail = res.data;
    }
    const patch: Partial<NodeFormModalValues> = {
      type: detail.type || undefined,
      port: detail.port !== null && detail.port !== undefined ? String(detail.port) : undefined,
      server_port: detail.server_port ?? undefined,
      rate: detail.rate ?? undefined,
      show: detail.show ?? undefined,
      code: detail.code ?? undefined,
      group_ids: detail.group_ids ?? undefined,
      route_ids: detail.route_ids ?? undefined,
      tags: detail.tags ?? undefined,
      excludes: detail.excludes ?? undefined,
      ips: detail.ips ?? undefined,
      parent_id: detail.parent_id ?? undefined,
      rate_time_enable: detail.rate_time_enable ?? undefined,
      rate_time_ranges: detail.rate_time_ranges ?? undefined,
      protocol_settings: detail.protocol_settings ?? undefined,
    };
    // host 仅在模板有值时填充
    if (detail.host) patch.host = detail.host;
    form.setFieldsValue(patch);
    setFilledFrom(`已从模板「${detail.name}」填充节点配置`);
  };

  // 构建提交 payload
  const buildPayload = (values: NodeFormModalValues): API.ServerNodeSaveParams => {
    const compactProtocolSettings = compactValue(values.protocol_settings);
    return {
      id: node?.id,
      type: String(values.type || ''),
      name: String(values.name || ''),
      host: String(values.host || ''),
      port: String(values.port || ''),
      server_port: Number(values.server_port || 0),
      rate: Number(values.rate || 1),
      rate_time_enable: Boolean(values.rate_time_enable),
      rate_time_ranges: (values.rate_time_ranges || []).map((item) => ({
        start: String(item.start || ''),
        end: String(item.end || ''),
        rate: Number(item.rate || 0),
      })),
      group_ids: values.group_ids || [],
      route_ids: values.route_ids || [],
      parent_id: values.parent_id,
      code: values.code,
      tags: values.tags || [],
      excludes: values.excludes || [],
      ips: values.ips || [],
      show: values.show,
      protocol_settings: compactProtocolSettings,
    };
  };

  return (
    <ModalForm<NodeFormModalValues>
      title={node ? '编辑节点' : '新建节点'}
      open={open}
      form={form}
      width={640}
      initialValues={getInitialValues(node)}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={onOpenChange}
      submitter={{
        render: (props) => (
          <Space>
            <Button onClick={() => onOpenChange(false)}>取消</Button>
            <Button
              icon={<ThunderboltOutlined />}
              onClick={async () => {
                try {
                  await form.validateFields();
                  const values = form.getFieldsValue(true) as NodeFormModalValues;
                  const payload = buildPayload(values);
                  const saveRes = await saveServerNode(payload);
                  const nodeId = (saveRes as any)?.data?.id ?? node?.id;
                  savedNodeIdRef.current = nodeId;
                  if (nodeId) {
                    await restartServerNode({ id: nodeId });
                  }
                  onSuccess();
                  onOpenChange(false);
                } catch (_e) {
                  // 验证失败时 validateFields 会自动提示
                }
              }}
            >
              保存并重启
            </Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={() => props.submit()}>
              保存
            </Button>
          </Space>
        ),
      }}
      onFinish={async (values) => {
        try {
          const payload = buildPayload(values);
          await saveServerNode(payload);
          onSuccess();
          return true;
        } catch (error: any) {
          return false;
        }
      }}
    >
      {/* ── 快速填充区 ─────────────────────────────────── */}
      {!node && (
        <>
          <Divider orientation="left" style={{ fontSize: 13, marginTop: 0 }}>
            快速填充
          </Divider>
          <Row gutter={16} style={{ marginBottom: 8 }}>
            <Col span={12}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  从机器填充地址
                </Text>
              </div>
              <Select
                placeholder="选择机器（自动填入节点地址）"
                loading={machinesLoading}
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
                onChange={handleMachineSelect}
                options={machines.map((m) => ({
                  label: `${m.name}（${m.ip_address}）`,
                  value: m.id,
                }))}
              />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  从节点模板填充配置
                </Text>
              </div>
              <Select
                placeholder="选择模板（自动填入全部配置）"
                loading={templatesLoading}
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
                onChange={handleTemplateSelect}
                optionRender={(opt) => {
                  const tpl = templates.find((t) => t.id === opt.value);
                  return (
                    <Space>
                      <Tag color={PROTOCOL_COLORS[tpl?.type ?? ''] ?? 'default'} style={{ fontSize: 11 }}>
                        {tpl?.type ?? ''}
                      </Tag>
                      {opt.label}
                    </Space>
                  );
                }}
                options={templates.map((t) => ({
                  label: t.name,
                  value: t.id,
                }))}
              />
            </Col>
          </Row>
          {filledFrom && (
            <Alert
              message={filledFrom}
              type="success"
              showIcon
              closable
              onClose={() => setFilledFrom(null)}
              style={{ marginBottom: 16 }}
            />
          )}
        </>
      )}

      {/* ── 节点基础信息 ───────────────────────────────── */}
      <Divider orientation="left" style={{ fontSize: 13, marginTop: node ? 0 : undefined }}>
        节点信息
      </Divider>
      <ProFormSelect
        name="type"
        label="协议类型"
        options={protocolOptions}
        rules={[{ required: true, message: '请选择协议类型' }]}
      />
      <ProFormText
        name="name"
        label="节点名称"
        rules={[{ required: true, message: '请输入节点名称' }]}
      />
      <ProFormText
        name="host"
        label="节点地址"
        rules={[{ required: true, message: '请输入节点地址' }]}
      />
      <ProFormText
        name="port"
        label="连接端口"
        rules={[{ required: true, message: '请输入连接端口' }]}
      />
      <ProFormDigit
        name="server_port"
        label="服务端口"
        min={1}
        max={65535}
        rules={[{ required: true, message: '请输入服务端口' }]}
      />
      <ProFormDigit
        name="rate"
        label="基础倍率"
        min={0}
        fieldProps={{ step: 0.1 }}
        rules={[{ required: true, message: '请输入基础倍率' }]}
      />
      <ProFormSwitch name="rate_time_enable" label="启用动态倍率" />
      <ProFormDependency name={['rate_time_enable']}>
        {({ rate_time_enable }) =>
          rate_time_enable ? (
            <ProFormList
              name="rate_time_ranges"
              label="动态倍率规则"
              creatorButtonProps={{ creatorButtonText: '添加时间段倍率' }}
              itemContainerRender={(doms) => <>{doms}</>}
            >
              <ProFormText
                name="start"
                label="开始时间"
                placeholder="08:00"
                rules={[
                  { required: true, message: '请输入开始时间' },
                  {
                    pattern: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
                    message: '时间格式应为 HH:mm',
                  },
                ]}
              />
              <ProFormText
                name="end"
                label="结束时间"
                placeholder="23:59"
                rules={[
                  { required: true, message: '请输入结束时间' },
                  {
                    pattern: /^(?:[01]\d|2[0-3]):[0-5]\d$/,
                    message: '时间格式应为 HH:mm',
                  },
                ]}
              />
              <ProFormDigit
                name="rate"
                label="时间段倍率"
                min={0}
                fieldProps={{ step: 0.1 }}
                rules={[{ required: true, message: '请输入时间段倍率' }]}
              />
            </ProFormList>
          ) : null
        }
      </ProFormDependency>
      <ProFormSwitch name="show" label="是否显示" />
      <ProFormDigit name="sort" label="排序值" min={0} />
      <ProFormDigit name="parent_id" label="父节点 ID" min={1} />
      <ProFormText name="code" label="自定义节点 ID" />
      <ProFormSelect
        name="group_ids"
        label="权限组"
        mode="multiple"
        options={groupOptions}
        fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
      />
      <ProFormSelect
        name="route_ids"
        label="路由组"
        mode="multiple"
        options={routeOptions}
        fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
      />
      <ProFormSelect
        name="tags"
        label="标签"
        mode="tags"
        fieldProps={{ tokenSeparators: [','] }}
      />
      <ProFormSelect
        name="excludes"
        label="排除项"
        mode="tags"
        fieldProps={{ tokenSeparators: [','] }}
      />
      <ProFormSelect
        name="ips"
        label="IP 列表"
        mode="tags"
        fieldProps={{ tokenSeparators: [','] }}
      />
      <ProtocolSettingsFields />
    </ModalForm>
  );
};

export default NodeFormModal;