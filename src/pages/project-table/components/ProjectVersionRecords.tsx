import React, { useRef, useState } from 'react';
import {
  ActionType,
  ModalForm,
  ProColumns,
  ProFormDateTimePicker,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { App, Button, Popconfirm, Space, Typography } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  createProjectVersionRecord,
  deleteProjectVersionRecord,
  getProjectVersionRecords,
  updateProjectVersionRecord,
} from '@/services/project/api';
import type { ProjectVersionRecord } from '@/services/project/types';
import { formatUTC8 } from '@/utils/format';

interface ProjectVersionRecordsProps {
  projectId: number;
  projectCode?: string;
}

interface VersionRecordFormValues {
  version: string;
  content: string;
  releaseTime: string;
  remark?: string | null;
}

const normalizeTextValue = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const nextValue = value.trim();
  return nextValue === '' ? null : nextValue;
};

const ProjectVersionRecords: React.FC<ProjectVersionRecordsProps> = ({ projectId, projectCode }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ProjectVersionRecord>();

  const openCreate = () => {
    setCurrentRecord(undefined);
    setFormOpen(true);
  };

  const openEdit = (record: ProjectVersionRecord) => {
    setCurrentRecord(record);
    setFormOpen(true);
  };

  const reload = () => {
    actionRef.current?.reload();
  };

  const columns: ProColumns<ProjectVersionRecord>[] = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 140,
      ellipsis: true,
    },
    {
      title: '版本内容',
      dataIndex: 'content',
      search: false,
      render: (_, record) =>
        record.content ? (
          <Typography.Paragraph
            ellipsis={{ rows: 3, expandable: true, symbol: '展开' }}
            style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}
          >
            {record.content}
          </Typography.Paragraph>
        ) : (
          '-'
        ),
    },
    {
      title: '上线时间',
      dataIndex: 'releaseTime',
      width: 170,
      search: false,
      render: (_, record) => formatUTC8(record.releaseTime),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 220,
      search: false,
      ellipsis: true,
      render: (_, record) => record.remark || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      search: false,
      render: (_, record) => formatUTC8(record.createdAt),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 170,
      search: false,
      render: (_, record) => formatUTC8(record.updatedAt),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => (
        <Space>
          <a onClick={() => openEdit(record)}>编辑</a>
          <Popconfirm
            title="确认删除该版本记录？"
            onConfirm={async () => {
              await deleteProjectVersionRecord({ id: record.id });
              message.success('删除成功');
              reload();
            }}
          >
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const initialValues = currentRecord
    ? {
        ...currentRecord,
        releaseTime: currentRecord.releaseTime ? dayjs(currentRecord.releaseTime) : undefined,
      }
    : undefined;

  return (
    <div style={{ padding: '16px 24px', background: '#fafafa' }}>
      <ProTable<ProjectVersionRecord>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={false}
        options={false}
        size="small"
        scroll={{ x: 1080 }}
        pagination={{ showSizeChanger: true, defaultPageSize: 10 }}
        headerTitle={projectCode ? `版本记录 - ${projectCode}` : '版本记录'}
        toolBarRender={() => [
          <Button key="reload" icon={<ReloadOutlined />} onClick={reload}>
            刷新
          </Button>,
          <Button key="new" type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增版本
          </Button>,
        ]}
        request={async (params) => {
          const res = await getProjectVersionRecords({
            projectId,
            page: params.current,
            pageSize: params.pageSize,
          });
          const pageData = res.data;
          return {
            data: pageData?.data ?? [],
            total: pageData?.total ?? 0,
            success: true,
          };
        }}
      />

      <ModalForm<VersionRecordFormValues>
        title={currentRecord ? '编辑版本记录' : '新增版本记录'}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setCurrentRecord(undefined);
          }
        }}
        initialValues={initialValues}
        modalProps={{ destroyOnHidden: true }}
        onFinish={async (values) => {
          const releaseTime = dayjs(values.releaseTime).format('YYYY-MM-DD HH:mm:ss');
          const payload = {
            version: values.version.trim(),
            content: values.content.trim(),
            releaseTime,
            remark: normalizeTextValue(values.remark),
          };

          if (currentRecord) {
            await updateProjectVersionRecord({
              id: currentRecord.id,
              ...payload,
            });
            message.success('编辑成功');
          } else {
            await createProjectVersionRecord({
              projectId,
              ...payload,
            });
            message.success('新增成功');
          }
          setFormOpen(false);
          setCurrentRecord(undefined);
          reload();
          return true;
        }}
      >
        <ProFormText
          name="version"
          label="版本号"
          rules={[
            { required: true, message: '请输入版本号' },
            { max: 100, message: '版本号最多 100 个字符' },
          ]}
        />
        <ProFormTextArea
          name="content"
          label="版本内容"
          fieldProps={{ rows: 5 }}
          rules={[{ required: true, message: '请输入版本内容' }]}
        />
        <ProFormDateTimePicker
          name="releaseTime"
          label="上线时间"
          rules={[{ required: true, message: '请选择上线时间' }]}
          fieldProps={{ style: { width: '100%' } }}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          fieldProps={{ rows: 3 }}
          rules={[{ max: 255, message: '备注最多 255 个字符' }]}
        />
      </ModalForm>
    </div>
  );
};

export default ProjectVersionRecords;
