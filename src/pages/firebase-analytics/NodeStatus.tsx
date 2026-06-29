import React, { useMemo, useRef, useState } from 'react';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, Card, Segmented, Space, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { history, useSearchParams } from '@umijs/max';
import { FilterBar } from '@/components/FirebaseAnalytics';
import type { FirebaseFilterField } from '@/components/FirebaseAnalytics/FilterBar';
import { getNodeStatusList } from '@/services/firebase-analytics/api';
import type {
  FirebaseAnalyticsFilterFormValues,
  NodeDiagnosisStatus,
  NodeSampleScope,
  NodeStatusListItem,
} from '@/services/firebase-analytics/types';
import {
  formatBytes,
  formatDateTimeShort,
  formatDuration,
  formatNodeLabel,
  formatPercentPointGap,
  formatRate,
  getNodeDiagnosisMeta,
  NODE_STATUS_QUICK_FILTERS,
  toRequestOrder,
} from '@/utils/firebase-analytics';
import {
  buildFirebaseSearchParams,
  getInitialFirebaseFilters,
} from '@/utils/firebase-analytics-filters';

type NodeStatusFilterValues = FirebaseAnalyticsFilterFormValues & {
  node_id?: string;
  node_name?: string;
  node_country?: string;
  node_region?: string;
  protocol?: string;
  diagnosis_status?: NodeDiagnosisStatus;
  sample_scope?: NodeSampleScope;
};

const FILTER_FIELDS: FirebaseFilterField[] = [
  'timeRange',
  'time_field',
  'app_id',
  'platform',
  'app_version',
  'user_country',
  'network_type',
  'isp',
  'node_id',
  'node_name',
  'node_country',
  'node_region',
  'protocol',
];

const buildInitialFilters = (searchParams: URLSearchParams): NodeStatusFilterValues => ({
  ...getInitialFirebaseFilters(searchParams),
  node_id: searchParams.get('node_id') || undefined,
  node_name: searchParams.get('node_name') || undefined,
  node_country: searchParams.get('node_country') || undefined,
  node_region: searchParams.get('node_region') || undefined,
  protocol: searchParams.get('protocol') || undefined,
  diagnosis_status: (searchParams.get('diagnosis_status') as NodeDiagnosisStatus | null) || undefined,
  sample_scope: (searchParams.get('sample_scope') as NodeSampleScope | null) || undefined,
});

const resolveQuickViewKey = (filters: NodeStatusFilterValues) => {
  const matched = NODE_STATUS_QUICK_FILTERS.find((item) => {
    if (!item.diagnosis_status && !item.sample_scope) {
      return !filters.diagnosis_status && (!filters.sample_scope || filters.sample_scope === 'all');
    }
    return (
      item.diagnosis_status === filters.diagnosis_status &&
      (item.sample_scope || 'all') === (filters.sample_scope || 'all')
    );
  });

  return matched?.key || 'all';
};

const buildSearchState = (filters: NodeStatusFilterValues, quickViewKey: string) => {
  const base = new URLSearchParams(
    buildFirebaseSearchParams(filters as FirebaseAnalyticsFilterFormValues) as Record<string, string>,
  );

  ['node_id', 'node_name', 'node_country', 'node_region', 'protocol', 'diagnosis_status', 'sample_scope'].forEach(
    (key) => {
      const value = filters[key as keyof NodeStatusFilterValues];
      if (value) {
        base.set(key, String(value));
      }
    },
  );

  if (quickViewKey && quickViewKey !== 'all') {
    base.set('quick_view', quickViewKey);
  }

  return Object.fromEntries(base.entries());
};

const buildDetailHref = (
  record: NodeStatusListItem,
  filters: NodeStatusFilterValues,
  quickViewKey: string,
) => {
  const returnSearch = new URLSearchParams(buildSearchState(filters, quickViewKey)).toString();
  const search = new URLSearchParams(buildSearchState(filters, quickViewKey));

  search.set('node_id', record.node_id || '');
  if (record.node_name) search.set('node_name', record.node_name);
  if (record.node_country) search.set('node_country', record.node_country);
  if (record.node_region) search.set('node_region', record.node_region);
  if (record.protocol) search.set('protocol', record.protocol);
  search.set('diagnosis_status', record.diagnosis_status);
  if (record.sample_scope) {
    search.set('sample_scope', record.sample_scope);
  }
  search.set('return_search', returnSearch);

  return `/firebase-analytics/node-status/detail?${search.toString()}`;
};

const NodeStatusPage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<NodeStatusFilterValues>(() => buildInitialFilters(searchParams));
  const [quickViewKey, setQuickViewKey] = useState(
    () => searchParams.get('quick_view') || resolveQuickViewKey(buildInitialFilters(searchParams)),
  );

  const columns = useMemo<ProColumns<NodeStatusListItem>[]>(
    () => [
      {
        title: '节点名称',
        dataIndex: 'node_name',
        key: 'node_name',
        width: 220,
        render: (_value, record) => {
          const label = formatNodeLabel(record);
          return (
            <Space direction="vertical" size={2}>
              <Button
                type="link"
                style={{ padding: 0, height: 'auto', fontWeight: 600 }}
                onClick={() => history.push(buildDetailHref(record, filters, quickViewKey))}
              >
                {label.title}
              </Button>
              <Typography.Text type="secondary">{label.meta || '-'}</Typography.Text>
            </Space>
          );
        },
      },
      {
        title: '国家/地区',
        key: 'node_geo',
        width: 150,
        render: (_value, record) => `${record.node_country || '-'} / ${record.node_region || '-'}`,
      },
      {
        title: '协议',
        dataIndex: 'protocol',
        key: 'protocol',
        width: 120,
      },
      {
        title: '问题类型',
        dataIndex: 'diagnosis_status',
        key: 'diagnosis_priority',
        width: 170,
        sorter: true,
        render: (_dom, record) => {
          const meta = getNodeDiagnosisMeta(record.diagnosis_status);
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: '探测成功率',
        dataIndex: 'probe_success_rate',
        key: 'probe_success_rate',
        width: 120,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatRate(record.probe_success_rate),
      },
      {
        title: '连接成功率',
        dataIndex: 'session_success_rate',
        key: 'session_success_rate',
        width: 120,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatRate(record.session_success_rate),
      },
      {
        title: '成功率差值',
        dataIndex: 'rate_gap',
        key: 'rate_gap',
        width: 120,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatPercentPointGap(record.rate_gap),
      },
      {
        title: '探测样本',
        dataIndex: 'probe_test_count',
        key: 'probe_test_count',
        width: 100,
        align: 'right',
        sorter: true,
      },
      {
        title: '连接样本',
        dataIndex: 'session_count',
        key: 'session_count',
        width: 100,
        align: 'right',
        sorter: true,
      },
      {
        title: 'P95 探测延迟',
        dataIndex: 'p95_latency_ms',
        key: 'p95_latency_ms',
        width: 120,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatDuration(record.p95_latency_ms),
      },
      {
        title: 'P95 连接耗时',
        dataIndex: 'p95_connect_ms',
        key: 'p95_connect_ms',
        width: 120,
        align: 'right',
        sorter: true,
        render: (_dom, record) => formatDuration(record.p95_connect_ms),
      },
      {
        title: '最近探测',
        dataIndex: 'last_probe_received_at',
        key: 'last_probe_received_at',
        width: 120,
        sorter: true,
        render: (_dom, record) => formatDateTimeShort(record.last_probe_received_at),
      },
      {
        title: '连接侧错误',
        dataIndex: 'session_top_error_code',
        key: 'session_top_error_code',
        width: 160,
        ellipsis: true,
      },
      {
        title: '探测侧错误',
        dataIndex: 'probe_top_error_code',
        key: 'probe_top_error_code',
        width: 160,
        ellipsis: true,
      },
      {
        title: '总流量',
        dataIndex: 'total_bytes',
        key: 'total_bytes',
        width: 120,
        align: 'right',
        render: (_dom, record) => formatBytes(record.total_bytes),
      },
      {
        title: '详情',
        key: 'action',
        width: 100,
        fixed: 'right',
        render: (_value, record) => (
          <Button type="link" onClick={() => history.push(buildDetailHref(record, filters, quickViewKey))}>
            查看
          </Button>
        ),
      },
    ],
    [filters, quickViewKey],
  );

  const handleFilterChange = (nextValues: FirebaseAnalyticsFilterFormValues) => {
    const nextFilters: NodeStatusFilterValues = {
      ...filters,
      ...nextValues,
    };
    const nextQuickView = resolveQuickViewKey(nextFilters);
    setFilters(nextFilters);
    setQuickViewKey(nextQuickView);
    setSearchParams(buildSearchState(nextFilters, nextQuickView));
  };

  const handleQuickViewChange = (value: string | number) => {
    const key = String(value);
    const quickView = NODE_STATUS_QUICK_FILTERS.find((item) => item.key === key);
    const nextFilters: NodeStatusFilterValues = { ...filters };

    if (key === 'all') {
      delete nextFilters.diagnosis_status;
      delete nextFilters.sample_scope;
    } else {
      nextFilters.diagnosis_status = quickView?.diagnosis_status;
      if (quickView?.sample_scope) {
        nextFilters.sample_scope = quickView.sample_scope;
      } else {
        delete nextFilters.sample_scope;
      }
    }

    setFilters(nextFilters);
    setQuickViewKey(key);
    setSearchParams(buildSearchState(nextFilters, key));
  };

  return (
    <PageContainer
      title="节点状态"
      extra={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={() => actionRef.current?.reload()}>
          刷新
        </Button>,
      ]}
    >
      <FilterBar fields={FILTER_FIELDS} initialValues={filters} onFilterChange={handleFilterChange} />

      <Card
        style={{ marginBottom: 16, borderRadius: 12, border: '1px solid #e5e7eb' }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Segmented
            block
            value={quickViewKey}
            options={NODE_STATUS_QUICK_FILTERS.map((item) => ({
              label: item.label,
              value: item.key,
            }))}
            onChange={handleQuickViewChange}
          />
          <Typography.Text type="secondary">
            列表优先用于定位探测和真实连接存在明显偏差、仅有探测样本、或缺少探测覆盖的节点。点击节点名称后可继续查看该节点的国家成功率、连接/探测趋势和错误占比。
          </Typography.Text>
        </Space>
      </Card>

      <ProTable<NodeStatusListItem>
        rowKey={(record) => `${record.node_id}_${record.protocol || ''}_${record.node_country || ''}`}
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1900 }}
        columns={columns}
        params={{ filterKey: JSON.stringify(filters), quickViewKey }}
        request={async (params, sort) => {
          try {
            const firstSort = Object.entries(sort || {}).find(([, value]) => value);
            const sortBy = firstSort?.[0] as NodeStatusListItem extends never
              ? never
              : 'diagnosis_priority' | 'rate_gap' | 'probe_success_rate' | 'session_success_rate' | 'probe_test_count' | 'session_count' | 'p95_latency_ms' | 'p95_connect_ms' | 'last_probe_received_at' | 'last_session_received_at' | undefined;
            const order = toRequestOrder(firstSort?.[1]);

            const response = await getNodeStatusList({
              ...filters,
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 20),
              sort_by: sortBy || 'diagnosis_priority',
              order: order || 'asc',
            });

            return {
              data: response.data?.items || [],
              total: response.data?.total || 0,
              success: true,
            };
          } catch (error: any) {
            message.error(error?.message || '节点状态列表加载失败');
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
        toolBarRender={false}
      />
    </PageContainer>
  );
};

export default NodeStatusPage;
