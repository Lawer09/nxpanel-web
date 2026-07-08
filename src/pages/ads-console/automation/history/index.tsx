import AdsConsoleAuthButton from '@/components/AdsConsoleAuthButton';
import { getAutomationHistoryDetail, getAutomationHistoryPage } from '@/services/ads-console/automation/history';
import { type ActionType, type ProColumns, ProTable } from '@ant-design/pro-components';
import { Modal, Space, Tag } from 'antd';
import React, { useRef } from 'react';

const executionStatusLabelMap: Record<string, string> = {
  SUCCESS: '执行成功',
  FAILED: '执行失败',
  SKIPPED: '已跳过',
  WAITING_RETRY: '等待重试',
};

const HistoryPage: React.FC = () => {
  const actionRef = useRef<ActionType | undefined>(undefined);

  const columns: ProColumns<any>[] = [
    { title: '触发时间', dataIndex: 'triggeredAt', valueType: 'dateTime', width: 170 },
    {
      title: '触发方式',
      dataIndex: 'triggerSource',
      width: 100,
      render: (_, record) => (
        <Tag color={record.triggerSource === 'MANUAL' ? 'blue' : 'purple'}>
          {record.triggerSource === 'MANUAL' ? '手动' : '定时'}
        </Tag>
      ),
      hideInSearch: true,
    },
    { title: '规则名', dataIndex: 'ruleNameSnapshot', width: 180 },
    { title: '创建人', dataIndex: 'creatorName', width: 120, render: (_, record) => record.creatorName || record.createBy || '-' , hideInSearch: true },
    { title: '目标对象', dataIndex: 'targetType', width: 100 },
    { title: '目标对象ID', dataIndex: 'targetObjectId', width: 160 },
    { title: '触发原因(含阈值)', dataIndex: 'triggerReason', ellipsis: true, hideInSearch: true },
    {
      title: '重试进度',
      dataIndex: 'currentRetryCount',
      width: 150,
      hideInSearch: true,
      render: (_, record) => `${record.currentRetryCount ?? '-'} / ${record.retryTimesSnapshot ?? '-'}`
        + `，剩余 ${record.remainingRetryCount ?? '-'}`,
    },
    {
      title: '指标快照',
      dataIndex: 'metricSnapshot',
      hideInSearch: true,
      render: (_, record) => {
        if (!record.metricSnapshot) return '-';
        return <span style={{ whiteSpace: 'pre-wrap' }}>{record.metricSnapshot}</span>;
      },
    },
    { title: '动作摘要', dataIndex: 'actionSummary', ellipsis: true, hideInSearch: true },
    {
      title: '执行状态',
      dataIndex: 'executionStatus',
      width: 110,
      render: (_, record) => executionStatusLabelMap[record.executionStatus] || record.executionStatus || '-',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 90,
      render: (_, record) => [
        <AdsConsoleAuthButton
          key="detail"
          code="automation:history:list"
          type="link"
          onClick={async () => {
            const res = await getAutomationHistoryDetail(record.id);
            if (res?.success) {
              Modal.info({
                title: '历史详情',
                width: 860,
                content: (
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    <div><b>规则：</b>{record.ruleNameSnapshot || '-'}（ID: {record.ruleId || '-'}）</div>
                    <div><b>创建人：</b>{record.creatorName || record.createBy || '-'}</div>
                    <div><b>触发方式：</b>{record.triggerSource === 'MANUAL' ? '手动' : '定时'}（{record.jobBatchNo || '-'}）</div>
                    <div><b>重试进度：</b>{record.currentRetryCount ?? '-'} / {record.retryTimesSnapshot ?? '-'}，剩余 {record.remainingRetryCount ?? '-'} 次</div>
                    <div><b>触发原因：</b>{record.triggerReason || '-'}</div>
                    <div><b>动作摘要：</b>{record.actionSummary || '-'}</div>
                    <div><b>执行状态：</b>{executionStatusLabelMap[record.executionStatus] || record.executionStatus || '-'}</div>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(res.data, null, 2)}</pre>
                  </Space>
                ),
              });
            }
          }}
        >
          详情
        </AdsConsoleAuthButton>,
      ],
    },
  ];

  return (
    <ProTable<any>
      rowKey="id"
      actionRef={actionRef}
      columns={columns}
      scroll={{ x: 1700 }}
      request={async (params) => {
        const res = await getAutomationHistoryPage({
          current: params.current,
          size: params.pageSize,
          ruleId: params.ruleId,
          targetType: params.targetType,
          targetObjectId: params.targetObjectId,
          executionStatus: params.executionStatus,
        });
        if (!res?.success) return { data: [], total: 0, success: false };
        return { data: res.data?.records || [], total: res.data?.total || 0, success: true };
      }}
    />
  );
};

export default HistoryPage;



