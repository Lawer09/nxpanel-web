import { App, Form, Input, InputNumber } from 'antd';
import React from 'react';
import { queryUserReportSummary } from '@/services/report/api';
import BaseUserReportTab, { toOrderDirection, toSnakeGroupBy } from './BaseUserReportTab';

const DIMENSIONS = [
  { label: '日期', value: 'date' },
  { label: '小时', value: 'hour' },
  { label: '用户ID', value: 'userId' },
  { label: '应用ID', value: 'appId' },
  { label: '应用版本', value: 'appVersion' },
  { label: '国家', value: 'country' },
];

const METRICS = [{ label: '上报次数', value: 'reportCount' }];

const UserReportSummaryTab: React.FC = () => {
  const { message: messageApi } = App.useApp();

  return (
    <BaseUserReportTab
      storageKey="report.userReport.summary"
      defaultDimensions={['date', 'appId', 'country']}
      defaultMetrics={['reportCount']}
      dimensionOptions={DIMENSIONS}
      metricOptions={METRICS}
      renderExtraFilters={({ query, setQuery, visibleFilterDimensions }) => (
        <>
          {visibleFilterDimensions.includes('userId') ? (
            <Form.Item label="用户ID">
              <InputNumber
                value={query.userId}
                min={1}
                style={{ width: 120 }}
                onChange={(value) => setQuery((prev) => ({ ...prev, userId: value ?? undefined }))}
              />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('appId') ? (
            <Form.Item label="应用ID">
              <Input
                value={query.appId}
                style={{ width: 160 }}
                onChange={(e) => setQuery((prev) => ({ ...prev, appId: e.target.value || undefined }))}
              />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('appVersion') ? (
            <Form.Item label="应用版本">
              <Input
                value={query.appVersion}
                style={{ width: 130 }}
                onChange={(e) => setQuery((prev) => ({ ...prev, appVersion: e.target.value || undefined }))}
              />
            </Form.Item>
          ) : null}
          {visibleFilterDimensions.includes('country') ? (
            <Form.Item label="国家">
              <Input
                value={query.country}
                style={{ width: 120 }}
                onChange={(e) => setQuery((prev) => ({ ...prev, country: e.target.value || undefined }))}
              />
            </Form.Item>
          ) : null}
        </>
      )}
      fetcher={async ({ query, page, pageSize, dimensions, sorter }) => {
        const res = await queryUserReportSummary({
          dateFrom: query.dateRange[0],
          dateTo: query.dateRange[1],
          hourFrom: query.hourFrom,
          hourTo: query.hourTo,
          groupBy: toSnakeGroupBy(dimensions),
          orderBy: sorter?.field || sorter?.columnKey,
          orderDirection: toOrderDirection(sorter?.order),
          filters: {
            userIds: query.userId ? [query.userId] : undefined,
            appIds: query.appId ? [query.appId] : undefined,
            appVersions: query.appVersion ? [query.appVersion] : undefined,
            countries: query.country ? [query.country] : undefined,
          },
          page,
          pageSize,
        });

        if (res.code !== 0) {
          messageApi.error(res.msg || '获取汇总查询失败');
          return { list: [], total: 0 };
        }

        const payload = res.data;
        const list = Array.isArray(payload?.data) ? payload.data : [];
        const total = Number(payload?.total ?? list.length);
        return { list, total };
      }}
    />
  );
};

export default UserReportSummaryTab;
