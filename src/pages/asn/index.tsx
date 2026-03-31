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
import { Button, Drawer, Modal, message } from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  deleteAsn,
  fetchAsn,
  getAsnDetail,
  getAsnProviders,
  getAsnStats,
} from '@/services/swagger/asn';
import AsnFormModal from './components/AsnFormModal';
import StatsPanel from './components/StatsPanel';

const AsnPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [selectedRows, setSelectedRows] = useState<API.AsnItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.AsnItem>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<API.AsnItem>();
  const [messageApi, contextHolder] = message.useMessage();

  const {
    data: statsData,
    loading: statsLoading,
    run: refreshStats,
  } = useRequest(getAsnStats);

  const detailColumns = useMemo<ProColumns<API.AsnItem>[]>(
    () => [
      { title: 'ID', dataIndex: 'id' },
      { title: 'ASN', dataIndex: 'asn' },
      { title: '名称', dataIndex: 'name' },
      { title: '描述', dataIndex: 'description' },
      { title: '国家', dataIndex: 'country' },
      { title: '类型', dataIndex: 'type' },
      {
        title: '数据中心',
        render: (_, record) => (record.is_datacenter ? '是' : '否'),
      },
      { title: '可靠性', dataIndex: 'reliability' },
      { title: '声誉', dataIndex: 'reputation' },
      {
        title: 'metadata',
        render: (_, record) =>
          record.metadata ? JSON.stringify(record.metadata) : '-',
      },
      {
        title: '关联 Provider',
        render: (_, record) => {
          if (!record.providers?.length) {
            return '无';
          }
          return record.providers
            .map(
              (provider) =>
                `${provider.name}${provider.asn_id ? `(${provider.asn_id})` : ''}`,
            )
            .join('，');
        },
      },
    ],
    [],
  );

  const columns: ProColumns<API.AsnItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: 'ASN',
      dataIndex: 'asn',
      render: (_, record) => (
        <a
          onClick={async () => {
            const [detailRes, providerRes] = await Promise.all([
              getAsnDetail({ id: record.id }),
              getAsnProviders({ asn_id: record.id, current: 1, pageSize: 100 }),
            ]);
            if (detailRes.code !== 0) {
              messageApi.error(detailRes.msg || '获取详情失败');
              return;
            }
            if (providerRes.code !== 0) {
              messageApi.error(providerRes.msg || '获取关联 Provider 失败');
              return;
            }
            setDetailRow({
              ...detailRes.data,
              providers: providerRes.data?.data || [],
            });
            setDetailOpen(true);
          }}
        >
          {record.asn}
        </a>
      ),
    },
    {
      title: '搜索',
      dataIndex: 'search',
      hideInTable: true,
    },
    {
      title: '名称',
      dataIndex: 'name',
      search: false,
    },
    {
      title: '国家',
      dataIndex: 'country',
    },
    {
      title: '类型',
      dataIndex: 'type',
      valueEnum: {
        ISP: { text: 'ISP' },
        CDN: { text: 'CDN' },
        企业: { text: '企业' },
      },
    },
    {
      title: '数据中心',
      dataIndex: 'is_datacenter',
      valueType: 'select',
      valueEnum: {
        true: { text: '是' },
        false: { text: '否' },
      },
      render: (_, record) => (record.is_datacenter ? '是' : '否'),
    },
    {
      title: '最小可靠性',
      dataIndex: 'min_reliability',
      hideInTable: true,
      valueType: 'digit',
    },
    {
      title: '可靠性',
      dataIndex: 'reliability',
      search: false,
    },
    {
      title: '声誉',
      dataIndex: 'reputation',
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
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
          key="delete"
          onClick={() => {
            Modal.confirm({
              title: `确认删除 ASN ${record.asn} ?`,
              content: '删除后关联的 Provider 将失去 ASN 关联(asn_id 将被置空)',
              onOk: async () => {
                const res = await deleteAsn({ ids: [record.id] });
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
      <StatsPanel stats={statsData?.data} loading={statsLoading} />
      <ProTable<API.AsnItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await fetchAsn({
            current: Number(params.current || 1),
            pageSize: Number(params.pageSize || 10),
            search: params.search as string | undefined,
            country: params.country as string | undefined,
            type: params.type as string | undefined,
            is_datacenter:
              params.is_datacenter === true || params.is_datacenter === 'true'
                ? true
                : params.is_datacenter === false ||
                    params.is_datacenter === 'false'
                  ? false
                  : undefined,
            min_reliability: params.min_reliability
              ? Number(params.min_reliability)
              : undefined,
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
            新增 ASN
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
            <div>
              已选择 <a style={{ fontWeight: 600 }}>{selectedRows.length}</a> 项
            </div>
          }
        >
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: `确认删除选中的 ${selectedRows.length} 条 ASN 记录？`,
                content:
                  '删除后关联的 Provider 将失去 ASN 关联(asn_id 将被置空)',
                onOk: async () => {
                  const ids = selectedRows.map((item) => item.id);
                  const res = await deleteAsn({ ids });
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
      <AsnFormModal
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
      <Drawer
        width={700}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailRow(undefined);
        }}
      >
        {detailRow?.id && (
          <ProDescriptions<API.AsnItem>
            title={`ASN 详情 - ${detailRow.asn}`}
            column={2}
            request={async () => ({
              data: detailRow,
            })}
            params={{ id: detailRow.id }}
            columns={detailColumns as ProDescriptionsItemProps<API.AsnItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default AsnPage;
