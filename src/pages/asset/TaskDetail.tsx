import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useParams } from '@umijs/max';
import { App, Button, Descriptions, Space, Tabs, Tag } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import JsonBlock from '../dev/components/JsonBlock';
import DevAuthGate from '../dev/components/DevAuthGate';
import { getTaskDetail, listTaskEvents, listTaskItems } from '@/services/task-service/api';
import { formatText, formatTime, normalizeDevErrorMessage } from './utils';

const getStatusColor = (status?: string) => {
  if (status === 'succeeded' || status === 'success') {
    return 'green';
  }
  if (status === 'failed') {
    return 'red';
  }
  if (status === 'running') {
    return 'blue';
  }
  if (status === 'cancelled') {
    return 'default';
  }
  return 'gold';
};

const TaskDetailContent: React.FC = () => {
  const { message } = App.useApp();
  const params = useParams<{ taskId?: string }>();
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<API.TaskServiceTask | null>(null);

  const taskId = Number(params.taskId);

  const loadDetail = useCallback(async () => {
    if (!Number.isFinite(taskId)) {
      return;
    }
    setLoading(true);
    try {
      const response = await getTaskDetail(taskId);
      setDetail(response.data);
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [message, taskId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  const itemColumns: ProColumns<API.TaskServiceTaskItem>[] = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 90, renderText: formatText },
      {
        title: 'Status',
        dataIndex: 'status',
        width: 120,
        render: (_, record) => (
          <Tag color={getStatusColor(record.status)}>{record.status || '-'}</Tag>
        ),
      },
      {
        title: 'Target Type',
        dataIndex: 'target_type',
        width: 140,
        renderText: formatText,
      },
      {
        title: 'Target ID',
        dataIndex: 'target_id',
        width: 160,
        renderText: formatText,
      },
      {
        title: 'Error Summary',
        dataIndex: 'error_summary',
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Updated At',
        dataIndex: 'updated_at',
        width: 180,
        renderText: formatTime,
      },
    ],
    [],
  );

  const eventColumns: ProColumns<API.TaskServiceTaskEvent>[] = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 90, renderText: formatText },
      {
        title: 'Event Type',
        dataIndex: 'event_type',
        width: 180,
        renderText: formatText,
      },
      {
        title: 'Level',
        dataIndex: 'level',
        width: 120,
        renderText: formatText,
      },
      {
        title: 'Message',
        dataIndex: 'message',
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Created At',
        dataIndex: 'created_at',
        width: 180,
        renderText: formatTime,
      },
    ],
    [],
  );

  return (
    <PageContainer
      title={Number.isFinite(taskId) ? `Task #${taskId}` : 'Task Detail'}
      extra={[
        <Button key="refresh" loading={loading} onClick={() => void loadDetail()}>
          Refresh
        </Button>,
      ]}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Task ID">
            {formatText(detail?.id ?? taskId)}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(detail?.status)}>{detail?.status || '-'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Type">
            {formatText(detail?.type)}
          </Descriptions.Item>
          <Descriptions.Item label="Name">
            {formatText(detail?.name)}
          </Descriptions.Item>
          <Descriptions.Item label="Target Type">
            {formatText(detail?.target_type)}
          </Descriptions.Item>
          <Descriptions.Item label="Target ID">
            {formatText(detail?.target_id)}
          </Descriptions.Item>
          <Descriptions.Item label="Progress">
            {formatText(detail?.progress)}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {formatText(detail?.created_by)}
          </Descriptions.Item>
          <Descriptions.Item label="Started At">
            {formatTime(detail?.started_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Finished At">
            {formatTime(detail?.finished_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {formatTime(detail?.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {formatTime(detail?.updated_at)}
          </Descriptions.Item>
          <Descriptions.Item label="Error Summary" span={2}>
            {formatText(detail?.error_summary)}
          </Descriptions.Item>
        </Descriptions>

        <Tabs
          items={[
            {
              key: 'request',
              label: 'Request',
              children: <JsonBlock value={detail?.request_json} />,
            },
            {
              key: 'result',
              label: 'Result',
              children: <JsonBlock value={detail?.result_json} />,
            },
            {
              key: 'items',
              label: 'Items',
              children: (
                <ProTable<API.TaskServiceTaskItem>
                  rowKey={(record) =>
                    String(record.id ?? `${record.target_type}-${record.target_id}`)
                  }
                  search={false}
                  options={false}
                  columns={itemColumns}
                  request={async (tableParams) => {
                    try {
                      const response = await listTaskItems(taskId, {
                        page: Number(tableParams.current || 1),
                        page_size: Number(tableParams.pageSize || 10),
                      });
                      return {
                        data: response.data?.items || [],
                        success: true,
                        total: response.data?.total || 0,
                      };
                    } catch (error: any) {
                      message.error(normalizeDevErrorMessage(error));
                      return { data: [], success: false, total: 0 };
                    }
                  }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <JsonBlock title="request_json" value={record.request_json} />
                        <JsonBlock title="result_json" value={record.result_json} />
                      </Space>
                    ),
                  }}
                />
              ),
            },
            {
              key: 'events',
              label: 'Events',
              children: (
                <ProTable<API.TaskServiceTaskEvent>
                  rowKey={(record) =>
                    String(record.id ?? `${record.event_type}-${record.created_at}`)
                  }
                  search={false}
                  options={false}
                  columns={eventColumns}
                  request={async (tableParams) => {
                    try {
                      const response = await listTaskEvents(taskId, {
                        page: Number(tableParams.current || 1),
                        page_size: Number(tableParams.pageSize || 10),
                      });
                      return {
                        data: response.data?.items || [],
                        success: true,
                        total: response.data?.total || 0,
                      };
                    } catch (error: any) {
                      message.error(normalizeDevErrorMessage(error));
                      return { data: [], success: false, total: 0 };
                    }
                  }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <JsonBlock title="payload_json" value={record.payload_json} />
                    ),
                  }}
                />
              ),
            },
          ]}
        />
      </Space>
    </PageContainer>
  );
};

const AssetTaskDetailPage: React.FC = () => (
  <DevAuthGate>
    <TaskDetailContent />
  </DevAuthGate>
);

export default AssetTaskDetailPage;
