import { PlayCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  batchDeleteAssetMachineScripts,
  batchUpdateAssetMachineScriptStatus,
  createAssetMachineScript,
  deleteAssetMachineScript,
  getAssetMachineScriptDetail,
  listAssetMachineScripts,
  listAssetMachines,
  runAssetMachineScript,
  updateAssetMachineScript,
} from '@/services/asset-service/api';
import JsonBlock from '../../../dev/components/JsonBlock';
import type {
  MachineScriptFormValues,
  MachineScriptRunFormValues,
  TaskAckHandler,
} from '../../types';
import {
  cleanupObject,
  formatText,
  formatTime,
  getAssetBatchFailureLines,
  getAssetBatchResultSummary,
  normalizeDevErrorMessage,
  parseJsonText,
} from '../../utils';
import MachineScriptFormModal from '../scripts/MachineScriptFormModal';

const normalizeTags = (
  values?: {
    key?: string;
    value?: string;
    label?: string;
  }[],
) =>
  (values || [])
    .map((item) => cleanupObject(item))
    .filter((item) => item.key && item.value) as API.AssetTagItem[];

type ScriptFilters = {
  name?: string;
  status?: string;
};

const getScriptStatusColor = (status?: string | null) => {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'disabled') {
    return 'default';
  }
  return 'default';
};

const MachineScriptsPanel: React.FC<{
  onTaskAck: TaskAckHandler;
}> = ({ onTaskAck }) => {
  const { message, modal } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<API.AssetMachineScript | null>(null);
  const [detail, setDetail] = useState<API.AssetMachineScript | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [runningScript, setRunningScript] = useState<API.AssetMachineScript | null>(
    null,
  );
  const [filters, setFilters] = useState<ScriptFilters>({});
  const [filterForm] = Form.useForm<ScriptFilters>();
  const [runForm] = Form.useForm<MachineScriptRunFormValues>();
  const [batchStatusForm] = Form.useForm<{ status?: string }>();
  const [machineOptions, setMachineOptions] = useState<API.AssetMachine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);
  const [selectedRows, setSelectedRows] = useState<API.AssetMachineScript[]>([]);

  const selectedIds = useMemo(
    () => selectedRows.map((item) => item.id),
    [selectedRows],
  );

  const loadScriptDetail = async (scriptId: number) => {
    const response = await getAssetMachineScriptDetail(scriptId);
    return response.data;
  };

  const loadMachineOptions = async () => {
    setLoadingMachines(true);
    try {
      const response = await listAssetMachines({
        page: 1,
        page_size: 200,
      });
      setMachineOptions(response.data?.items || []);
    } finally {
      setLoadingMachines(false);
    }
  };

  const openRunModal = async (record: API.AssetMachineScript) => {
    setRunningScript(record);
    runForm.setFieldsValue({
      machine_ids: [],
      timeout_seconds: 60,
      port: 22,
    });
    setRunOpen(true);
    try {
      await loadMachineOptions();
    } catch (error: any) {
      message.error(normalizeDevErrorMessage(error));
    }
  };

  const handleBatchMutationResult = (title: string, result: API.AssetBatchResult) => {
    const summary = getAssetBatchResultSummary(result);
    if (result.failed > 0) {
      const failureLines = getAssetBatchFailureLines(result);
      modal.info({
        title: `${title}结果`,
        width: 720,
        content: (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <span>{summary}</span>
            <div>
              {failureLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </Space>
        ),
      });
      message.warning(summary);
    } else {
      message.success(summary);
    }
    setSelectedRows([]);
    actionRef.current?.reload();
  };

  const openBatchDeleteConfirm = () => {
    if (!selectedIds.length) {
      message.info('请先选择脚本。');
      return;
    }
    modal.confirm({
      title: `批量删除 ${selectedIds.length} 个脚本`,
      okText: '确认删除',
      okButtonProps: { danger: true, loading: saving },
      onOk: async () => {
        try {
          setSaving(true);
          const response = await batchDeleteAssetMachineScripts({ ids: selectedIds });
          handleBatchMutationResult('批量删除脚本', response.data);
        } catch (error: any) {
          message.error(normalizeDevErrorMessage(error));
          throw error;
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const columns: ProColumns<API.AssetMachineScript>[] = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 80 },
      {
        title: '名称',
        dataIndex: 'name',
        width: 220,
        ellipsis: true,
      },
      {
        title: '说明',
        dataIndex: 'description',
        width: 280,
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: '状态',
        dataIndex: 'status',
        width: 110,
        render: (_, record) => (
          <Tag color={getScriptStatusColor(record.status)}>
            {record.status === 'active' ? '启用' : '停用'}
          </Tag>
        ),
      },
      {
        title: '标签',
        dataIndex: 'tags',
        width: 90,
        render: (_, record) =>
          record.tags?.length ? `${record.tags.length} 个` : '-',
      },
      {
        title: '更新时间',
        dataIndex: 'updated_at',
        width: 180,
        ellipsis: true,
        renderText: formatTime,
      },
      {
        title: '操作',
        valueType: 'option',
        width: 220,
        fixed: 'right',
        render: (_, record) => [
          <a
            key="detail"
            onClick={async () => {
              try {
                setDetail(await loadScriptDetail(record.id));
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            }}
          >
            详情
          </a>,
          <a
            key="edit"
            onClick={async () => {
              try {
                setEditing(await loadScriptDetail(record.id));
                setOpen(true);
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            }}
          >
            编辑
          </a>,
          <a key="run" onClick={() => void openRunModal(record)}>
            执行
          </a>,
          <Popconfirm
            key="delete"
            title="确认删除该脚本？"
            onConfirm={async () => {
              try {
                await deleteAssetMachineScript(record.id);
                message.success('机器脚本已删除。');
                actionRef.current?.reload();
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            }}
          >
            <a>删除</a>
          </Popconfirm>,
        ],
      },
    ],
    [message],
  );

  return (
    <>
      <Form<ScriptFilters>
        form={filterForm}
        layout="inline"
        onFinish={(values) =>
          setFilters({
            name: values.name?.trim() || undefined,
            status: values.status || undefined,
          })
        }
      >
        <Form.Item name="name" label="名称">
          <Input placeholder="按脚本名搜索" style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="status" label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            style={{ width: 160 }}
            options={[
              { label: '启用', value: 'active' },
              { label: '停用', value: 'disabled' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">
              应用
            </Button>
            <Button
              onClick={() => {
                filterForm.resetFields();
                setFilters({});
              }}
            >
              重置
            </Button>
          </Space>
        </Form.Item>
      </Form>

      <ProTable<API.AssetMachineScript>
        rowKey="id"
        actionRef={actionRef}
        search={false}
        scroll={{ x: 1120 }}
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedIds,
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        tableAlertRender={({ selectedRowKeys }) => `已选择 ${selectedRowKeys.length} 个脚本`}
        tableAlertOptionRender={() => [
          <a
            key="status"
            onClick={() => {
              batchStatusForm.resetFields();
              setBatchStatusOpen(true);
            }}
          >
            批量改状态
          </a>,
          <a key="delete" onClick={() => openBatchDeleteConfirm()}>
            批量删除
          </a>,
          <a key="clear" onClick={() => setSelectedRows([])}>
            清空选择
          </a>,
        ]}
        request={async (params) => {
          try {
            const response = await listAssetMachineScripts({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              name: filters.name,
              status: filters.status,
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
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            新建脚本
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ]}
      />

      <MachineScriptFormModal
        open={open}
        saving={saving}
        editingId={editing?.id}
        initialValues={
          editing
            ? {
                name: editing.name,
                description: editing.description,
                content: editing.content,
                status: editing.status,
                metadata_text: JSON.stringify(editing.metadata ?? null, null, 2),
                tags: editing.tags,
              }
            : {
                status: 'active',
                tags: [],
              }
        }
        onCancel={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={async (values) => {
          try {
            setSaving(true);
            const payload = {
              name: values.name.trim(),
              description: values.description?.trim() || undefined,
              content: values.content,
              status: values.status || 'active',
              metadata: parseJsonText(values.metadata_text, 'Metadata'),
              tags: normalizeTags(values.tags),
            };
            if (editing) {
              await updateAssetMachineScript({
                id: editing.id,
                ...payload,
              });
              message.success('机器脚本已更新。');
            } else {
              await createAssetMachineScript(payload);
              message.success('机器脚本已创建。');
            }
            setOpen(false);
            setEditing(null);
            actionRef.current?.reload();
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      />

      <Modal
        title={`批量更新 ${selectedIds.length} 个脚本状态`}
        open={batchStatusOpen}
        destroyOnHidden
        confirmLoading={saving}
        onCancel={() => {
          setBatchStatusOpen(false);
          batchStatusForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await batchStatusForm.validateFields();
            setSaving(true);
            const response = await batchUpdateAssetMachineScriptStatus({
              ids: selectedIds,
              status: values.status,
            });
            setBatchStatusOpen(false);
            batchStatusForm.resetFields();
            handleBatchMutationResult('批量更新脚本状态', response.data);
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form form={batchStatusForm} layout="vertical">
          <Form.Item
            name="status"
            label="状态"
            rules={[{ required: true, message: '请选择状态。' }]}
          >
            <Select
              options={[
                { label: '启用', value: 'active' },
                { label: '停用', value: 'disabled' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={runningScript ? `执行脚本：${runningScript.name}` : '执行机器脚本'}
        open={runOpen}
        destroyOnHidden
        confirmLoading={saving}
        onCancel={() => {
          setRunOpen(false);
          setRunningScript(null);
          runForm.resetFields();
        }}
        onOk={async () => {
          if (!runningScript) {
            return;
          }
          try {
            const values = await runForm.validateFields();
            setSaving(true);
            const response = await runAssetMachineScript({
              script_name: runningScript.name,
              machine_ids: values.machine_ids || [],
              timeout_seconds: values.timeout_seconds,
              port: values.port,
            });
            setRunOpen(false);
            setRunningScript(null);
            runForm.resetFields();
            onTaskAck(response.data, `脚本「${runningScript.name}」执行任务已提交。`);
          } catch (error: any) {
            message.error(normalizeDevErrorMessage(error));
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form<MachineScriptRunFormValues> form={runForm} layout="vertical">
          <Form.Item
            name="machine_ids"
            label="目标机器"
            rules={[{ required: true, message: '请选择目标机器。' }]}
          >
            <Select
              mode="multiple"
              showSearch
              loading={loadingMachines}
              optionFilterProp="label"
              maxTagCount="responsive"
              options={machineOptions.map((item) => ({
                label: `${item.name || item.machine_id || `Machine #${item.id}`} (${item.machine_id || item.id})`,
                value: item.id,
              }))}
            />
          </Form.Item>
          <Form.Item name="timeout_seconds" label="超时时间（秒）">
            <InputNumber min={1} max={1800} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="port" label="SSH 端口">
            <InputNumber min={1} max={65535} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detail ? `脚本详情 #${detail.id}` : '机器脚本详情'}
        open={Boolean(detail)}
        width={960}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={2} title="基本信息">
              <Descriptions.Item label="名称">
                {detail.name}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getScriptStatusColor(detail.status)}>
                  {detail.status === 'active' ? '启用' : '停用'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="说明" span={2}>
                {detail.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {formatText(detail.created_by)}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatTime(detail.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间" span={2}>
                {formatTime(detail.updated_at)}
              </Descriptions.Item>
            </Descriptions>
            <JsonBlock title="tags" value={detail.tags} />
            <JsonBlock title="metadata" value={detail.metadata} />
            <JsonBlock title="content" value={detail.content || ''} />
          </Space>
        ) : null}
      </Drawer>
    </>
  );
};

export default MachineScriptsPanel;
