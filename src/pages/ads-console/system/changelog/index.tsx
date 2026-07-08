import { PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { App, Form, Input, Modal, Popconfirm, Segmented, Statistic, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';
import AdsConsoleAuthButton from '@/components/AdsConsoleAuthButton';
import AdsConsoleMarkdownRenderer from '@/components/AdsConsoleMarkdownRenderer';
import {
  deleteChangelog,
  getChangelogPage,
  getChangelogReadStats,
  publishChangelog,
  saveChangelog,
  updateChangelog,
  uploadChangelogMedia,
} from '@/services/ads-console/changelog';

const { Text } = Typography;

const ChangelogManagePage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('新增更新日志');
  const [editingRecord, setEditingRecord] = useState<AdsConsole.SysChangelog | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecord, setPreviewRecord] = useState<AdsConsole.SysChangelog | null>(
    null,
  );
  const [mdContent, setMdContent] = useState<string>('');
  const [readStatsOpen, setReadStatsOpen] = useState(false);
  const [readStatsLoading, setReadStatsLoading] = useState(false);
  const [readStatsRecord, setReadStatsRecord] =
    useState<AdsConsole.SysChangelog | null>(null);
  const [readStatsKeyword, setReadStatsKeyword] = useState('');
  const [readStatsType, setReadStatsType] = useState<0 | 1>(1);
  const [readStatsPage, setReadStatsPage] = useState({ current: 1, size: 10 });
  const [readStatsData, setReadStatsData] =
    useState<AdsConsole.SysChangelogReadStats | null>(null);

  /** 预设的 Markdown 模板 */
  const defaultTemplate = `## 🚀 新增功能
-

## ✨ 优化迭代
-

## 🐛 问题修复
-
`;

  const handleAdd = () => {
    setEditingRecord(null);
    setModalTitle('新增更新日志');
    form.resetFields();
    setMdContent(defaultTemplate);
    form.setFieldValue('content', defaultTemplate);
    setModalOpen(true);
  };

  const handleEdit = (record: AdsConsole.SysChangelog) => {
    setEditingRecord(record);
    setModalTitle('编辑更新日志');
    form.setFieldsValue({
      version: record.version,
      title: record.title,
      content: record.content,
    });
    setMdContent(record.content || '');
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const res = await deleteChangelog(id);
    if (res?.success) {
      message.success('删除成功');
      actionRef.current?.reload();
    }
  };

  const handlePublish = (record: AdsConsole.SysChangelog) => {
    modal.confirm({
      title: '确认发布',
      content: (
        <div>
          <p>
            确认发布版本 <strong>{record.version}</strong>？
          </p>
          <p style={{ color: '#faad14', fontSize: 13 }}>
            发布后不可修改内容。
          </p>
        </div>
      ),
      okText: '确认发布',
      okButtonProps: { danger: false, type: 'primary' },
      onOk: async () => {
        const res = await publishChangelog(record.id);
        if (res?.success) {
          message.success('发布成功');
          actionRef.current?.reload();
        }
      },
    });
  };

  /** 关闭编辑弹窗并恢复页面滚动 */
  const closeEditModal = () => {
    setModalOpen(false);
    // 延迟恢复 body 滚动，等待 Modal 动画完成
    setTimeout(() => {
      document.body.style.overflow = '';
      document.body.style.removeProperty('overflow');
    }, 300);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      const dto: AdsConsole.SysChangelogSaveDTO = {
        ...values,
        content: mdContent,
        id: editingRecord?.id,
      };
      const res = editingRecord
        ? await updateChangelog(dto)
        : await saveChangelog(dto);
      if (res?.success) {
        message.success(editingRecord ? '修改成功' : '新增成功，已保存为草稿');
        closeEditModal();
        actionRef.current?.reload();
      }
    } catch {
      // 表单校验失败
    } finally {
      setSubmitting(false);
    }
  };

  const queryReadStats = async (
    record: AdsConsole.SysChangelog,
    type: 0 | 1,
    current: number,
    size: number,
    keyword: string,
  ) => {
    setReadStatsLoading(true);
    try {
      const res = await getChangelogReadStats(record.id, {
        current,
        size,
        keyword: keyword || undefined,
        readStatus: type,
      });
      if (res?.success && res.data) {
        setReadStatsData(res.data);
      }
    } finally {
      setReadStatsLoading(false);
    }
  };

  const openReadStats = async (record: AdsConsole.SysChangelog) => {
    setReadStatsRecord(record);
    setReadStatsType(1);
    setReadStatsKeyword('');
    setReadStatsPage({ current: 1, size: 10 });
    setReadStatsOpen(true);
    await queryReadStats(record, 1, 1, 10, '');
  };

  const handleReadStatsSearch = async () => {
    if (!readStatsRecord) return;
    const nextPage = { current: 1, size: readStatsPage.size };
    setReadStatsPage(nextPage);
    await queryReadStats(
      readStatsRecord,
      readStatsType,
      nextPage.current,
      nextPage.size,
      readStatsKeyword,
    );
  };
  const isSupportedMediaType = (type?: string) => {
    if (!type) return false;
    return [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ].includes(type);
  };

  const buildMediaMarkup = (fileName: string, type: string, url: string) => {
    if (type.startsWith('video/')) {
      return `<video controls preload="metadata" style="max-width:100%" src="${url}"></video>\n`;
    }
    return `![${fileName || 'image'}](${url})\n`;
  };

  /** 处理 Markdown 编辑器中的媒体粘贴/拖拽上传 */
  const handleMediaUpload = async (file: File): Promise<string> => {
    try {
      const res = await uploadChangelogMedia(file);
      if (res?.success && res.data) {
        return res.data;
      }
      message.error(res?.errorMessage || '媒体上传失败');
      return '';
    } catch {
      message.error('媒体上传失败');
      return '';
    }
  };

  /** 处理编辑器拖拽/粘贴事件 */
  const handleEditorDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!isSupportedMediaType(file.type)) return;

    e.preventDefault();
    const url = await handleMediaUpload(file);
    if (url) {
      const mediaMarkup = buildMediaMarkup(file.name, file.type, url);
      setMdContent((prev) => {
        const next = prev + mediaMarkup;
        form.setFieldValue('content', next);
        return next;
      });
    }
  };

  const handleEditorPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (isSupportedMediaType(item.type)) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const url = await handleMediaUpload(file);
        if (url) {
          const mediaMarkup = buildMediaMarkup(file.name || 'media', file.type, url);
          setMdContent((prev) => {
            const next = prev + mediaMarkup;
            form.setFieldValue('content', next);
            return next;
          });
        }
        break;
      }
    }
  };

  const columns: ProColumns<AdsConsole.SysChangelog>[] = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 120,
      render: (_, record) => (
        <Tag
          color={record.status === 1 ? 'blue' : 'default'}
          style={{ borderRadius: 12, fontWeight: 600 }}
        >
          {record.version}
        </Tag>
      ),
    },
    {
      title: '更新标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      valueType: 'select',
      valueEnum: {
        0: { text: '草稿', status: 'Default' },
        1: { text: '已发布', status: 'Success' },
      },
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'success' : 'default'}>
          {record.status === 1 ? '已发布' : '草稿'}
        </Tag>
      ),
    },
    {
      title: '发布时间',
      dataIndex: 'publishTime',
      width: 170,
      hideInSearch: true,
      render: (_, record) =>
        record.publishTime ? (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {dayjs(record.publishTime).format('YYYY-MM-DD HH:mm')}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 170,
      hideInSearch: true,
      render: (_, record) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {dayjs(record.createTime).format('YYYY-MM-DD HH:mm')}
        </Text>
      ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 220,
      fixed: 'right',
      render: (_, record) => [
        <AdsConsoleAuthButton
          key="preview"
          type="link"
          size="small"
          code="system:changelog:list"
          onClick={() => {
            setPreviewRecord(record);
            setPreviewOpen(true);
          }}
        >
          预览
        </AdsConsoleAuthButton>,
        record.status === 1 && (
          <AdsConsoleAuthButton
            key="readStats"
            type="link"
            size="small"
            code="system:changelog:list"
            onClick={() => openReadStats(record)}
          >
            阅读情况
          </AdsConsoleAuthButton>
        ),
        record.status === 0 && (
          <AdsConsoleAuthButton
            key="edit"
            type="link"
            size="small"
            code="system:changelog:edit"
            onClick={() => handleEdit(record)}
          >
            编辑
          </AdsConsoleAuthButton>
        ),
        record.status === 0 && (
          <AdsConsoleAuthButton
            key="publish"
            type="link"
            size="small"
            code="system:changelog:publish"
            style={{ color: '#1677ff' }}
            onClick={() => handlePublish(record)}
          >
            发布
          </AdsConsoleAuthButton>
        ),
        record.status === 0 && (
          <Popconfirm
            key="delete"
            title="确认删除该更新日志？"
            onConfirm={() => handleDelete(record.id)}
          >
            <AdsConsoleAuthButton
              type="link"
              size="small"
              danger
              code="system:changelog:delete"
            >
              删除
            </AdsConsoleAuthButton>
          </Popconfirm>
        ),
      ],
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.SysChangelog>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getChangelogPage({
            current: params.current,
            size: params.pageSize,
            version: params.version,
            status: params.status,
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
        toolBarRender={() => [
          <AdsConsoleAuthButton
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            code="system:changelog:add"
            onClick={handleAdd}
          >
            新增日志
          </AdsConsoleAuthButton>,
        ]}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        size="small"
        search={{
          labelWidth: 80,
          defaultCollapsed: false,
        }}
      />

      {/* 新增/编辑 Modal */}
      <Modal
        title={modalTitle}
        open={modalOpen}
        onCancel={closeEditModal}
        onOk={handleSubmit}
        okText={editingRecord ? '保存修改' : '保存草稿'}
        confirmLoading={submitting}
        width={960}
        destroyOnHidden
        afterClose={() => {
          // 修复 MDEditor 导致 Modal 关闭后 body overflow 未恢复的问题
          document.body.style.overflow = '';
          document.body.style.removeProperty('overflow');
        }}
        styles={{
          body: { paddingTop: 12 },
        }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="version"
              label="版本号"
              rules={[
                { required: true, message: '请输入版本号' },
                { max: 32, message: '版本号最多32个字符' },
              ]}
              extra="格式示例：v1.2.3"
              style={{ flex: 1 }}
            >
              <Input placeholder="请输入版本号，如 v1.2.3" />
            </Form.Item>
            <Form.Item
              name="title"
              label="更新标题"
              rules={[
                { required: true, message: '请输入更新标题' },
                { max: 128, message: '标题最多128个字符' },
              ]}
              style={{ flex: 2 }}
            >
              <Input placeholder="请输入本次更新的标题摘要" />
            </Form.Item>
          </div>
          <Form.Item
            name="content"
            label="更新内容"
            rules={[
              {
                validator: (_, __) => {
                  if (!mdContent || mdContent.trim() === '') {
                    return Promise.reject(new Error('请输入更新内容'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            extra="支持 Markdown 格式，可直接粘贴或拖拽图片/GIF/视频上传"
          >
            <div
              data-color-mode="light"
              onDrop={handleEditorDrop}
              onPaste={handleEditorPaste}
            >
              <Input.TextArea
                value={mdContent}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                  const val = event.target.value;
                  setMdContent(val);
                  form.setFieldValue('content', val);
                }}
                autoSize={{ minRows: 14, maxRows: 22 }}
                placeholder={`请输入更新内容，支持 Markdown 格式，例如：

### 新功能
- 新增 xxx 功能
- 支持 xxx 特性

### 问题修复
- 修复 xxx 问题

### 优化改进
- 优化 xxx 体验`}
              />
              <div
                style={{
                  marginTop: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 6,
                  padding: 16,
                }}
              >
                <Typography.Text type="secondary">预览</Typography.Text>
                <AdsConsoleMarkdownRenderer content={mdContent} />
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          readStatsRecord ? (
            <span>
              阅读情况 —{' '}
              <Tag color="blue" style={{ borderRadius: 12, fontWeight: 600 }}>
                {readStatsRecord.version}
              </Tag>
              {readStatsRecord.title}
            </span>
          ) : (
            '阅读情况'
          )
        }
        open={readStatsOpen}
        onCancel={() => setReadStatsOpen(false)}
        footer={null}
        width={920}
      >
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Statistic title="启用用户总数" value={readStatsData?.totalUserCount || 0} />
          <Statistic title="已读" value={readStatsData?.readCount || 0} />
          <Statistic title="未读" value={readStatsData?.unreadCount || 0} />
          <Statistic
            title="阅读率"
            value={Number((readStatsData?.readRate || 0) * 100)}
            precision={2}
            suffix="%"
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <Segmented
            value={readStatsType}
            options={[
              { label: '已读', value: 1 },
              { label: '未读', value: 0 },
            ]}
            onChange={async (value) => {
              if (!readStatsRecord) return;
              const nextType = value as 0 | 1;
              setReadStatsType(nextType);
              const nextPage = { current: 1, size: readStatsPage.size };
              setReadStatsPage(nextPage);
              await queryReadStats(
                readStatsRecord,
                nextType,
                nextPage.current,
                nextPage.size,
                readStatsKeyword,
              );
            }}
          />
          <Input.Search
            allowClear
            placeholder="搜索用户名/昵称"
            value={readStatsKeyword}
            onChange={(e) => setReadStatsKeyword(e.target.value)}
            onSearch={handleReadStatsSearch}
            style={{ width: 280 }}
          />
        </div>

        <Table<AdsConsole.SysChangelogReadUser>
          rowKey="userId"
          loading={readStatsLoading}
          dataSource={readStatsData?.page?.records || []}
          pagination={{
            current: readStatsPage.current,
            pageSize: readStatsPage.size,
            total: readStatsData?.page?.total || 0,
            showSizeChanger: true,
            onChange: async (current, size) => {
              if (!readStatsRecord) return;
              const nextPage = { current, size };
              setReadStatsPage(nextPage);
              await queryReadStats(
                readStatsRecord,
                readStatsType,
                current,
                size,
                readStatsKeyword,
              );
            },
          }}
          columns={[
            { title: '用户名', dataIndex: 'username', width: 140 },
            { title: '昵称', dataIndex: 'nickname', width: 140, render: (v) => v || '-' },
            { title: '邮箱', dataIndex: 'email', render: (v) => v || '-' },
            {
              title: '状态',
              dataIndex: 'status',
              width: 100,
              render: (value) => (
                <Tag color={value === 1 ? 'success' : 'default'}>
                  {value === 1 ? '启用' : '禁用'}
                </Tag>
              ),
            },
            {
              title: '阅读时间',
              dataIndex: 'readTime',
              width: 180,
              render: (_, row) =>
                row.readTime ? dayjs(row.readTime).format('YYYY-MM-DD HH:mm') : '—',
            },
          ]}
        />
      </Modal>

      {/* 预览 Modal */}
      <Modal
        title={
          <span>
            预览 —{' '}
            <Tag color="blue" style={{ borderRadius: 12, fontWeight: 600 }}>
              {previewRecord?.version}
            </Tag>
            {previewRecord?.title}
          </span>
        }
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={760}
      >
        {previewRecord && (
          <div style={{ padding: '8px 0' }}>
            <div style={{ marginBottom: 12, color: '#999', fontSize: 13 }}>
              {previewRecord.publishTime
                ? `发布于 ${dayjs(previewRecord.publishTime).format('YYYY-MM-DD HH:mm')}`
                : `创建于 ${dayjs(previewRecord.createTime).format('YYYY-MM-DD HH:mm')}`}
            </div>
            <AdsConsoleMarkdownRenderer content={previewRecord.content} />
          </div>
        )}
      </Modal>

      <style>{`
        .w-md-editor {
          border-radius: 8px !important;
          border: 1px solid #d9d9d9 !important;
          box-shadow: none !important;
        }
        .w-md-editor:focus-within {
          border-color: #1677ff !important;
          box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.1) !important;
        }
        .w-md-editor-toolbar {
          border-bottom: 1px solid #f0f0f0 !important;
          background: #fafafa !important;
          border-radius: 8px 8px 0 0 !important;
          padding: 4px 8px !important;
        }
        .w-md-editor-toolbar li > button {
          height: 28px !important;
          width: 28px !important;
        }
        .w-md-editor-content {
          border-radius: 0 0 8px 8px !important;
        }
        .wmde-markdown {
          font-size: 14px !important;
        }
        /* 覆盖全局 list-style: none，确保编辑器预览区列表标识正常 */
        .wmde-markdown ul {
          list-style: disc !important;
          padding-left: 24px !important;
        }
        .wmde-markdown ol {
          list-style: decimal !important;
          padding-left: 24px !important;
        }
        .wmde-markdown li {
          display: list-item !important;
        }
      `}</style>
    </>
  );
};

export default ChangelogManagePage;




