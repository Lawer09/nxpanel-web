import React, { useRef } from 'react';
import { Button, Input, Space, Tabs } from 'antd';
import { DownloadOutlined, FilterOutlined, SearchOutlined, SettingOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { useDashboard } from '../DashboardContext';
import {
  getTrafficDaily,
  getTrafficHourly,
  getTrafficMonthly,
  getTrafficSyncJobs,
} from '@/services/traffic-platform/api';

const UsageDataTabs: React.FC = () => {
  const { filters, activeTab, setActiveTab, setSyncErrorData } = useDashboard();
  const actionRef = useRef<ActionType | undefined>(undefined);

  const commonParams = {
    platformCode: filters.platformCode,
    accountId: filters.accountId,
    geo: filters.geo,
  };

  const toGb = (val: any) => {
    if (val?.trafficGb !== undefined) return Number(val.trafficGb).toFixed(2);
    if (val?.trafficMb !== undefined) return (Number(val.trafficMb) / 1024).toFixed(2);
    return '0.00';
  };

  const getHourlyTime = (record: any) =>
    record.statTime ||
    [record.reportDate || record.statDate, record.reportHour || record.statHour]
      .filter(Boolean)
      .join(' ') ||
    '-';

  const getDailyDate = (record: any) => record.reportDate || record.statDate || '-';

  const getMonthlyDate = (record: any) => record.reportMonth || record.statMonth || '-';

  const hourlyColumns: ProColumns<any>[] = [
    { title: '时间', width: 160, render: (_, record) => getHourlyTime(record) },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号', dataIndex: 'accountName', width: 140 },
    { title: '地区', key: 'geo', width: 120, render: (_, record) => record.region || record.geo || '-' },
    { title: '流量 (GB)', key: 'gb', width: 120, render: (_, record) => toGb(record) },
  ];

  const dailyColumns: ProColumns<any>[] = [
    { title: '日期', dataIndex: 'reportDate', width: 120, render: (_, record) => getDailyDate(record) },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号', dataIndex: 'accountName', width: 140 },
    { title: '地区', key: 'geo', width: 120, render: (_, record) => record.region || record.geo || '-' },
    { title: '流量 (GB)', key: 'gb', width: 120, render: (_, record) => toGb(record) },
  ];

  const monthlyColumns: ProColumns<any>[] = [
    { title: '月份', dataIndex: 'reportMonth', width: 120, render: (_, record) => getMonthlyDate(record) },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号', dataIndex: 'accountName', width: 140 },
    { title: '流量 (GB)', key: 'gb', width: 120, render: (_, record) => toGb(record) },
  ];

  const syncColumns: ProColumns<any>[] = [
    { title: '任务ID', dataIndex: 'id', width: 120 },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号', dataIndex: 'accountName', width: 140 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value, record) => {
        let color = '#2563EB';
        let bg = '#EFF6FF';

        if (value === 'success') {
          color = '#10B981';
          bg = '#ECFDF5';
        } else if (value === 'failed') {
          color = '#EF4444';
          bg = '#FEF2F2';
        }

        return (
          <span
            onClick={() => value === 'failed' && setSyncErrorData(record)}
            style={{
              color,
              backgroundColor: bg,
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: value === 'failed' ? 'pointer' : 'default',
            }}
          >
            {String(value)}
          </span>
        );
      },
    },
    { title: '开始时间', dataIndex: 'startTime', width: 160 },
    { title: '结束时间', dataIndex: 'endTime', width: 160 },
  ];

  const getColumns = () => {
    switch (activeTab) {
      case 'hourly':
        return hourlyColumns;
      case 'monthly':
        return monthlyColumns;
      case 'sync':
        return syncColumns;
      default:
        return dailyColumns;
    }
  };

  const getRequest = async (params: any) => {
    let res: any;

    if (activeTab === 'hourly') {
      res = await getTrafficHourly({
        ...commonParams,
        startTime: `${filters.dateRange[0].format('YYYY-MM-DD')} 00:00:00`,
        endTime: `${filters.dateRange[1].format('YYYY-MM-DD')} 23:59:59`,
        page: params.current,
        pageSize: params.pageSize,
      });
    } else if (activeTab === 'daily') {
      res = await getTrafficDaily({
        ...commonParams,
        startDate: filters.dateRange[0].format('YYYY-MM-DD'),
        endDate: filters.dateRange[1].format('YYYY-MM-DD'),
        page: params.current,
        pageSize: params.pageSize,
      });
    } else if (activeTab === 'monthly') {
      res = await getTrafficMonthly({
        ...commonParams,
        startMonth: filters.dateRange[0].format('YYYY-MM'),
        endMonth: filters.dateRange[1].format('YYYY-MM'),
        page: params.current,
        pageSize: params.pageSize,
      });
    } else {
      res = await getTrafficSyncJobs({
        platformCode: filters.platformCode,
        accountId: filters.accountId,
        startTime: `${filters.dateRange[0].format('YYYY-MM-DD')} 00:00:00`,
        endTime: `${filters.dateRange[1].format('YYYY-MM-DD')} 23:59:59`,
        page: params.current,
        pageSize: params.pageSize,
      });
    }

    const payload = res.data?.data || res.data || [];
    const total = res.data?.total ?? payload.length;

    return { data: payload, total, success: true };
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        height: '100%',
        padding: '24px',
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'daily', label: '日流量汇总' },
          { key: 'hourly', label: '小时流量明细' },
          { key: 'monthly', label: '月流量汇总' },
        ]}
      />
      <div
        style={{
          padding: '0 0 12px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button icon={<DownloadOutlined />}>导出</Button>
        <Space>
          <Input placeholder="搜索账号" prefix={<SearchOutlined />} style={{ width: 200 }} />
          <Button type="text" icon={<FilterOutlined />} />
          <Button type="text" icon={<SettingOutlined />} />
        </Space>
      </div>
      <ProTable
        rowKey={(record) =>
          record.id ||
          `${record.platformAccountId}_${record.statTime || record.reportHour || record.statHour || record.reportDate || record.statDate || record.reportMonth || record.statMonth}_${record.externalUid || ''}_${record.geo || ''}`
        }
        actionRef={actionRef}
        search={false}
        toolBarRender={false}
        columns={getColumns()}
        params={{ activeTab, filters }}
        request={getRequest}
        pagination={{ defaultPageSize: 10, showSizeChanger: true }}
        scroll={{ x: 'max-content' }}
        options={false}
      />
    </div>
  );
};

export default UsageDataTabs;
