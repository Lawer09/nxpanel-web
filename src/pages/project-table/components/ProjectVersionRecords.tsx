import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActionType,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Space,
  Tag,
  Typography,
} from 'antd';
import { InfoCircleOutlined, PlusOutlined, ReloadOutlined, SwapOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
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
  versionType: VersionType;
  versionMajor: number;
  versionMinor: number;
  versionPatch: number;
  versionName?: string | null;
  content: string;
  releaseTime: Dayjs;
  remark?: string | null;
}

type VersionType = 'minor' | 'major';
type VersionParts = {
  major: number;
  minor: number;
  patch: number;
};

const normalizeTextValue = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  const nextValue = value.trim();
  return nextValue === '' ? null : nextValue;
};

const parseVersionParts = (version?: string | null): VersionParts => {
  const parts = `${version || ''}`.replace(/^v/i, '').split('.').map((item) => Number(item));
  return {
    major: Number.isFinite(parts[0]) && parts[0] >= 0 ? Math.floor(parts[0]) : 0,
    minor: Number.isFinite(parts[1]) && parts[1] >= 0 ? Math.floor(parts[1]) : 0,
    patch: Number.isFinite(parts[2]) && parts[2] >= 0 ? Math.floor(parts[2]) : 0,
  };
};

const formatVersionParts = (parts: VersionParts) => `${parts.major}.${parts.minor}.${parts.patch}`;

const getNextVersionParts = (currentVersion?: string | null, versionType: VersionType = 'minor'): VersionParts => {
  const parts = parseVersionParts(currentVersion);
  if (versionType === 'major') {
    return {
      major: parts.major + 1,
      minor: 0,
      patch: 0,
    };
  }
  return {
    ...parts,
    patch: parts.patch + 1,
  };
};

const inferVersionType = (version: string | undefined, latestVersion?: string | null): VersionType => {
  const current = parseVersionParts(latestVersion);
  const target = parseVersionParts(version);
  return target.major > current.major ? 'major' : 'minor';
};

const toVersionParts = (values?: Partial<VersionRecordFormValues>): VersionParts => ({
  major: Math.max(0, Math.floor(Number(values?.versionMajor ?? 0))),
  minor: Math.max(0, Math.floor(Number(values?.versionMinor ?? 0))),
  patch: Math.max(0, Math.floor(Number(values?.versionPatch ?? 0))),
});

const ProjectVersionRecords: React.FC<ProjectVersionRecordsProps> = ({ projectId, projectCode }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [form] = Form.useForm<VersionRecordFormValues>();
  const [formOpen, setFormOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<ProjectVersionRecord>();
  const [latestRecord, setLatestRecord] = useState<ProjectVersionRecord>();
  const [submitting, setSubmitting] = useState(false);

  const versionType = Form.useWatch('versionType', form) ?? 'minor';
  const watchedVersionParts = Form.useWatch((values) => toVersionParts(values), form);
  const currentVersion = latestRecord?.version || '0.0.0';
  const previewVersion = formatVersionParts(watchedVersionParts || getNextVersionParts(currentVersion, versionType));

  const versionTypeOptions = useMemo(
    () => [
      { label: '小版本', value: 'minor' },
      { label: '大版本', value: 'major' },
    ],
    [],
  );

  const setVersionFields = (parts: VersionParts) => {
    form.setFieldsValue({
      versionMajor: parts.major,
      versionMinor: parts.minor,
      versionPatch: parts.patch,
    });
  };

  const buildCreateValues = useCallback((nextVersionType: VersionType = 'minor'): Partial<VersionRecordFormValues> => {
    const nextParts = getNextVersionParts(currentVersion, nextVersionType);
    return {
      versionType: nextVersionType,
      versionMajor: nextParts.major,
      versionMinor: nextParts.minor,
      versionPatch: nextParts.patch,
    };
  }, [currentVersion]);

  const openCreate = () => {
    setCurrentRecord(undefined);
    form.resetFields();
    form.setFieldsValue(buildCreateValues('minor'));
    setFormOpen(true);
  };

  const openEdit = (record: ProjectVersionRecord) => {
    const parts = parseVersionParts(record.version);
    setCurrentRecord(record);
    form.resetFields();
    form.setFieldsValue({
      versionType: inferVersionType(record.version, currentVersion),
      versionMajor: parts.major,
      versionMinor: parts.minor,
      versionPatch: parts.patch,
      versionName: record.versionName || undefined,
      content: record.content,
      releaseTime: record.releaseTime ? dayjs(record.releaseTime) : undefined,
      remark: record.remark || undefined,
    });
    setFormOpen(true);
  };

  useEffect(() => {
    if (!formOpen || currentRecord) return;
    form.setFieldsValue(buildCreateValues(versionType));
  }, [buildCreateValues, currentRecord, form, formOpen, versionType]);

  const reload = () => {
    actionRef.current?.reload();
  };

  const handleVersionTypeChange = (nextType: VersionType) => {
    form.setFieldsValue({ versionType: nextType });
    setVersionFields(getNextVersionParts(currentVersion, nextType));
  };

  const handleToggleVersionType = () => {
    handleVersionTypeChange(versionType === 'major' ? 'minor' : 'major');
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const payload = {
        version: formatVersionParts(toVersionParts(values)),
        versionName: normalizeTextValue(values.versionName),
        content: values.content.trim(),
        releaseTime: dayjs(values.releaseTime).format('YYYY-MM-DD HH:mm:ss'),
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
      form.resetFields();
      reload();
    } catch (error) {
      const validationError = error as { errorFields?: unknown[] };
      if (validationError?.errorFields) return;
      message.error(currentRecord ? '编辑失败' : '新增失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ProColumns<ProjectVersionRecord>[] = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 140,
      ellipsis: true,
    },
    {
      title: '版本名称',
      dataIndex: 'versionName',
      width: 180,
      ellipsis: true,
      render: (_, record) => record.versionName || '-',
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
          if ((params.current ?? 1) === 1) {
            setLatestRecord(pageData?.data?.[0]);
          }
          return {
            data: pageData?.data ?? [],
            total: pageData?.total ?? 0,
            success: true,
          };
        }}
      />

      <Modal
        title={currentRecord ? '编辑版本' : '新增版本'}
        open={formOpen}
        width={760}
        destroyOnHidden
        confirmLoading={submitting}
        okText={currentRecord ? '确认保存' : '确认新增'}
        cancelText="取消"
        onOk={handleSubmit}
        onCancel={() => {
          if (submitting) return;
          setFormOpen(false);
          setCurrentRecord(undefined);
          form.resetFields();
        }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <Typography.Text type="secondary">
              <InfoCircleOutlined /> 可直接修改任意版本号，也可随时切换版本类型
            </Typography.Text>
            <Space>
              <CancelBtn />
              <OkBtn />
            </Space>
          </div>
        )}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="versionType" label="版本类型" rules={[{ required: true, message: '请选择版本类型' }]}>
            <Segmented
              block
              options={versionTypeOptions}
              onChange={(value) => handleVersionTypeChange(value as VersionType)}
            />
          </Form.Item>
          <Typography.Text type="secondary">
            小版本用于功能迭代和问题修复，大版本用于重大升级。
          </Typography.Text>

          <Form.Item label="版本号" required style={{ marginTop: 24 }}>
            <Space align="center" wrap>
              <Form.Item
                name="versionMajor"
                noStyle
                rules={[{ required: true, message: '请输入主版本号' }]}
              >
                <InputNumber min={0} precision={0} style={{ width: 150 }} />
              </Form.Item>
              <Typography.Text strong>.</Typography.Text>
              <Form.Item
                name="versionMinor"
                noStyle
                rules={[{ required: true, message: '请输入次版本号' }]}
              >
                <InputNumber min={0} precision={0} style={{ width: 150 }} />
              </Form.Item>
              <Typography.Text strong>.</Typography.Text>
              <Form.Item
                name="versionPatch"
                noStyle
                rules={[{ required: true, message: '请输入修订版本号' }]}
              >
                <InputNumber min={0} precision={0} style={{ width: 150 }} />
              </Form.Item>
              <Button icon={<SwapOutlined />} onClick={handleToggleVersionType}>
                切换为{versionType === 'major' ? '小版本' : '大版本'}
              </Button>
            </Space>
          </Form.Item>

          <div
            style={{
              border: '1px solid #bfdbfe',
              background: 'linear-gradient(135deg, #eff6ff 0%, #eaf3ff 100%)',
              borderRadius: 8,
              padding: 24,
              marginBottom: 24,
            }}
          >
            <Typography.Text strong>版本预览</Typography.Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
              <Typography.Title level={2} style={{ margin: 0 }}>
                v{previewVersion}
              </Typography.Title>
              <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                {versionType === 'major' ? '大版本' : '小版本'}
              </Tag>
            </div>
            <Typography.Text type="secondary">
              当前版本 v{currentVersion} → 新版本 v{previewVersion}
            </Typography.Text>
          </div>

          <Form.Item name="versionName" label="版本名称" rules={[{ max: 100, message: '版本名称最多 100 个字符' }]}>
            <Input placeholder="请输入版本名称" />
          </Form.Item>
          <Form.Item
            name="content"
            label="版本说明"
            rules={[
              { required: true, message: '请输入版本说明' },
              { max: 5000, message: '版本说明最多 5000 个字符' },
            ]}
          >
            <Input.TextArea rows={4} placeholder="请输入本次更新内容" />
          </Form.Item>
          <Form.Item name="releaseTime" label="上线时间" rules={[{ required: true, message: '请选择上线时间' }]}>
            <DatePicker showTime style={{ width: 220 }} placeholder="请选择上线时间" />
          </Form.Item>
          <Form.Item name="remark" label="备注" rules={[{ max: 255, message: '备注最多 255 个字符' }]}>
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectVersionRecords;
