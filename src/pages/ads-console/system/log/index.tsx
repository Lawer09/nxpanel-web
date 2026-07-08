import { SearchOutlined } from '@ant-design/icons';
import AdsConsoleAuthButton from '@/components/AdsConsoleAuthButton';
import { getLogFilterOptions, getLogPage } from '@/services/ads-console/log';
import {
  type ActionType,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, DatePicker, Descriptions, Modal, Select, Space, Tag, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const formatLogPayload = (value?: string): string => {
  if (!value) return '-';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

const formatDateTime = (value?: string) =>
  value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-';

const LogManagePage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<AdsConsole.SysOperationLog | null>(null);
  const [operatorOptions, setOperatorOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [moduleOptions, setModuleOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [filters, setFilters] = useState<{
    operatorName?: string;
    module?: string;
    status?: number;
    range?: [Dayjs, Dayjs];
  }>({});

  useEffect(() => {
    getLogFilterOptions().then((res) => {
      if (!res?.success || !res.data) return;
      setOperatorOptions(res.data.operators || []);
      setModuleOptions(res.data.modules || []);
    });
  }, []);

  const operatorSelectOptions = useMemo(
    () =>
      operatorOptions.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    [operatorOptions],
  );

  const moduleSelectOptions = useMemo(
    () =>
      moduleOptions.map((item) => ({
        label: item.label,
        value: item.value,
      })),
    [moduleOptions],
  );

  const columns: ProColumns<AdsConsole.SysOperationLog>[] = [
    {
      title: '操作时间',
      dataIndex: 'createTime',
      width: 168,
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      width: 140,
      ellipsis: true,
      search: false,
    },
    {
      title: '模块',
      dataIndex: 'module',
      width: 140,
      ellipsis: true,
      search: false,
    },
    {
      title: '操作内容',
      dataIndex: 'operation',
      width: 220,
      ellipsis: true,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      search: false,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'error'}>
          {record.status === 1 ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '耗时(ms)',
      dataIndex: 'costTime',
      width: 96,
      search: false,
      render: (value) => {
        const time = Number(value || 0);
        const color = time > 1000 ? 'red' : time > 500 ? 'orange' : 'default';
        return <Tag color={color}>{time}</Tag>;
      },
    },
    {
      title: '操作',
      valueType: 'option',
      width: 72,
      fixed: 'right',
      render: (_, record) => [
        <AdsConsoleAuthButton
          key="view"
          type="link"
          size="small"
          code="system:log:list"
          onClick={() => {
            setDetailRecord(record);
            setDetailOpen(true);
          }}
        >
          详情
        </AdsConsoleAuthButton>,
      ],
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.SysOperationLog>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        search={false}
        request={async (params) => {
          const res = await getLogPage({
            current: params.current,
            size: params.pageSize,
            operatorName: filters.operatorName,
            module: filters.module,
            status: filters.status,
            startTime: filters.range?.[0]?.format('YYYY-MM-DD 00:00:00'),
            endTime: filters.range?.[1]?.format('YYYY-MM-DD 23:59:59'),
          });
          if (res?.success) {
            return {
              data: res.data?.records || [],
              total: res.data?.total || 0,
              success: true,
            };
          }
          return { data: [], total: 0, success: false };
        }}
        toolbar={{
          search: false,
          filter: (
            <Space size={12} wrap>
              <RangePicker
                value={filters.range}
                onChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    range: value ? [value[0]!, value[1]!] : undefined,
                  }))
                }
              />
              <Select
                allowClear
                showSearch
                placeholder="操作人"
                style={{ width: 180 }}
                optionFilterProp="label"
                value={filters.operatorName}
                options={operatorSelectOptions}
                onChange={(value) => setFilters((prev) => ({ ...prev, operatorName: value }))}
              />
              <Select
                allowClear
                showSearch
                placeholder="模块"
                style={{ width: 180 }}
                optionFilterProp="label"
                value={filters.module}
                options={moduleSelectOptions}
                onChange={(value) => setFilters((prev) => ({ ...prev, module: value }))}
              />
              <Select
                allowClear
                placeholder="状态"
                style={{ width: 120 }}
                value={filters.status}
                options={[
                  { label: '成功', value: 1 },
                  { label: '失败', value: 0 },
                ]}
                onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => actionRef.current?.reload()}
              >
                查询
              </Button>
              <Button
                onClick={() => {
                  setFilters({});
                  setTimeout(() => actionRef.current?.reload(), 0);
                }}
              >
                重置
              </Button>
            </Space>
          ),
        }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        scroll={{ x: 920, y: '65vh' }}
        size="small"
      />

      <Modal
        title="操作日志详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={780}
      >
        {detailRecord && (
          <div
            style={{
              marginTop: 8,
              maxHeight: '70vh',
              overflow: 'auto',
              paddingRight: 4,
            }}
          >
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="操作人">
                {detailRecord.operatorName}
              </Descriptions.Item>
              <Descriptions.Item label="操作时间">
                {formatDateTime(detailRecord.createTime)}
              </Descriptions.Item>
              <Descriptions.Item label="模块">
                {detailRecord.module}
              </Descriptions.Item>
              <Descriptions.Item label="操作描述">
                {detailRecord.operation}
              </Descriptions.Item>
              <Descriptions.Item label="耗时(ms)">
                {detailRecord.costTime ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={detailRecord.status === 1 ? 'success' : 'error'}>
                  {detailRecord.status === 1 ? '成功' : '失败'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="请求URL" span={3}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    minWidth: 0,
                  }}
                >
                  <Tag style={{ marginInlineEnd: 0, flex: 'none' }}>
                    {detailRecord.requestMethod || '-'}
                  </Tag>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      minWidth: 0,
                      maxWidth: '100%',
                    }}
                  >
                    <Text
                      copyable={detailRecord.requestUrl ? { text: detailRecord.requestUrl } : false}
                      style={{
                        fontSize: 12,
                        display: 'block',
                        wordBreak: 'break-all',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {detailRecord.requestUrl || '-'}
                    </Text>
                  </div>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="请求方法" span={2}>
                <Text
                  copyable
                  style={{
                    fontSize: 12,
                    display: 'block',
                    wordBreak: 'break-all',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {detailRecord.method || '-'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="请求参数" span={2}>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 8,
                    borderRadius: 4,
                    maxHeight: 200,
                    overflow: 'auto',
                    fontSize: 12,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {formatLogPayload(detailRecord.requestParams)}
                </pre>
              </Descriptions.Item>
              <Descriptions.Item label="响应结果" span={2}>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 8,
                    borderRadius: 4,
                    maxHeight: 200,
                    overflow: 'auto',
                    fontSize: 12,
                    margin: 0,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {formatLogPayload(detailRecord.responseData)}
                </pre>
              </Descriptions.Item>
              {detailRecord.status === 0 && detailRecord.errorMsg && (
                <Descriptions.Item label="错误信息" span={2}>
                  <Text
                    type="danger"
                    style={{
                      fontSize: 12,
                      display: 'block',
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {detailRecord.errorMsg}
                  </Text>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </>
  );
};

export default LogManagePage;



