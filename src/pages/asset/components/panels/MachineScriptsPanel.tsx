import { PlayCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Form,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
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

const MachineScriptsPanel: React.FC<{
  onTaskAck: TaskAckHandler;
}> = ({ onTaskAck }) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<API.AssetMachineScript | null>(null);
  const [detail, setDetail] = useState<API.AssetMachineScript | null>(null);
  const [runOpen, setRunOpen] = useState(false);
  const [runningScript, setRunningScript] = useState<API.AssetMachineScript | null>(
    null,
  );
  const [runForm] = Form.useForm<MachineScriptRunFormValues>();
  const [machineOptions, setMachineOptions] = useState<API.AssetMachine[]>([]);
  const [loadingMachines, setLoadingMachines] = useState(false);

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

  const columns: ProColumns<API.AssetMachineScript>[] = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 80 },
      { title: 'Name', dataIndex: 'name' },
      {
        title: 'Description',
        dataIndex: 'description',
        ellipsis: true,
        renderText: formatText,
      },
      {
        title: 'Status',
        dataIndex: 'status',
        render: (_, record) => (
          <Tag color={record.status === 'active' ? 'green' : 'default'}>
            {record.status || '-'}
          </Tag>
        ),
      },
      {
        title: 'Tags',
        dataIndex: 'tags',
        render: (_, record) =>
          record.tags?.length ? (
            <Space wrap>
              {record.tags.map((item) => (
                <Tag key={`${item.key}-${item.value}-${item.label || ''}`}>
                  {item.label || `${item.key}:${item.value}`}
                </Tag>
              ))}
            </Space>
          ) : (
            '-'
          ),
      },
      {
        title: 'Updated At',
        dataIndex: 'updated_at',
        renderText: formatTime,
      },
      {
        title: 'Actions',
        valueType: 'option',
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
            Detail
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
            Edit
          </a>,
          <a key="run" onClick={() => void openRunModal(record)}>
            Run
          </a>,
          <Popconfirm
            key="delete"
            title="Delete this script?"
            onConfirm={async () => {
              try {
                await deleteAssetMachineScript(record.id);
                message.success('Machine script deleted.');
                actionRef.current?.reload();
              } catch (error: any) {
                message.error(normalizeDevErrorMessage(error));
              }
            }}
          >
            <a>Delete</a>
          </Popconfirm>,
        ],
      },
    ],
    [message],
  );

  return (
    <>
      <ProTable<API.AssetMachineScript>
        rowKey="id"
        actionRef={actionRef}
        search={{
          labelWidth: 'auto',
        }}
        columns={[
          ...columns,
          {
            title: 'Name',
            dataIndex: 'name',
            hideInTable: true,
          },
          {
            title: 'Status',
            dataIndex: 'status',
            hideInTable: true,
            valueType: 'select',
            fieldProps: {
              options: [
                { label: 'active', value: 'active' },
                { label: 'disabled', value: 'disabled' },
              ],
            },
          },
          {
            title: 'Tag Key',
            dataIndex: 'tag_key',
            hideInTable: true,
          },
          {
            title: 'Tag Value',
            dataIndex: 'tag_value',
            hideInTable: true,
          },
        ]}
        request={async (params) => {
          try {
            const response = await listAssetMachineScripts({
              page: Number(params.current || 1),
              page_size: Number(params.pageSize || 10),
              name: params.name as string | undefined,
              status: params.status as string | undefined,
              tag_key: params.tag_key as string | undefined,
              tag_value: params.tag_value as string | undefined,
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
            New Script
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            Refresh
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
              message.success('Machine script updated.');
            } else {
              await createAssetMachineScript(payload);
              message.success('Machine script created.');
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
        title={
          runningScript ? `Run Script: ${runningScript.name}` : 'Run Machine Script'
        }
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
            onTaskAck(
              response.data,
              `Script "${runningScript.name}" execution submitted.`,
            );
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
            label="Target Machines"
            rules={[{ required: true, message: 'Please select target machines.' }]}
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
          <Form.Item name="timeout_seconds" label="Timeout Seconds">
            <InputNumber min={1} max={1800} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="port" label="SSH Port">
            <InputNumber min={1} max={65535} precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={detail ? `Script #${detail.id}` : 'Machine Script Detail'}
        open={Boolean(detail)}
        width={960}
        onClose={() => setDetail(null)}
      >
        {detail ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Name">
                {detail.name}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={detail.status === 'active' ? 'green' : 'default'}>
                  {detail.status || '-'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {detail.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {formatText(detail.created_by)}
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {formatTime(detail.created_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Updated At">
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
