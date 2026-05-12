import { App, Input, Modal, Select, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useState } from 'react';
import { ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { getAdRevenueApps } from '@/services/ad/api';
import { formatUtc8 } from '../../utils/time';

const PLATFORM_OPTIONS = [
  { label: 'AdMob', value: 'admob' },
  { label: 'Meta', value: 'meta' },
  { label: 'Unity', value: 'unity' },
  { label: 'AppLovin', value: 'applovin' },
  { label: 'IronSource', value: 'ironsource' },
];

interface AppListModalProps {
  open: boolean;
  onClose: () => void;
}

const AppListModal: React.FC<AppListModalProps> = ({ open, onClose }) => {
  const { message: messageApi } = App.useApp();

  const [data, setData] = useState<API.AdRevenueAppItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [platform, setPlatform] = useState<string>();
  const [keyword, setKeyword] = useState<string>();

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdRevenueApps({
        sourcePlatform: platform,
        keyword,
        page,
        pageSize,
      });
      if (res.code === 0 && res.data) {
        setData(res.data.data ?? []);
        setTotal(res.data.total ?? 0);
      } else {
        messageApi.error(res.msg || '获取 APP 列表失败');
      }
    } finally {
      setLoading(false);
    }
  }, [platform, keyword, page, pageSize]);

  useEffect(() => {
    if (open) {
      fetchApps();
    }
  }, [open, fetchApps]);

  const resetSearch = useCallback(() => {
    setPage(1);
    setPlatform(undefined);
    setKeyword(undefined);
  }, []);

  useEffect(() => {
    if (!open) {
      resetSearch();
    }
  }, [open, resetSearch]);

  const columns: ColumnsType<API.AdRevenueAppItem> = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    {
      title: '应用',
      key: 'app',
      width: 320,
      render: (_, r) => (
        <div>
          <Space size={4}>
            <Tag
              style={{ fontSize: 12, lineHeight: '18px', padding: '0 4px', margin: 0, border: 'none' }}
              color={r.devicePlatform === 'ANDROID' ? 'cyan' : r.devicePlatform === 'IOS' ? 'purple' : undefined}
            >
              {r.devicePlatform}
            </Tag>
            <span style={{ fontWeight: 500 }}>{r.providerAppName || '-'}</span>
            <Tag
              style={{ fontSize: 12, lineHeight: '18px', padding: '0 4px', margin: 0, border: 'none' }}
              color={r.appApprovalState === 'APPROVED' ? 'green' : r.appApprovalState === 'ACTION_REQUIRED' ? 'red' : undefined}
            >
              {r.appApprovalState}
            </Tag>
          </Space>
          <div style={{ fontSize: 12, color: '#999', lineHeight: '22px' }}>
            <Space size={8}>
              <Tooltip title={r.providerAppId}>
                <ExclamationCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
              </Tooltip>
              <span>{r.appStoreId || '-'}</span>
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: '账号',
      key: 'account',
      width: 220,
      render: (_, r) => (
        <div>
          <Space size={4}>
            <Tag style={{ fontSize: 12, lineHeight: '18px', padding: '0 4px', margin: 0 }}>{r.sourcePlatform}</Tag>
            <Tooltip title={r.accountName || '-'}>
              <span style={{ fontSize: 13 }}>{r.accountId}{r.accountLabel ? ` ${r.accountLabel}` : ''}</span>
            </Tooltip>
          </Space>
          <div style={{ fontSize: 12, color: '#999', lineHeight: '22px' }}>
            <Tooltip title="更新时间">
              <span>
                <ClockCircleOutlined style={{ marginRight: 4 }} />
                {formatUtc8(r.updatedAt)}
              </span>
            </Tooltip>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title="应用列表"
      open={open}
      onCancel={onClose}
      width={960}
      footer={null}
      destroyOnHidden
    >
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <Select
          allowClear
          placeholder="平台"
          style={{ width: 120 }}
          value={platform}
          onChange={(v) => { setPlatform(v); setPage(1); }}
          options={PLATFORM_OPTIONS}
        />
        <Input.Search
          placeholder="搜索应用名称 / 应用 ID / 商店 ID"
          allowClear
          style={{ width: 300 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onSearch={() => setPage(1)}
        />
      </div>
      <Table<API.AdRevenueAppItem>
        rowKey="id"
        dataSource={data}
        columns={columns}
        loading={loading}
        size="small"
        scroll={{ x: 600 }}
        pagination={{
          current: page,
          pageSize: pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, s) => { setPage(p); setPageSize(s); },
        }}
      />
    </Modal>
  );
};

export default AppListModal;
