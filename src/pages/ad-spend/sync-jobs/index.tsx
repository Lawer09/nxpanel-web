import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, DatePicker, Descriptions, Drawer, Form, Modal, Select, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import {
  getAdSpendSyncJobs,
  getAdSpendSyncJobDetail,
  triggerAdSpendSync,
  getAdSpendAccounts,
} from '@/services/ad-spend-platform/api';

const { RangePicker } = DatePicker;

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  running: { color: 'processing', text: '运行中' },
  success: { color: 'success', text: '成功' },
  failed: { color: 'error', text: '失败' },
};

const SyncJobsPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState<API.AdSpendSyncJobDetail | undefined>();
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncForm] = Form.useForm();
  const [syncLoading, setSyncLoading] = useState(false);
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    getAdSpendAccounts({ enabled: 1, page: 1, pageSize: 200 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        setAccountOptions(
          res.data.data.map((a) => ({ label: `${a.accountName} (${a.platformCode})`, value: a.id })),
        );
      }
    });
  }, []);

  const handleShowDetail = async (id: number) => {
    const res = await getAdSpendSyncJobDetail(id);
    if (res.code !== 0) {
      messageApi.error(res.msg || '获取详情失败');
      return;
    }
    setDetailRow(res.data);
    setDetailOpen(true);
  };

  const handleSync = async () => {
    try {
      const values = await syncForm.validateFields();
      setSyncLoading(true);
      const res = await triggerAdSpendSync({
        accountId: values.accountId,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
      });
      setSyncLoading(false);
      if (res.code !== 0) {
        messageApi.error(res.msg || '提交失败');
        return;
      }
      messageApi.success(`同步任务已提交，Job ID: ${res.data?.jobId}`);
      setSyncOpen(false);
      syncForm.resetFields();
      actionRef.current?.reload();
    } catch {
      setSyncLoading(false);
    }
  };

  const columns: ProColumns<API.AdSpendSyncJobItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 70, search: false },
    { title: '平台', dataIndex: 'platformCode', width: 100 },
    { title: '账号', dataIndex: 'accountName', width: 130, search: false },
    { title: '开始日期', dataIndex: 'startDate', width: 120, search: false },
    { title: '结束日期', dataIndex: 'endDate', width: 120, search: false },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      valueEnum: {
        running: { text: '运行中', status: 'Processing' },
        success: { text: '成功', status: 'Success' },
        failed: { text: '失败', status: 'Error' },
      },
      render: (_, r) => {
        const s = STATUS_MAP[r.status] || { color: 'default', text: r.status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    { title: '总记录', dataIndex: 'totalRecords', width: 90, search: false },
    { title: '成功', dataIndex: 'successRecords', width: 90, search: false },
    {
      title: '错误信息',
      dataIndex: 'errorMessage',
      width: 200,
      search: false,
      ellipsis: true,
      render: (_, r) => r.errorMessage || '-',
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, search: false },
    {
      title: '账号ID',
      dataIndex: 'accountId',
      hideInTable: true,
      valueType: 'digit',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) => [
        <a key="detail" onClick={() => handleShowDetail(record.id)}>
          详情
        </a>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.AdSpendSyncJobItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getAdSpendSyncJobs({
            accountId: params.accountId ? Number(params.accountId) : undefined,
            platformCode: params.platformCode as string | undefined,
            status: params.status as string | undefined,
            startDate: params.startDate as string | undefined,
            endDate: params.endDate as string | undefined,
            page: params.current ?? 1,
            pageSize: params.pageSize ?? 20,
          });
          if (res.code !== 0) {
            messageApi.error(res.msg || '获取列表失败');
            return { data: [], success: false, total: 0 };
          }
          return {
            data: res.data?.data ?? [],
            success: true,
            total: res.data?.total ?? 0,
          };
        }}
        toolBarRender={() => [
          <Button key="sync" type="primary" onClick={() => setSyncOpen(true)}>
            手动同步
          </Button>,
        ]}
        pagination={{ defaultPageSize: 20 }}
        scroll={{ x: 1400 }}
      />

      <Modal
        title="手动触发同步"
        open={syncOpen}
        onCancel={() => setSyncOpen(false)}
        onOk={handleSync}
        confirmLoading={syncLoading}
        destroyOnClose
      >
        <Form form={syncForm} layout="vertical" preserve={false}>
          <Form.Item name="accountId" label="账号" rules={[{ required: true, message: '请选择账号' }]}>
            <Select options={accountOptions} placeholder="选择账号" showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围" rules={[{ required: true, message: '请选择日期范围' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="同步任务详情"
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={560}
      >
        {detailRow && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{detailRow.id}</Descriptions.Item>
            <Descriptions.Item label="平台">{detailRow.platformCode}</Descriptions.Item>
            <Descriptions.Item label="账号">{detailRow.accountName}</Descriptions.Item>
            <Descriptions.Item label="开始日期">{detailRow.startDate}</Descriptions.Item>
            <Descriptions.Item label="结束日期">{detailRow.endDate}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={STATUS_MAP[detailRow.status]?.color || 'default'}>
                {STATUS_MAP[detailRow.status]?.text || detailRow.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="总记录">{detailRow.totalRecords}</Descriptions.Item>
            <Descriptions.Item label="成功记录">{detailRow.successRecords}</Descriptions.Item>
            <Descriptions.Item label="请求参数">
              <pre style={{ margin: 0, fontSize: 12 }}>
                {JSON.stringify(detailRow.requestParams, null, 2)}
              </pre>
            </Descriptions.Item>
            <Descriptions.Item label="错误信息">{detailRow.errorMessage || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{detailRow.createdAt}</Descriptions.Item>
            <Descriptions.Item label="更新时间">{detailRow.updatedAt}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </PageContainer>
  );
};

export default SyncJobsPage;
