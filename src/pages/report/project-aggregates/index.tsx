import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { App, Card, DatePicker, Form, Input } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { getProjectAggregatesDaily } from '@/services/project-aggregates/api';

const { RangePicker } = DatePicker;

const ProjectAggregatesPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const today = dayjs().format('YYYY-MM-DD');
  const [dateRange, setDateRange] = useState<[string, string]>([today, today]);
  const [projectCode, setProjectCode] = useState<string | undefined>();
  const [adCountry, setAdCountry] = useState<string | undefined>();

  const columns: ProColumns<API.ProjectAggregatesDailyItem>[] = [
    { title: '日期', dataIndex: 'reportDate', width: 110, search: false },
    { title: '项目代号', dataIndex: 'projectCode', width: 110, search: false },
    { title: '广告国家', dataIndex: 'adCountry', width: 90, search: false },
    { title: '上报新增', dataIndex: 'reportNewUsers', width: 90, search: false },
    { title: '日活', dataIndex: 'dauUsers', width: 90, search: false },
    { title: '注册新增', dataIndex: 'registerNewUsers', width: 90, search: false },
    { title: '收入', dataIndex: 'revenue', width: 100, search: false },
    { title: '投放成本', dataIndex: 'adSpendCost', width: 100, search: false },
    { title: '流量 GB', dataIndex: 'trafficUsageGb', width: 100, search: false },
    { title: '流量成本', dataIndex: 'trafficCost', width: 100, search: false },
    { title: '毛利', dataIndex: 'grossProfit', width: 100, search: false },
    { title: 'ROI', dataIndex: 'roi', width: 90, search: false },
    { title: 'CPI', dataIndex: 'cpi', width: 90, search: false },
    { title: 'eCPM', dataIndex: 'ecpm', width: 90, search: false },
    { title: 'FB eCPM', dataIndex: 'fbEcpm', width: 90, search: false },
    { title: 'CTR', dataIndex: 'ctr', width: 90, search: false },
    { title: '匹配率', dataIndex: 'matchRate', width: 90, search: false },
    { title: '展示率', dataIndex: 'showRate', width: 90, search: false },
    { title: '展示', dataIndex: 'impressions', width: 100, search: false },
    { title: '点击', dataIndex: 'clicks', width: 90, search: false },
    { title: '请求', dataIndex: 'adRequests', width: 100, search: false },
    { title: '匹配', dataIndex: 'matchedRequests', width: 100, search: false },
    { title: '更新时间', dataIndex: 'updatedAt', width: 170, search: false },
  ];

  return (
    <PageContainer>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="日期范围">
            <RangePicker
              value={[dayjs(dateRange[0]), dayjs(dateRange[1])]}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
                }
              }}
            />
          </Form.Item>
          <Form.Item label="项目代号">
            <Input
              value={projectCode}
              onChange={(e) => setProjectCode(e.target.value || undefined)}
              placeholder="如 A003"
              style={{ width: 140 }}
            />
          </Form.Item>
          <Form.Item label="广告国家">
            <Input
              value={adCountry}
              onChange={(e) => setAdCountry(e.target.value || undefined)}
              placeholder="如 US"
              style={{ width: 120 }}
            />
          </Form.Item>
        </Form>
      </Card>

      <Card title="项目日报明细">
        <ProTable<API.ProjectAggregatesDailyItem>
          rowKey="id"
          columns={columns}
          search={false}
          request={async (params) => {
            const res = await getProjectAggregatesDaily({
              startDate: dateRange[0],
              endDate: dateRange[1],
              projectCode,
              adCountry,
              page: params.current ?? 1,
              pageSize: params.pageSize ?? 50,
              orderBy: 'reportDate',
              orderDir: 'desc',
            });
            if (res.code !== 0) {
              messageApi.error(res.msg || '获取项目聚合日报失败');
              return { data: [], success: false, total: 0 };
            }
            return {
              data: res.data?.list ?? [],
              success: true,
              total: res.data?.total ?? 0,
            };
          }}
          pagination={{ defaultPageSize: 50, showSizeChanger: true }}
          scroll={{ x: 2200 }}
        />
      </Card>
    </PageContainer>
  );
};

export default ProjectAggregatesPage;
