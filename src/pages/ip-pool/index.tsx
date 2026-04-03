import type {
  ActionType,
  ProColumns,
  ProDescriptionsItemProps,
} from '@ant-design/pro-components';
import {
  FooterToolbar,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, Drawer, Modal, message, Space, Tag } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  deleteIpPool,
  disableIpPool,
  enableIpPool,
  fetchIpPool,
  getIpPoolDetail,
  getIpPoolStats,
  ipPoolBatchImport,
} from '@/services/infra/api';
import BatchImportModal from './components/BatchImportModal';
import IpPoolFormModal from './components/IpPoolFormModal';
import ResetScoreModal from './components/ResetScoreModal';
import StatsPanel from './components/StatsPanel';

const formatTimestamp = (timestamp?: number) => {
  if (!timestamp) {
    return '-';
  }
  return new Date(timestamp * 1000).toLocaleString();
};

const getRiskTag = (value?: number) => {
  const risk = Number(value || 0);
  if (risk >= 70) {
    return <Tag color="error">高风险 {risk}</Tag>;
  }
  if (risk >= 30) {
    return <Tag color="warning">中风险 {risk}</Tag>;
  }
  return <Tag color="success">低风险 {risk}</Tag>;
};

const IpPoolPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [selectedRows, setSelectedRows] = useState<API.IpPoolItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [batchImportOpen, setBatchImportOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.IpPoolItem>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<API.IpPoolItem>();
  const [messageApi, contextHolder] = message.useMessage();
  const {
    data: statsData,
    loading: statsLoading,
    run: refreshStats,
  } = useRequest(getIpPoolStats, {
    onSuccess: (_res) => {
      actionRef.current?.reloadAndRest?.();
    },
  });

  const detailColumns = useMemo<ProColumns<API.IpPoolItem>[]>(
    () => [
      { title: 'ID', dataIndex: 'id' },
      { title: 'IP', dataIndex: 'ip' },
      { title: '主机名', dataIndex: 'hostname' },
      { title: '城市', dataIndex: 'city' },
      { title: '地区', dataIndex: 'region' },
      { title: '国家', dataIndex: 'country' },
      { title: '坐标', dataIndex: 'loc' },
      { title: '组织/ISP', dataIndex: 'org' },
      { title: '邮编', dataIndex: 'postal' },
      { title: '时区', dataIndex: 'timezone' },
      { title: '信息链接', dataIndex: 'readme_url' },
      { title: '评分', dataIndex: 'score' },
      {
        title: '负载',
        render: (_, record) => `${record.load || 0}/${record.max_load || 0}`,
      },
      {
        title: '成功率',
        render: (_, record) => `${record.success_rate || 0}%`,
      },
      { title: '状态', dataIndex: 'status' },
      { title: '风险值', render: (_, record) => getRiskTag(record.risk_level) },
      { title: '总请求数', dataIndex: 'total_requests' },
      { title: '成功请求数', dataIndex: 'successful_requests' },
      {
        title: '最后使用',
        render: (_, record) => formatTimestamp(record.last_used_at),
      },
      {
        title: '创建时间',
        render: (_, record) => formatTimestamp(record.created_at),
      },
      {
        title: '更新时间',
        render: (_, record) => formatTimestamp(record.updated_at),
      },
    ],
    [],
  );

  const columns: ProColumns<API.IpPoolItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      copyable: true,
      render: (_, record) => (
        <a
          onClick={async () => {
            const res = await getIpPoolDetail({ id: record.id });
            if (res.code !== 0) {
              messageApi.error(res.msg || '获取详情失败');
              return;
            }
            setDetailRow(res.data);
            setDetailOpen(true);
          }}
        >
          {record.ip}
        </a>
      ),
    },
    {
      title: 'IP 搜索',
      dataIndex: 'search_ip',
      hideInTable: true,
    },
    {
      title: '国家',
      dataIndex: 'country',
      width: 90,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        active: { text: 'active', status: 'Success' },
        cooldown: { text: 'cooldown', status: 'Default' },
      },
    },
    {
      title: '评分',
      dataIndex: 'score',
      width: 90,
      sorter: true,
      search: false,
    },
    {
      title: '负载',
      dataIndex: 'load',
      width: 110,
      sorter: true,
      search: false,
      render: (_, record) => `${record.load || 0}/${record.max_load || 0}`,
    },
    {
      title: '成功率',
      dataIndex: 'success_rate',
      width: 100,
      search: false,
      render: (_, record) => `${record.success_rate || 0}%`,
    },
    {
      title: '最小成功率',
      dataIndex: 'min_success_rate',
      hideInTable: true,
    },
    {
      title: '风险等级',
      dataIndex: 'risk_level',
      width: 120,
      valueType: 'select',
      valueEnum: {
        low: { text: '低风险' },
        medium: { text: '中风险' },
        high: { text: '高风险' },
      },
      render: (_, record) => getRiskTag(record.risk_level),
      search: {
        transform: (value) => ({ risk_level: value }),
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      sorter: true,
      search: false,
      render: (_, record) => formatTimestamp(record.created_at),
    },
    {
      title: '最后使用',
      dataIndex: 'last_used_at',
      width: 170,
      search: false,
      render: (_, record) => formatTimestamp(record.last_used_at),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 260,
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            setCurrentRow(record);
            setFormOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="toggle"
          onClick={async () => {
            const res =
              record.status === 'active'
                ? await disableIpPool({ id: record.id })
                : await enableIpPool({ id: record.id });
            if (res.code !== 0) {
              messageApi.error(res.msg || '状态更新失败');
              return;
            }
            messageApi.success('状态已更新');
            actionRef.current?.reload();
            refreshStats();
          }}
        >
          {record.status === 'active' ? '禁用' : '启用'}
        </a>,
        <a
          key="score"
          onClick={() => {
            setCurrentRow(record);
            setScoreOpen(true);
          }}
        >
          重置评分
        </a>,
        <a
          key="delete"
          onClick={() => {
            Modal.confirm({
              title: `确认删除 IP ${record.ip} ?`,
              onOk: async () => {
                const res = await deleteIpPool({ ids: [record.id] });
                if (res.code !== 0) {
                  messageApi.error(res.msg || '删除失败');
                  return;
                }
                messageApi.success('删除成功');
                actionRef.current?.reload();
                refreshStats();
              },
            });
          }}
        >
          删除
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <StatsPanel stats={statsData} loading={statsLoading} />
      <ProTable<API.IpPoolItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params, sort) => {
          const sortableFields: Array<'created_at' | 'score' | 'load'> = [
            'created_at',
            'score',
            'load',
          ];
          const sortField = sortableFields.find((field) => sort?.[field]);
          const sortOrder = sortField
            ? sort[sortField] === 'ascend'
              ? 'asc'
              : 'desc'
            : undefined;
          const res = await fetchIpPool({
            current: Number(params.current || 1),
            pageSize: Number(params.pageSize || 10),
            search_ip: params.search_ip as string | undefined,
            country: params.country as string | undefined,
            status: params.status as API.IpPoolStatus | undefined,
            risk_level: params.risk_level as
              | 'high'
              | 'medium'
              | 'low'
              | undefined,
            min_success_rate: params.min_success_rate
              ? Number(params.min_success_rate)
              : undefined,
            sort_by: sortField,
            sort_order: sortOrder,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '列表获取失败');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
          return {
            data: res.data?.data || [],
            success: true,
            total: res.data?.total || 0,
          };
        }}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            onClick={() => {
              setCurrentRow(undefined);
              setFormOpen(true);
            }}
          >
            新增 IP
          </Button>,
          <Button
            key="batch-import"
            type="primary"
            onClick={() => setBatchImportOpen(true)}
          >
            批量导入
          </Button>,
          <Button key="stats" onClick={() => refreshStats()}>
            刷新统计
          </Button>,
        ]}
        rowSelection={{
          onChange: (_, rows) => {
            setSelectedRows(rows);
          },
        }}
      />
      {selectedRows.length > 0 && (
        <FooterToolbar
          extra={
            <Space>
              已选择
              <a style={{ fontWeight: 600 }}>{selectedRows.length}</a>项
            </Space>
          }
        >
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: '确认批量删除选中的 IP？',
                onOk: async () => {
                  const ids = selectedRows.map((item) => item.id);
                  const res = await deleteIpPool({ ids });
                  if (res.code !== 0) {
                    messageApi.error(res.msg || '批量删除失败');
                    return;
                  }
                  messageApi.success('批量删除成功');
                  setSelectedRows([]);
                  actionRef.current?.reloadAndRest?.();
                  refreshStats();
                },
              });
            }}
          >
            批量删除
          </Button>
        </FooterToolbar>
      )}
      <IpPoolFormModal
        open={formOpen}
        current={currentRow}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setCurrentRow(undefined);
          }
        }}
        onSuccess={() => {
          actionRef.current?.reload();
          refreshStats();
        }}
      />
      <ResetScoreModal
        open={scoreOpen}
        current={currentRow}
        onOpenChange={(open) => {
          setScoreOpen(open);
          if (!open) {
            setCurrentRow(undefined);
          }
        }}
        onSuccess={() => {
          actionRef.current?.reload();
          refreshStats();
        }}
      />
      <Drawer
        width={700}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailRow(undefined);
        }}
      >
        {detailRow?.id && (
          <ProDescriptions<API.IpPoolItem>
            title={`IP 详情 - ${detailRow.ip}`}
            column={2}
            request={async () => ({
              data: detailRow,
            })}
            params={{ id: detailRow.id }}
            columns={
              detailColumns as ProDescriptionsItemProps<API.IpPoolItem>[]
            }
          />
        )}
      </Drawer>
      <BatchImportModal
        open={batchImportOpen}
        onClose={() => setBatchImportOpen(false)}
        onSuccess={() => {
          setBatchImportOpen(false);
          actionRef.current?.reload();
          refreshStats();
        }}
      />{' '}
    </PageContainer>
  );
};

export default IpPoolPage;
