import { PlayCircleOutlined } from '@ant-design/icons';
import type { ActionType } from '@ant-design/pro-components';
import { ProList } from '@ant-design/pro-components';
import { Button, Input, Select, Space, Tag, Typography } from 'antd';
import React from 'react';
import { getDnsDomains } from '@/services/dns-tool/api';
import { formatUTC8 } from '@/utils/format';
import { availableTag, parsePagePayload, parseTags, syncStatusTag } from '../helpers';

interface OptionItem {
  label: string;
  value: string | number;
}

export interface DomainQuery {
  keyword?: string;
  providerCode?: string;
  providerAccountId?: number;
  syncStatus?: API.DnsSyncStatus;
  isAvailable?: 0 | 1;
}

interface DomainListPanelProps {
  actionRef: React.MutableRefObject<ActionType | undefined>;
  query: DomainQuery;
  onQueryChange: (next: DomainQuery) => void;
  providerOptions: OptionItem[];
  providerAccountOptions: OptionItem[];
  selectedId?: number;
  onSelectDomain: (domain: API.DnsToolDomain) => void;
  onOpenResolve: (preset: { domain?: string }) => void;
  onEditMeta: (domain: API.DnsToolDomain) => void;
  onRequestError: (message: string) => void;
}

const DomainListPanel: React.FC<DomainListPanelProps> = ({
  actionRef,
  query,
  onQueryChange,
  providerOptions,
  providerAccountOptions,
  selectedId,
  onSelectDomain,
  onOpenResolve,
  onEditMeta,
  onRequestError,
}) => {
  return (
    <Space direction="vertical" size={14} style={{ width: '100%' }}>
      <Space wrap size={12}>
        <Input
          placeholder="关键词：域名 / tags / note"
          value={query.keyword}
          onChange={(e) => onQueryChange({ ...query, keyword: e.target.value || undefined })}
          style={{ width: 260 }}
        />
        <Select
          allowClear
          placeholder="平台"
          value={query.providerCode}
          options={providerOptions}
          style={{ width: 180 }}
          onChange={(value) => onQueryChange({ ...query, providerCode: value as string | undefined })}
        />
        <Select
          allowClear
          placeholder="平台账号"
          value={query.providerAccountId}
          options={providerAccountOptions}
          style={{ width: 220 }}
          onChange={(value) =>
            onQueryChange({ ...query, providerAccountId: value as number | undefined })
          }
        />
        <Select
          allowClear
          placeholder="同步状态"
          value={query.syncStatus}
          options={[
            { label: 'active', value: 'active' },
            { label: 'disabled', value: 'disabled' },
            { label: 'missing', value: 'missing' },
          ]}
          style={{ width: 140 }}
          onChange={(value) =>
            onQueryChange({ ...query, syncStatus: value as API.DnsSyncStatus | undefined })
          }
        />
        <Select
          allowClear
          placeholder="可用状态"
          value={query.isAvailable}
          options={[
            { label: '可用', value: 1 },
            { label: '不可用', value: 0 },
          ]}
          style={{ width: 140 }}
          onChange={(value) => onQueryChange({ ...query, isAvailable: value as 0 | 1 | undefined })}
        />
        <Button type="primary" onClick={() => actionRef.current?.reload()}>
          查询
        </Button>
        <Button
          onClick={() => {
            onQueryChange({});
            actionRef.current?.reloadAndRest?.();
          }}
        >
          重置
        </Button>
      </Space>

      <ProList<API.DnsToolDomain>
        rowKey="id"
        actionRef={actionRef}
        headerTitle={false}
        search={false}
        toolBarRender={false}
        metas={{
          title: {
            dataIndex: 'domainName',
            render: (_, entity) => (
              <Space size={8} wrap>
                <Typography.Text copyable={{ text: entity.domainName }}>{entity.domainName}</Typography.Text>
                {entity.id === selectedId ? <Tag color="processing">已选中</Tag> : null}
              </Space>
            ),
          },
          subTitle: {
            render: (_, entity) => (
              <Space size={8} wrap>
                {syncStatusTag(entity.syncStatus)}
                {availableTag(entity.isAvailable)}
                <Tag color="blue">绑定 IP {Number(entity.bindingIpCount || 0)}</Tag>
              </Space>
            ),
          },
          description: {
            render: (_, entity) => (
              <Space split={<Typography.Text type="secondary">|</Typography.Text>} wrap>
                <Typography.Text>平台 {entity.providerCode || '-'}</Typography.Text>
                <Typography.Text>
                  账号 {entity.accountName || entity.providerAccountId || '-'}
                </Typography.Text>
                <Typography.Text type="secondary">更新时间 {formatUTC8(entity.updatedAt)}</Typography.Text>
              </Space>
            ),
          },
          actions: {
            render: (_, entity) => [
              <Button key="edit" type="link" size="small" onClick={() => onEditMeta(entity)}>
                编辑
              </Button>,
              <Button
                key="resolve"
                type="link"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onOpenResolve({ domain: entity.domainName })}
              >
                解析
              </Button>,
            ],
          },
          content: {
            render: (_, entity) => (
              <div>
                <Space size={[4, 4]} wrap>
                  {parseTags(entity.tags).map((tag) => (
                    <Tag key={`${entity.id}-content-${tag}`}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            ),
          },
        }}
        split
        onItem={(record) => ({
          onClick: () => onSelectDomain(record),
          className: record.id === selectedId ? 'dns-pro-list-item-active' : undefined,
        })}
        request={async (params) => {
          const res = await getDnsDomains({
            ...query,
            page: Number(params.current || 1),
            pageSize: Number(params.pageSize || 10),
          });
          if (res.code !== 0) {
            onRequestError(res.msg || '域名数据加载失败');
            return { data: [], total: 0, success: false };
          }
          const page = parsePagePayload<API.DnsToolDomain>(
            res.data,
            Number(params.current || 1),
            Number(params.pageSize || 10),
          );
          return { data: page.list, total: page.total, success: true };
        }}
        pagination={{ showSizeChanger: true, defaultPageSize: 10 }}
      />
    </Space>
  );
};

export default DomainListPanel;
