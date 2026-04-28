import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { App, Button, DatePicker, Form, Input, Modal, Select, Space, Tag } from 'antd';
import { history } from '@umijs/max';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import {
  getProjects,
  createProject,
  updateProject,
  updateProjectStatus,
} from '@/services/project/api';
import {
  triggerProjectAggregates,
  triggerProjectAggregatesAsync,
} from '@/services/project-aggregates/api';

const { RangePicker } = DatePicker;

const STATUS_MAP: Record<string, { color: string; text: string }> = {
  active: { color: 'success', text: '活跃' },
  inactive: { color: 'default', text: '停用' },
  archived: { color: 'warning', text: '归档' },
};

const ProjectListPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<API.ProjectItem | undefined>();
  const [form] = Form.useForm();
  const [submitLoading, setSubmitLoading] = useState(false);
  const [aggregateOpen, setAggregateOpen] = useState(false);
  const [aggregateRange, setAggregateRange] = useState<[string, string]>([
    dayjs().format('YYYY-MM-DD'),
    dayjs().format('YYYY-MM-DD'),
  ]);
  const [aggregateSyncLoading, setAggregateSyncLoading] = useState(false);
  const [aggregateAsyncLoading, setAggregateAsyncLoading] = useState(false);

  const handleOpenForm = (record?: API.ProjectItem) => {
    setCurrentRow(record);
    if (record) {
      form.setFieldsValue(record);
    } else {
      form.resetFields();
    }
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitLoading(true);
      if (currentRow?.id) {
        const res = await updateProject(currentRow.id, values);
        if (res.code !== 0) {
          messageApi.error(res.msg || '修改失败');
          setSubmitLoading(false);
          return;
        }
        messageApi.success('修改成功');
      } else {
        const res = await createProject(values);
        if (res.code !== 0) {
          messageApi.error(res.msg || '新增失败');
          setSubmitLoading(false);
          return;
        }
        messageApi.success('新增成功');
      }
      setSubmitLoading(false);
      setFormOpen(false);
      actionRef.current?.reload();
    } catch {
      setSubmitLoading(false);
    }
  };

  const handleChangeStatus = async (record: API.ProjectItem, newStatus: string) => {
    const res = await updateProjectStatus(record.id, newStatus);
    if (res.code !== 0) {
      messageApi.error(res.msg || '操作失败');
      return;
    }
    messageApi.success('状态已更新');
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.ProjectItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, search: false },
    {
      title: '项目代号',
      dataIndex: 'projectCode',
      width: 130,
      search: false,
      render: (_, r) => (
        <a onClick={() => history.push(`/project/${r.id}`)}>{r.projectCode}</a>
      ),
    },
    { title: '项目名称', dataIndex: 'projectName', width: 180, search: false },
    { title: '所属人', dataIndex: 'ownerName', width: 100, search: false },
    { title: '部门', dataIndex: 'department', width: 120, search: false },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        active: { text: '活跃', status: 'Success' },
        inactive: { text: '停用', status: 'Default' },
        archived: { text: '归档', status: 'Warning' },
      },
      render: (_, r) => {
        const s = STATUS_MAP[r.status] || { color: 'default', text: r.status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    { title: '备注', dataIndex: 'remark', width: 200, search: false, ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', width: 170, search: false },
    {
      title: '搜索',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '项目代号 / 项目名称' },
    },
    {
      title: '所属人ID',
      dataIndex: 'ownerId',
      hideInTable: true,
      valueType: 'digit',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) => [
        <a key="edit" onClick={() => handleOpenForm(record)}>
          编辑
        </a>,
        <a key="detail" onClick={() => history.push(`/project/${record.id}`)}>
          详情
        </a>,
        record.status !== 'archived' && (
          <a
            key="archive"
            onClick={() => handleChangeStatus(record, 'archived')}
            style={{ color: '#ff4d4f' }}
          >
            归档
          </a>
        ),
      ],
    },
  ];

  const handleTriggerAggregateSync = async () => {
    setAggregateSyncLoading(true);
    try {
      const res = await triggerProjectAggregates({
        startDate: aggregateRange[0],
        endDate: aggregateRange[1],
      });
      if (res.code !== 0) {
        messageApi.error(res.msg || '触发聚合任务失败');
        return;
      }
      const d = res.data;
      Modal.success({
        title: '项目聚合任务执行完成',
        width: 760,
        content: (
          <div>
            <p>success: {String(d?.success)}</p>
            <p>startDate: {d?.startDate}</p>
            <p>endDate: {d?.endDate}</p>
            <p>exitCode: {d?.exitCode}</p>
            <pre style={{ maxHeight: 320, overflow: 'auto', background: '#fafafa', padding: 12 }}>
              {d?.output || '-'}
            </pre>
          </div>
        ),
      });
    } catch {
      messageApi.error('触发聚合任务失败');
    }
    setAggregateSyncLoading(false);
  };

  const handleTriggerAggregateAsync = async () => {
    setAggregateAsyncLoading(true);
    try {
      const res = await triggerProjectAggregatesAsync({
        startDate: aggregateRange[0],
        endDate: aggregateRange[1],
      });
      if (res.code !== 0) {
        messageApi.error(res.msg || '异步任务入队失败');
        return;
      }
      const d = res.data;
      Modal.success({
        title: '项目聚合异步任务已提交',
        content: (
          <div>
            <p>accepted: {String(d?.accepted)}</p>
            <p>triggerId: {d?.triggerId}</p>
            <p>startDate: {d?.startDate}</p>
            <p>endDate: {d?.endDate}</p>
            <p>status: {d?.status}</p>
          </div>
        ),
      });
    } catch {
      messageApi.error('异步任务入队失败');
    }
    setAggregateAsyncLoading(false);
  };

  return (
    <PageContainer>
      <ProTable<API.ProjectItem>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getProjects({
            keyword: params.keyword as string | undefined,
            ownerId: params.ownerId ? Number(params.ownerId) : undefined,
            status: params.status as 'active' | 'inactive' | 'archived' | undefined,
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
          <Button key="aggregate" onClick={() => setAggregateOpen(true)}>
            项目聚合任务
          </Button>,
          <Button key="add" type="primary" onClick={() => handleOpenForm()}>
            新增项目
          </Button>,
        ]}
        pagination={{ defaultPageSize: 20 }}
      />

      <Modal
        title={currentRow ? '编辑项目' : '新增项目'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" preserve={false}>
          {!currentRow && (
            <Form.Item
              name="projectCode"
              label="项目代号"
              rules={[{ required: true, message: '请输入项目代号' }]}
            >
              <Input placeholder="如 game_001" />
            </Form.Item>
          )}
          <Form.Item
            name="projectName"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="如 Game Project 001" />
          </Form.Item>
          <Form.Item
            name="ownerId"
            label="所属人ID"
            rules={[{ required: true, message: '请输入所属人ID' }]}
          >
            <Input type="number" placeholder="1001" />
          </Form.Item>
          <Form.Item
            name="ownerName"
            label="所属人姓名"
            rules={[{ required: true, message: '请输入所属人姓名' }]}
          >
            <Input placeholder="张三" />
          </Form.Item>
          <Form.Item
            name="department"
            label="部门"
            rules={[{ required: true, message: '请输入部门' }]}
          >
            <Input placeholder="增长组" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select
              options={[
                { label: '活跃', value: 'active' },
                { label: '停用', value: 'inactive' },
                { label: '归档', value: 'archived' },
              ]}
            />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="项目聚合任务（全项目）"
        open={aggregateOpen}
        onCancel={() => setAggregateOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setAggregateOpen(false)}>
            取消
          </Button>,
          <Button
            key="async"
            onClick={handleTriggerAggregateAsync}
            loading={aggregateAsyncLoading}
          >
            异步触发
          </Button>,
          <Button
            key="sync"
            type="primary"
            onClick={handleTriggerAggregateSync}
            loading={aggregateSyncLoading}
          >
            立即执行
          </Button>,
        ]}
        width={620}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <div>按日期范围触发所有项目聚合任务。</div>
          <RangePicker
            style={{ width: '100%' }}
            value={[dayjs(aggregateRange[0]), dayjs(aggregateRange[1])]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setAggregateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
              }
            }}
          />
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default ProjectListPage;
