import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Input, Space, Tag, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { getUserReportRealtime } from '@/services/performance/api';

const { Text } = Typography;

const RealtimeUserReportPage: React.FC = () => {
  const [appId, setAppId] = useState<string | undefined>();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [total, setTotal] = useState<number>(0);
  const [data, setData] = useState<API.UserReportRealtimeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const columns: ProColumns<API.UserReportRealtimeItem>[] = [
    {
      title: '用户ID',
      dataIndex: 'user_id',
      width: 120,
      search: false,
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      width: 140,
      search: false,
    },
    {
      title: '上报时间',
      dataIndex: 'created_at',
      width: 180,
      search: false,
    },
    {
      title: 'metadata',
      dataIndex: 'metadata',
      search: false,
      render: (_, record) => {
        const text = record.metadata ? JSON.stringify(record.metadata) : '-';
        return (
          <Text ellipsis style={{ maxWidth: 300, display: 'inline-block' }} title={text}>
            {text}
          </Text>
        );
      },
    },
    {
      title: 'user_default',
      dataIndex: 'user_default',
      search: false,
      render: (_, record) => {
        const text = record.user_default ? JSON.stringify(record.user_default) : '-';
        return (
          <Text ellipsis style={{ maxWidth: 300, display: 'inline-block' }} title={text}>
            {text}
          </Text>
        );
      },
    },
    {
      title: 'reports',
      dataIndex: 'reports',
      search: false,
      render: (_, record) => {
        const text = record.reports ? JSON.stringify(record.reports) : '-';
        return (
          <Text ellipsis style={{ maxWidth: 300, display: 'inline-block' }} title={text}>
            {text}
          </Text>
        );
      },
    },
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getUserReportRealtime({
        appId,
        page,
        pageSize,
      });
      const payload = (res as any)?.data ?? res;
      setData(payload?.data || []);
      setTotal(payload?.total || 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [appId, page, pageSize]);

  useEffect(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    timerRef.current = window.setInterval(() => {
      loadData();
    }, 5000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [appId, page, pageSize]);

  useEffect(() => {
    if (total > 0 && page * pageSize > total) {
      setPage(1);
    }
  }, [total, page, pageSize]);

  return (
    <PageContainer>
      <ProTable<API.UserReportRealtimeItem>
        headerTitle="用户上报实时数据"
        rowKey={(record, index) => `${record.user_id}_${record.created_at}_${index}`}
        columns={columns}
        dataSource={data}
        loading={loading}
        search={false}
        toolBarRender={false}
        toolbar={{
          filter: (
            <Space wrap>
              <Input
                placeholder="App 包名"
                value={appId}
                onChange={(e) => setAppId(e.target.value || undefined)}
                onPressEnter={() => {
                  setPage(1);
                  loadData();
                }}
                style={{ width: 220 }}
              />
              <Tag color="processing">每 5 秒同页刷新</Tag>
              <Button
                onClick={() => {
                  setPage(1);
                  loadData();
                }}
              >
                手动刷新
              </Button>
            </Space>
          ),
        }}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
    </PageContainer>
  );
};

export default RealtimeUserReportPage;
