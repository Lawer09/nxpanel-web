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
import { Button, Drawer, Modal, message, Select } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchAsn, unbindAsnProviders } from '@/services/infra/api';
import {
  deleteProvider,
  fetchProvider,
  getProviderDetail,
  getProviderStats,
  getProvidersByAsn,
  getUnboundProviders,
  updateProviderAsn,
  updateProviderStatus,
} from '@/services/provider/api';
import ProviderFormModal from './components/ProviderFormModal';
import StatsPanel from './components/StatsPanel';

const ProviderPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [selectedRows, setSelectedRows] = useState<API.ProviderItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.ProviderItem>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<API.ProviderItem>();
  const [batchBindAsnId, setBatchBindAsnId] = useState<number>();
  const [showUnboundOnly, setShowUnboundOnly] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const {
    data: statsData,
    loading: statsLoading,
    run: refreshStats,
  } = useRequest(getProviderStats);

  const {
    data: asnListData,
    loading: asnLoading,
    run: loadAsnList,
  } = useRequest(
    async (): Promise<API.AsnItem[]> => {
      const params: API.AsnFetchParams = {
        current: 1,
        pageSize: 1000,
      };
      const res = await fetchAsn(params);
      if (res.code === 0 && (res.data?.data?.length || 0) > 0) {
        return res.data?.data || [];
      }
      const postRes = await fetchAsn(params, { method: 'POST' });
      if (postRes.code === 0) {
        return postRes.data?.data || [];
      }
      return [];
    },
    {
      manual: true,
      formatResult: (res: any) => res,
    },
  );
  const asnList = (asnListData || []) as API.AsnItem[];

  useEffect(() => {
    loadAsnList();
  }, [loadAsnList]);

  useEffect(() => {
    if (formOpen && asnList.length === 0) {
      loadAsnList();
    }
  }, [formOpen, loadAsnList]);

  const asnOptions = useMemo(
    () =>
      asnList.map((item: API.AsnItem) => ({
        label: `${item.asn} - ${item.name}`,
        value: item.id,
        asn: item.asn,
      })),
    [asnList],
  );

  const detailColumns = useMemo<ProColumns<API.ProviderItem>[]>(
    () => [
      { title: 'ID', dataIndex: 'id' },
      { title: '名称', dataIndex: 'name' },
      { title: '描述', dataIndex: 'description' },
      { title: '官网', dataIndex: 'website' },
      { title: '邮箱', dataIndex: 'email' },
      { title: '电话', dataIndex: 'phone' },
      { title: '国家', dataIndex: 'country' },
      { title: '类型', dataIndex: 'type' },
      { title: 'ASN ID', dataIndex: 'asn_id' },
      {
        title: 'ASN',
        render: (_, record) =>
          typeof record.asn === 'string' ? record.asn : record.asn?.asn || '-',
      },
      {
        title: 'ASN 名称',
        render: (_, record) =>
          typeof record.asn === 'object' && record.asn
            ? record.asn.name || '-'
            : '-',
      },
      { title: '可靠性', dataIndex: 'reliability' },
      { title: '声誉', dataIndex: 'reputation' },
      { title: '速度等级', dataIndex: 'speed_level' },
      { title: '稳定性', dataIndex: 'stability' },
      {
        title: '活跃',
        render: (_, record) => (record.is_active ? '是' : '否'),
      },
      {
        title: 'regions',
        render: (_, record) =>
          record.regions ? JSON.stringify(record.regions) : '-',
      },
      {
        title: 'services',
        render: (_, record) =>
          record.services ? JSON.stringify(record.services) : '-',
      },
      {
        title: 'metadata',
        render: (_, record) =>
          record.metadata ? JSON.stringify(record.metadata) : '-',
      },
    ],
    [],
  );

  const columns: ProColumns<API.ProviderItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '名称',
      dataIndex: 'name',
      render: (_, record) => (
        <a
          onClick={async () => {
            const res = await getProviderDetail({ id: record.id });
            if (res.code !== 0) {
              messageApi.error(res.msg || '获取详情失败');
              return;
            }
            setDetailRow(res.data);
            setDetailOpen(true);
          }}
        >
          {record.name}
        </a>
      ),
    },
    {
      title: '搜索',
      dataIndex: 'search',
      hideInTable: true,
    },
    {
      title: '国家',
      dataIndex: 'country',
    },
    {
      title: '类型',
      dataIndex: 'type',
    },
    {
      title: 'ASN',
      dataIndex: 'asn',
      render: (_, record) =>
        typeof record.asn === 'string' ? record.asn : record.asn?.asn || '-',
      search: false,
    },
    {
      title: 'ASN 过滤',
      dataIndex: 'asn_id',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: asnOptions,
        showSearch: true,
        optionFilterProp: 'label',
      },
    },
    {
      title: '活跃',
      dataIndex: 'is_active',
      valueType: 'select',
      valueEnum: {
        true: { text: '是', status: 'Success' },
        false: { text: '否', status: 'Default' },
      },
      render: (_, record) => (record.is_active ? '是' : '否'),
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
      title: '速度',
      dataIndex: 'speed_level',
      search: false,
    },
    {
      title: '稳定性',
      dataIndex: 'stability',
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="edit"
          onClick={async () => {
            const res = await getProviderDetail({ id: record.id });
            if (res.code !== 0) {
              messageApi.error(res.msg || '获取详情失败');
              return;
            }
            setCurrentRow(res.data);
            setFormOpen(true);
          }}
        >
          编辑
        </a>,
        <a
          key="delete"
          onClick={() => {
            Modal.confirm({
              title: `确认删除 Provider ${record.name} ?`,
              onOk: async () => {
                const res = await deleteProvider({ ids: [record.id] });
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

  const updateStatusBySelection = async (isActive: boolean) => {
    if (!selectedRows.length) {
      messageApi.warning('请先选择 Provider');
      return;
    }
    const ids = selectedRows.map((item) => item.id);
    const res = await updateProviderStatus({ ids, is_active: isActive });
    if (res.code !== 0) {
      messageApi.error(res.msg || '批量更新状态失败');
      return;
    }
    messageApi.success('批量状态更新成功');
    setSelectedRows([]);
    actionRef.current?.reloadAndRest?.();
    refreshStats();
  };

  const bindAsnBySelection = async () => {
    if (!selectedRows.length) {
      messageApi.warning('请先选择 Provider');
      return;
    }
    if (!batchBindAsnId) {
      messageApi.warning('请先选择要绑定的 ASN');
      return;
    }
    const ids = selectedRows.map((item) => item.id);
    const res = await updateProviderAsn({
      provider_ids: ids,
      asn_id: batchBindAsnId,
    });
    if (res.code !== 0) {
      messageApi.error(res.msg || '批量绑定 ASN 失败');
      return;
    }
    messageApi.success('批量绑定 ASN 成功');
    setBatchBindAsnId(undefined);
    setSelectedRows([]);
    actionRef.current?.reloadAndRest?.();
    refreshStats();
  };

  const unbindAsnBySelection = async () => {
    if (!selectedRows.length) {
      messageApi.warning('请先选择 Provider');
      return;
    }
    if (!batchBindAsnId) {
      messageApi.warning('请先选择要解除关联的 ASN');
      return;
    }
    const ids = selectedRows.map((item) => item.id);
    const res = await unbindAsnProviders({
      asn_id: batchBindAsnId,
      provider_ids: ids,
    });
    if (res.code !== 0) {
      messageApi.error(res.msg || '批量解除关联失败');
      return;
    }
    messageApi.success('批量解除关联成功');
    setBatchBindAsnId(undefined);
    setSelectedRows([]);
    actionRef.current?.reloadAndRest?.();
    refreshStats();
  };

  return (
    <PageContainer>
      {contextHolder}
      <StatsPanel stats={statsData?.data} loading={statsLoading} />
      <ProTable<API.ProviderItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const current = Number(params.current || 1);
          const pageSize = Number(params.pageSize || 10);
          const selectedAsnId = params.asn_id
            ? Number(params.asn_id)
            : undefined;
          const res = showUnboundOnly
            ? await getUnboundProviders({
                current,
                pageSize,
                search: params.search as string | undefined,
              })
            : selectedAsnId
              ? await getProvidersByAsn({
                  asn_id: selectedAsnId,
                  current,
                  pageSize,
                })
              : await fetchProvider({
                  current,
                  pageSize,
                  search: params.search as string | undefined,
                  country: params.country as string | undefined,
                  type: params.type as string | undefined,
                  is_active:
                    params.is_active === true || params.is_active === 'true'
                      ? true
                      : params.is_active === false ||
                          params.is_active === 'false'
                        ? false
                        : undefined,
                  min_reliability: params.min_reliability
                    ? Number(params.min_reliability)
                    : undefined,
                  asn_id: selectedAsnId,
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
            新增 Provider
          </Button>,
          <Button
            key="unbound"
            type={showUnboundOnly ? 'primary' : 'default'}
            onClick={() => {
              setShowUnboundOnly((prev) => !prev);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            {showUnboundOnly ? '查看全部' : '仅看未绑定 ASN'}
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
          <Select
            style={{ width: 280 }}
            loading={asnLoading}
            placeholder="选择要绑定的 ASN"
            options={asnOptions}
            value={batchBindAsnId}
            onChange={setBatchBindAsnId}
            allowClear
            showSearch
            optionFilterProp="label"
          />
          <Button onClick={bindAsnBySelection}>批量绑定 ASN</Button>
          <Button onClick={unbindAsnBySelection}>批量解除 ASN</Button>
          <Button onClick={() => updateStatusBySelection(true)}>
            批量启用
          </Button>
          <Button onClick={() => updateStatusBySelection(false)}>
            批量禁用
          </Button>
          <Button
            danger
            onClick={() => {
              Modal.confirm({
                title: `确认删除选中的 ${selectedRows.length} 条 Provider 记录？`,
                onOk: async () => {
                  const ids = selectedRows.map((item) => item.id);
                  const res = await deleteProvider({ ids });
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
      <ProviderFormModal
        open={formOpen}
        current={currentRow}
        asnOptions={asnOptions}
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
        width={760}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailRow(undefined);
        }}
      >
        {detailRow?.id && (
          <ProDescriptions<API.ProviderItem>
            title={`Provider 详情 - ${detailRow.name}`}
            column={2}
            request={async () => ({
              data: detailRow,
            })}
            params={{ id: detailRow.id }}
            columns={
              detailColumns as ProDescriptionsItemProps<API.ProviderItem>[]
            }
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default ProviderPage;
