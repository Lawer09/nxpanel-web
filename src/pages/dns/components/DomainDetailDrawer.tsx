import { Button, Drawer, Empty, List, Space, Tag, Typography } from 'antd';
import React from 'react';
import { formatUTC8 } from '@/utils/format';
import { bindingStatusTag, parseTags, syncStatusTag } from '../helpers';

interface DomainDetailDrawerProps {
  open: boolean;
  loading: boolean;
  domain: API.DnsToolDomain | null;
  bindings: API.DnsToolIpBinding[];
  onClose: () => void;
  onUnbindBinding: (binding: API.DnsToolIpBinding) => void;
  onEditBindingMeta: (binding: API.DnsToolIpBinding) => void;
}

const DomainDetailDrawer: React.FC<DomainDetailDrawerProps> = ({
  open,
  loading,
  domain,
  bindings,
  onClose,
  onUnbindBinding,
  onEditBindingMeta,
}) => {
  return (
    <Drawer
      title="域名详情"
      placement="right"
      width={520}
      open={open}
      onClose={onClose}
      destroyOnHidden
    >
      {!domain ? (
        <Empty description="请选择域名" />
      ) : (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space direction="vertical" size={4}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {domain.domainName}
            </Typography.Title>
            <Space size={8} wrap>
              {syncStatusTag(domain.syncStatus)}
              <Tag color={domain.isAvailable === 1 ? 'success' : 'error'}>
                {domain.isAvailable === 1 ? '可用' : '不可用'}
              </Tag>
              <Tag color="blue">绑定 IP {Number(domain.bindingIpCount || 0)}</Tag>
            </Space>
            <Typography.Text type="secondary">
              平台 {domain.providerCode || '-'} / 账号{' '}
              {domain.providerAccountName || domain.providerAccountId || '-'}
            </Typography.Text>
            <Typography.Text type="secondary">
              更新时间 {formatUTC8(domain.updatedAt)}
            </Typography.Text>
          </Space>

          <div>
            <Typography.Text strong>标签</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Space size={[4, 4]} wrap>
                {parseTags(domain.tags).map((tag) => (
                  <Tag key={`domain-tag-${domain.id}-${tag}`}>{tag}</Tag>
                ))}
              </Space>
            </div>
          </div>

          <div>
            <Typography.Text strong>绑定 IP 列表</Typography.Text>
            <List<API.DnsToolIpBinding>
              loading={loading}
              style={{ marginTop: 8 }}
              locale={{ emptyText: '暂无绑定 IP' }}
              dataSource={bindings}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      key={`edit-${item.id}`}
                      type="link"
                      size="small"
                      onClick={() => onEditBindingMeta(item)}
                    >
                      编辑
                    </Button>,
                    <Button
                      key={`unbind-${item.id}`}
                      type="link"
                      danger
                      size="small"
                      disabled={item.status !== 'active'}
                      onClick={() => onUnbindBinding(item)}
                    >
                      解绑
                    </Button>,
                  ]}
                >
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Space size={8} wrap>
                      <Typography.Text code>{item.fqdn}</Typography.Text>
                      <Typography.Text copyable={{ text: item.ipv4 }}>{item.ipv4}</Typography.Text>
                    </Space>
                    <Space size={8} wrap>
                      {bindingStatusTag(item.status)}
                      <Typography.Text type="secondary">
                        Provider 账号 {item.providerAccountName || item.providerAccountId || '-'}
                      </Typography.Text>
                    </Space>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        </Space>
      )}
    </Drawer>
  );
};

export default DomainDetailDrawer;
