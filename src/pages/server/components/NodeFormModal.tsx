import React from 'react';
import {
  ProFormDependency,
  ModalForm,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { saveServerNode } from '@/services/swagger/server';
import ProtocolSettingsFields from './ProtocolSettingsFields';
import { protocolOptions, type SelectOption } from './constants';

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

const NodeFormModal: React.FC<NodeFormModalProps> = ({
  open,
  node,
  groupOptions,
  routeOptions,
  onOpenChange,
  onSuccess,
}) => {
  return (
    <ModalForm<NodeFormModalValues>
      title={node ? '编辑节点' : '新建节点'}
      open={open}
      initialValues={getInitialValues(node)}
      modalProps={{
        destroyOnHidden: true,
      }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        try {
          const compactProtocolSettings = compactValue(values.protocol_settings);
          const payload: API.ServerNodeSaveParams = {
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
          await saveServerNode(payload);
          message.success(node ? '节点已更新' : '节点已创建');
          onSuccess();
          return true;
        } catch (error: any) {
          message.error(error?.message || '节点保存失败');
          return false;
        }
      }}
    >
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
