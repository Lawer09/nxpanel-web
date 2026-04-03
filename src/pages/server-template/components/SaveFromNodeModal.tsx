import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { App, Form, Select, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { getServerNodes } from '@/services/server/api';
import { saveServerTemplateFromNode } from '@/services/server/api';

const { Text } = Typography;

const PROTOCOL_COLOR: Record<string, string> = {
  vless: 'blue',
  vmess: 'purple',
  trojan: 'orange',
  shadowsocks: 'red',
  hysteria: 'magenta',
  tuic: 'volcano',
  anytls: 'gold',
  socks: 'cyan',
  naive: 'lime',
  http: 'geekblue',
  mieru: 'green',
};

interface SaveFromNodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const SaveFromNodeModal: React.FC<SaveFromNodeModalProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();
  const [nodes, setNodes] = useState<API.ServerNode[]>([]);
  const [nodesLoading, setNodesLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<
    API.ServerNode | undefined
  >();

  useEffect(() => {
    if (open) {
      form.resetFields();
      setSelectedNode(undefined);
      setNodesLoading(true);
      getServerNodes().then((res) => {
        setNodesLoading(false);
        setNodes((res as any)?.data ?? []);
      });
    }
  }, [open]);

  const handleNodeChange = (id: number) => {
    const node = nodes.find((n) => n.id === id);
    setSelectedNode(node);
    if (node) {
      form.setFieldValue('name', `${node.name} 模板`);
    }
  };

  return (
    <ModalForm
      title="从节点保存为模板"
      open={open}
      form={form}
      width={500}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        if (!values.server_id) {
          messageApi.error('请选择节点');
          return false;
        }
        const res = await saveServerTemplateFromNode({
          server_id: values.server_id,
          name: values.name,
          description: values.description,
        });
        if (res.code !== 0) {
          messageApi.error(res.msg || '保存失败');
          return false;
        }
        messageApi.success('已从节点保存为模板');
        onSuccess();
        return true;
      }}
    >
      <Form.Item
        name="server_id"
        label="选择节点"
        rules={[{ required: true, message: '请选择节点' }]}
      >
        <Select
          showSearch
          loading={nodesLoading}
          placeholder="搜索节点名称 / 地址"
          optionFilterProp="label"
          onChange={handleNodeChange}
          options={nodes.map((n) => ({
            label: `${n.name}  ${n.host ?? ''}`,
            value: n.id,
            node: n,
          }))}
          optionRender={(opt) => {
            const n = (opt.data as any).node as API.ServerNode;
            return (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag
                  color={PROTOCOL_COLOR[n.type] ?? 'default'}
                  style={{ fontSize: 11, margin: 0 }}
                >
                  {n.type}
                </Tag>
                <span>{n.name}</span>
                {n.host && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {n.host}
                  </Text>
                )}
              </span>
            );
          }}
        />
      </Form.Item>

      <ProFormText
        name="name"
        label="模板名称"
        rules={[{ required: true, message: '请输入模板名称' }]}
        placeholder="如 VLESS-Reality模板"
      />

      <ProFormText name="description" label="描述备注" placeholder="可选" />

      {selectedNode && (
        <div
          style={{
            background: '#fafafa',
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            padding: '8px 12px',
            fontSize: 12,
            color: '#666',
            marginTop: -8,
          }}
        >
          将自动读取节点「{selectedNode.name}」（{selectedNode.host}
          ）的全部配置保存为模板。
        </div>
      )}
    </ModalForm>
  );
};

export default SaveFromNodeModal;
