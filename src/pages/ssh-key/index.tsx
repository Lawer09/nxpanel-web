import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { FooterToolbar, PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Drawer, Modal, message, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchProvider } from '@/services/provider/api';
import {
  batchDropSshKeys,
  dropSshKey,
  fetchSshKeys,
  getSshKeyDetail,
} from '@/services/ssh-key/api';
import BatchImportModal from './components/BatchImportModal';
import ImportFromCloudModal from './components/ImportFromCloudModal';
import SshKeyFormModal from './components/SshKeyFormModal';

const formatTimestamp = (value?: string | number) => {
  if (!value) return '-';
  if (typeof value === 'number') {
    return dayjs.unix(value).format('YYYY-MM-DD HH:mm:ss');
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
};

const SshKeyPage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
  const [selectedRows, setSelectedRows] = useState<API.SshKeyItem[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.SshKeyItem>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<API.SshKeyItem>();
  const [batchImportOpen, setBatchImportOpen] = useState(false);
  const [cloudImportOpen, setCloudImportOpen] = useState(false);

  const [providerOptions, setProviderOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [providerLoading, setProviderLoading] = useState(false);

  useEffect(() => {
    setProviderLoading(true);
    fetchProvider({ current: 1, pageSize: 1000 })
      .then((res) => {
        if (res.code === 0 && res.data?.data) {
          setProviderOptions(
            res.data.data.map((item) => ({ label: item.name, value: item.id })),
          );
        }
      })
      .finally(() => setProviderLoading(false));
  }, []);

  const columns: ProColumns<API.SshKeyItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '密钥名称',
      key: 'name',
      dataIndex: 'name',
      render: (_, record) => (
        <a
          onClick={async () => {
            const res = await getSshKeyDetail({ id: record.id });
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
      title: '名称搜索',
      key: 'name_search',
      dataIndex: 'name',
      hideInTable: true,
    },
    {
      title: '标签搜索',
      dataIndex: 'tags_search',
      hideInTable: true,
    },
    {
      title: '云服务商',
      dataIndex: ['provider', 'name'],
      render: (_, record) => record.provider?.name || '-',
      search: false,
    },
    {
      title: '服务商过滤',
      dataIndex: 'provider_id',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: providerOptions,
        loading: providerLoading,
        showSearch: true,
        optionFilterProp: 'label',
      },
    },
    {
      title: '服务商密钥ID',
      width: 120,
      dataIndex: 'provider_key_id',
      search: false,
      renderText: (value) => value || '-',
    },
    {
      title: '标签',
      dataIndex: 'tags',
      render: (_, record) =>
        record.tags ? (
          <Space wrap>
            {record.tags.split(',').map((tag, index) => (
              <Tag key={`${tag}-${index}`}>{tag}</Tag>
            ))}
          </Space>
        ) : (
          '-'
        ),
      search: false,
    },
    {
      title: '备注',
      dataIndex: 'note',
      search: false,
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      search: false,
      render: (_, record) => formatTimestamp(record.created_at),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      width: 160,
      search: false,
      render: (_, record) => formatTimestamp(record.updated_at),
    },
    {
      title: '操作',
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
              title: `确认删除密钥 ${record.name} ?`,
              onOk: async () => {
                const res = await dropSshKey({ id: record.id });
                if (res.code !== 0) {
                  messageApi.error(res.msg || '删除失败');
                  return;
                }
                messageApi.success('删除成功');
                actionRef.current?.reload();
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
      <ProTable<API.SshKeyItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await fetchSshKeys({
            page: Number(params.current || 1),
            pageSize: Number(params.pageSize || 10),
            name: params.name as string | undefined,
            tags: params.tags_search as string | undefined,
            providerId: params.provider_id
              ? Number(params.provider_id)
              : undefined,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '列表获取失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data || [],
            success: true,
            total: res.data?.total || 0,
          };
        }}
        pagination={{ defaultPageSize: 10 }}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            onClick={() => {
              setCurrentRow(undefined);
              setFormOpen(true);
            }}
          >
            新建密钥
          </Button>,
          <Button key="batch" type="primary" onClick={() => setBatchImportOpen(true)}>
            批量导入
          </Button>,
          <Button key="cloud" onClick={() => setCloudImportOpen(true)}>
            从云端导入
          </Button>,
        ]}
        rowSelection={{
          onChange: (_, rows) => setSelectedRows(rows),
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
                title: `确认删除选中的 ${selectedRows.length} 条密钥？`,
                onOk: async () => {
                  const ids = selectedRows.map((item) => item.id);
                  const res = await batchDropSshKeys({ ids });
                  if (res.code !== 0) {
                    messageApi.error(res.msg || '批量删除失败');
                    return;
                  }
                  messageApi.success('批量删除成功');
                  setSelectedRows([]);
                  actionRef.current?.reloadAndRest?.();
                },
              });
            }}
          >
            批量删除
          </Button>
        </FooterToolbar>
      )}

      <SshKeyFormModal
        open={formOpen}
        current={currentRow}
        providerOptions={providerOptions}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setCurrentRow(undefined);
          }
        }}
        onSuccess={() => {
          setFormOpen(false);
          actionRef.current?.reload();
        }}
      />

      <BatchImportModal
        open={batchImportOpen}
        providerOptions={providerOptions}
        onClose={() => setBatchImportOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />

      <ImportFromCloudModal
        open={cloudImportOpen}
        providerOptions={providerOptions}
        onClose={() => setCloudImportOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />

      <Drawer
        width={680}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailRow(undefined);
        }}
      >
        {detailRow?.id && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
              密钥详情 - {detailRow.name}
            </div>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <div>云服务商：{detailRow.provider?.name || '-'}</div>
              <div>云服务商密钥 ID：{detailRow.provider_key_id || '-'}</div>
              <div>标签：{detailRow.tags || '-'}</div>
              <div>备注：{detailRow.note || '-'}</div>
              <div>创建时间：{formatTimestamp(detailRow.created_at)}</div>
              <div>更新时间：{formatTimestamp(detailRow.updated_at)}</div>
            </Space>
          </div>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default SshKeyPage;
