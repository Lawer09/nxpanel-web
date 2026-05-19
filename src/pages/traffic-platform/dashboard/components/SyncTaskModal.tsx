import React, { useRef, useState, useEffect } from 'react';
import { Modal, Form, Input, Select, App, Space, Tag, DatePicker, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-components';
import { useDashboard } from '../DashboardContext';
import { getTrafficSyncJobs, triggerTrafficSync } from '@/services/traffic-platform/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const SyncTaskModal: React.FC = () => {
  const { 
    syncTaskModalOpen, 
    setSyncTaskModalOpen, 
    syncTaskModalFilters, 
    platformOptions, 
    setSyncErrorData, 
    reloadKpi 
  } = useDashboard();
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);

  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string | undefined>(undefined);
  const [platformCode, setPlatformCode] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([dayjs(), dayjs()]);

  // Sync state with context filters when opened
  useEffect(() => {
    if (syncTaskModalOpen) {
      setStatus(syncTaskModalFilters.status);
      // Reset other filters to default if needed, or keep them if you want memory
    }
  }, [syncTaskModalOpen, syncTaskModalFilters]);

  const handleRetry = async (r: any) => {
    try {
      const res = await triggerTrafficSync({
        accountId: r.platformAccountId,
        platformCode: r.platformCode,
        startDate: dayjs(r.startTime).format('YYYY-MM-DD'),
        endDate: dayjs(r.endTime).format('YYYY-MM-DD'),
      });
      if (res.code === 0) {
        message.success('已重新提交同步任务');
        actionRef.current?.reload();
        reloadKpi();
      } else {
        message.error(res.msg || '提交失败');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const columns: ProColumns<API.TrafficSyncJobItem>[] = [
    { title: '任务ID', dataIndex: 'id', width: 120 },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号', dataIndex: 'accountName', width: 140 },
    { 
      title: '同步日期范围', 
      key: 'syncDateRange', 
      width: 180,
      render: (_, r) => `${dayjs(r.startTime).format('YYYY-MM-DD')} ~ ${dayjs(r.endTime).format('YYYY-MM-DD')}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v) => {
        let color = '#2563EB';
        let bg = '#EFF6FF';
        let label = '运行中';
        if (v === 'success') { color = '#10B981'; bg = '#ECFDF5'; label = '成功'; }
        else if (v === 'failed') { color = '#EF4444'; bg = '#FEF2F2'; label = '失败'; }
        return <Tag style={{ color, backgroundColor: bg, borderColor: bg }}>{label}</Tag>;
      },
    },
    { 
      title: '开始时间', 
      dataIndex: 'createdAt', // Use createdAt as start time of the job
      width: 160,
      render: (_, r) => r.createdAt ? dayjs(r.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    { 
      title: '结束时间', 
      dataIndex: 'updatedAt', 
      width: 160,
      render: (_, r) => (r.status === 'success' || r.status === 'failed') && r.updatedAt ? dayjs(r.updatedAt).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 160,
      render: (_, r) => (
        <Space size={16}>
          <a style={{ color: '#2563EB' }} onClick={() => setSyncErrorData(r)}>查看详情</a>
          {r.status === 'failed' && (
            <a style={{ color: '#EF4444' }} onClick={() => handleRetry(r)}>重试</a>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#111827' }}>同步任务</div>
          <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px', fontWeight: 'normal' }}>
            查看平台流量同步任务执行状态、时间范围和失败原因
          </div>
        </div>
      }
      width={1080}
      style={{ top: '8vh' }}
      styles={{ body: { maxHeight: '72vh', overflowY: 'auto' } }}
      open={syncTaskModalOpen}
      onCancel={() => setSyncTaskModalOpen(false)}
      footer={null}
      destroyOnHidden
    >
      <ProTable<API.TrafficSyncJobItem>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        columns={columns}
        options={false}
        params={{ keyword, status, platformCode, dateRange }}
        headerTitle={
          <Space size={16} wrap>
            <Select 
              placeholder="全部状态"
              style={{ width: 120 }}
              options={[
                { label: '全部', value: undefined },
                { label: '运行中', value: 'running' },
                { label: '成功', value: 'success' },
                { label: '失败', value: 'failed' },
              ]}
              value={status}
              onChange={setStatus}
              allowClear
            />
            <Select 
              placeholder="全部平台"
              style={{ width: 140 }}
              options={platformOptions}
              value={platformCode}
              onChange={setPlatformCode}
              allowClear
            />
            <RangePicker 
              style={{ width: 240 }} 
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                }
              }}
              allowClear={false}
            />
            <Input 
              placeholder="搜索任务ID / 账号" 
              prefix={<SearchOutlined />} 
              style={{ width: 240 }}
              allowClear
              onPressEnter={(e) => setKeyword((e.target as HTMLInputElement).value)}
              onBlur={(e) => setKeyword(e.target.value)}
            />
            <Button 
              type="primary" 
              style={{ backgroundColor: '#2563EB' }}
              onClick={() => actionRef.current?.reload()}
            >
              查询
            </Button>
          </Space>
        }
        request={async (params) => {
          const res = await getTrafficSyncJobs({ 
            platformCode: params.platformCode as string | undefined,
            status: params.status as string | undefined,
            // You can use keyword if the API supports it, currently API doc shows:
            // accountId, status, startTime, endTime
            // Let's pass the date range as startTime and endTime filter
            startTime: dateRange[0] ? `${dateRange[0].format('YYYY-MM-DD')} 00:00:00` : undefined,
            endTime: dateRange[1] ? `${dateRange[1].format('YYYY-MM-DD')} 23:59:59` : undefined,
            page: params.current, 
            pageSize: params.pageSize 
          });
          const payload = res.data?.data || res.data || [];
          
          // Local filter for keyword if API doesn't support keyword searching out of the box
          let filteredData = payload;
          if (params.keyword) {
            const kw = String(params.keyword).toLowerCase();
            filteredData = payload.filter((item: any) => 
              String(item.id).includes(kw) || 
              String(item.accountName || '').toLowerCase().includes(kw)
            );
          }

          return { data: filteredData, total: res.data?.total ?? filteredData.length, success: true };
        }}
        pagination={{ 
          defaultPageSize: 10, 
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`
        }}
      />
    </Modal>
  );
};

export default SyncTaskModal;
