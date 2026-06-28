import {
  App,
  Button,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import {
  batchCreateNodeUsers,
  batchDeleteNodeUsers,
  batchUpdateNodeUsers,
  createNodeUser,
  deleteNodeUser,
  getNodeUserClientConfig,
  getUserClientConfigs,
  listNodeUsers,
  updateNodeUser,
} from '@/services/node-control/api';
import { NodeControlConfigError } from '@/services/node-control/request';
import NodeUserClientConfigModal from './NodeUserClientConfigModal';
import NodeUserClientConfigsModal from './NodeUserClientConfigsModal';
import UnitNumberInput, { speedLimitUnits } from './UnitNumberInput';

const { Text } = Typography;

type EditableUserRow = {
  key: string;
  user_id?: number;
  uuid?: string;
  speed_limit?: number;
  ip_limit?: number;
  status?: string;
  isNew?: boolean;
  dirty?: boolean;
};

const defaultStatusOptions = [
  { label: 'active', value: 'active' },
  { label: 'disabled', value: 'disabled' },
];

const normalizeRows = (rows: API.ControlNodeUser[]): EditableUserRow[] =>
  rows.map((item) => ({
    key: String(item.user_id),
    user_id: item.user_id,
    uuid: item.uuid,
    speed_limit: item.speed_limit ?? 0,
    ip_limit: item.ip_limit ?? 0,
    status: item.status ?? 'active',
    isNew: false,
    dirty: false,
  }));

const NodeUsersManageModal: React.FC<{
  open: boolean;
  nodeId?: number;
  nodeTag?: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => Promise<void> | void;
}> = ({ open, nodeId, nodeTag, onOpenChange, onSuccess }) => {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<EditableUserRow[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [clientConfigOpen, setClientConfigOpen] = useState(false);
  const [clientConfigLoading, setClientConfigLoading] = useState(false);
  const [clientConfig, setClientConfig] = useState<API.ControlNodeUserClientConfig | null>(null);
  const [clientConfigsOpen, setClientConfigsOpen] = useState(false);
  const [clientConfigsLoading, setClientConfigsLoading] = useState(false);
  const [clientConfigs, setClientConfigs] = useState<API.ControlUserClientConfigsResponse | null>(null);

  const loadUsers = async () => {
    if (!nodeId) return;
    setLoading(true);
    try {
      const response = await listNodeUsers(nodeId, { page: 1, page_size: 500 });
      if (response.code !== 0) {
        message.error(response.message || 'Failed to load users.');
        return;
      }
      setRows(normalizeRows(response.data.items ?? []));
      setSelectedUserIds([]);
    } catch (error: any) {
      message.error(error?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !nodeId) {
      setRows([]);
      setSelectedUserIds([]);
      setClientConfig(null);
      setClientConfigOpen(false);
      setClientConfigs(null);
      setClientConfigsOpen(false);
      return;
    }
    void loadUsers();
  }, [nodeId, open]);

  const existingRows = useMemo(() => rows.filter((item) => !item.isNew), [rows]);
  const newRows = useMemo(() => rows.filter((item) => item.isNew), [rows]);

  const updateRow = (key: string, patch: Partial<EditableUserRow>) => {
    setRows((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              ...patch,
              dirty: item.isNew ? true : patch.dirty ?? true,
            }
          : item,
      ),
    );
  };

  const addRow = () => {
    const key = `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setRows((current) => [
      ...current,
      {
        key,
        speed_limit: 0,
        ip_limit: 0,
        status: 'active',
        isNew: true,
        dirty: true,
      },
    ]);
  };

  const removeLocalNewRow = (key: string) => {
    setRows((current) => current.filter((item) => item.key !== key));
  };

  const validateRow = (row: EditableUserRow) => {
    if (!row.user_id || row.user_id <= 0) {
      throw new Error('User ID is required.');
    }
    if (!row.uuid?.trim()) {
      throw new Error(`User ${row.user_id} credential is required.`);
    }
    if (!row.status) {
      throw new Error(`User ${row.user_id} status is required.`);
    }
  };

  const handleBatchCreate = async () => {
    if (!nodeId) return;
    const payloadRows = newRows.map((item) => {
      validateRow(item);
      return {
        user_id: Number(item.user_id),
        uuid: item.uuid!.trim(),
        speed_limit: Number(item.speed_limit ?? 0),
        ip_limit: Number(item.ip_limit ?? 0),
        status: item.status || 'active',
      };
    });
    if (!payloadRows.length) {
      message.warning('No new users to create.');
      return;
    }
    setSaving(true);
    try {
      const response = await batchCreateNodeUsers(nodeId, { users: payloadRows });
      if (response.code !== 0) {
        message.error(response.message || 'Batch create failed.');
        return;
      }
      message.success(`Created ${payloadRows.length} users.`);
      await loadUsers();
      await onSuccess?.();
    } catch (error: any) {
      message.error(
        error instanceof NodeControlConfigError
          ? error.message
          : error?.message || 'Batch create failed.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBatchUpdate = async () => {
    if (!nodeId) return;
    const payloadRows = existingRows
      .filter((item) => item.dirty)
      .map((item) => {
        validateRow(item);
        return {
          user_id: Number(item.user_id),
          uuid: item.uuid?.trim(),
          speed_limit: Number(item.speed_limit ?? 0),
          ip_limit: Number(item.ip_limit ?? 0),
          status: item.status || 'active',
        };
      });
    if (!payloadRows.length) {
      message.warning('No modified users to update.');
      return;
    }
    setSaving(true);
    try {
      const response = await batchUpdateNodeUsers(nodeId, { users: payloadRows });
      if (response.code !== 0) {
        message.error(response.message || 'Batch update failed.');
        return;
      }
      message.success(`Updated ${payloadRows.length} users.`);
      await loadUsers();
      await onSuccess?.();
    } catch (error: any) {
      message.error(
        error instanceof NodeControlConfigError
          ? error.message
          : error?.message || 'Batch update failed.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleBatchDelete = async () => {
    if (!nodeId) return;
    if (!selectedUserIds.length) {
      message.warning('Select users to delete.');
      return;
    }
    setSaving(true);
    try {
      const response = await batchDeleteNodeUsers(nodeId, { user_ids: selectedUserIds });
      if (response.code !== 0) {
        message.error(response.message || 'Batch delete failed.');
        return;
      }
      message.success(`Deleted ${selectedUserIds.length} users.`);
      await loadUsers();
      await onSuccess?.();
    } catch (error: any) {
      message.error(
        error instanceof NodeControlConfigError
          ? error.message
          : error?.message || 'Batch delete failed.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSingleSave = async (row: EditableUserRow) => {
    if (!nodeId) return;
    validateRow(row);
    setSaving(true);
    try {
      const response = row.isNew
        ? await createNodeUser(nodeId, {
            user_id: Number(row.user_id),
            uuid: row.uuid!.trim(),
            speed_limit: Number(row.speed_limit ?? 0),
            ip_limit: Number(row.ip_limit ?? 0),
            status: row.status || 'active',
          })
        : await updateNodeUser(nodeId, Number(row.user_id), {
            uuid: row.uuid!.trim(),
            speed_limit: Number(row.speed_limit ?? 0),
            ip_limit: Number(row.ip_limit ?? 0),
            status: row.status || 'active',
          });
      if (response.code !== 0) {
        message.error(response.message || 'Save failed.');
        return;
      }
      message.success(row.isNew ? 'User created.' : 'User updated.');
      await loadUsers();
      await onSuccess?.();
    } catch (error: any) {
      message.error(
        error instanceof NodeControlConfigError ? error.message : error?.message || 'Save failed.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSingleDelete = async (row: EditableUserRow) => {
    if (!nodeId || !row.user_id) return;
    setSaving(true);
    try {
      const response = await deleteNodeUser(nodeId, Number(row.user_id));
      if (response.code !== 0) {
        message.error(response.message || 'Delete failed.');
        return;
      }
      message.success('User deleted.');
      await loadUsers();
      await onSuccess?.();
    } catch (error: any) {
      message.error(
        error instanceof NodeControlConfigError
          ? error.message
          : error?.message || 'Delete failed.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleGetClientConfig = async (row: EditableUserRow) => {
    if (!nodeId || !row.user_id) {
      return;
    }
    setClientConfigLoading(true);
    setClientConfigOpen(true);
    try {
      const response = await getNodeUserClientConfig(nodeId, Number(row.user_id));
      if (response.code !== 0) {
        message.error(response.message || 'Failed to load client config.');
        setClientConfig(null);
        return;
      }
      setClientConfig(response.data);
    } catch (error: any) {
      setClientConfig(null);
      message.error(
        error instanceof NodeControlConfigError
          ? error.message
          : error?.message || 'Failed to load client config.',
      );
    } finally {
      setClientConfigLoading(false);
    }
  };

  const handleGetUserClientConfigs = async (row: EditableUserRow) => {
    if (!row.user_id) {
      return;
    }
    setClientConfigsLoading(true);
    setClientConfigsOpen(true);
    try {
      const response = await getUserClientConfigs(Number(row.user_id));
      if (response.code !== 0) {
        message.error(response.message || 'Failed to load client configs.');
        setClientConfigs(null);
        return;
      }
      setClientConfigs(response.data);
    } catch (error: any) {
      setClientConfigs(null);
      message.error(
        error instanceof NodeControlConfigError
          ? error.message
          : error?.message || 'Failed to load client configs.',
      );
    } finally {
      setClientConfigsLoading(false);
    }
  };

  return (
    <>
      <Modal
        title={nodeId ? `Manage Node Users ${nodeTag ? `(${nodeTag})` : `#${nodeId}`}` : 'Manage Node Users'}
        open={open}
        width={1120}
        destroyOnHidden
        onCancel={() => onOpenChange(false)}
        footer={[
          <Button key="close" onClick={() => onOpenChange(false)}>
            Close
          </Button>,
        ]}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Button onClick={addRow}>Add Row</Button>
            <Button type="primary" loading={saving} onClick={() => void handleBatchCreate()}>
              Batch Create
            </Button>
            <Button loading={saving} onClick={() => void handleBatchUpdate()}>
              Batch Update
            </Button>
            <Popconfirm
              title="Delete selected users?"
              onConfirm={() => void handleBatchDelete()}
              disabled={!selectedUserIds.length}
            >
              <Button danger disabled={!selectedUserIds.length} loading={saving}>
                Batch Delete
              </Button>
            </Popconfirm>
          </Space>
          <Text type="secondary">
            Existing: {existingRows.length} | New: {newRows.length} | Selected: {selectedUserIds.length}
          </Text>
        </Space>
        <Table<EditableUserRow>
          rowKey="key"
          loading={loading}
          pagination={false}
          dataSource={rows}
          rowSelection={{
            selectedRowKeys: selectedUserIds.map(String),
            onChange: (keys, selectedRows) => {
              const next = selectedRows
                .filter((item) => !item.isNew && item.user_id !== undefined)
                .map((item) => Number(item.user_id));
              setSelectedUserIds(next);
            },
            getCheckboxProps: (record) => ({
              disabled: record.isNew || !record.user_id,
            }),
          }}
          columns={[
            {
              title: 'User ID',
              dataIndex: 'user_id',
              width: 120,
              render: (_, record) => (
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  disabled={!record.isNew}
                  value={record.user_id}
                  onChange={(value) => updateRow(record.key, { user_id: value ?? undefined })}
                />
              ),
            },
            {
              title: 'UUID / Credential',
              dataIndex: 'uuid',
              render: (_, record) => (
                <Input
                  value={record.uuid}
                  onChange={(event) => updateRow(record.key, { uuid: event.target.value })}
                />
              ),
            },
            {
              title: 'User Speed Limit',
              dataIndex: 'speed_limit',
              width: 220,
              render: (_, record) => (
                <UnitNumberInput
                  units={speedLimitUnits}
                  value={record.speed_limit}
                  onChange={(value) => updateRow(record.key, { speed_limit: value ?? 0 })}
                />
              ),
            },
            {
              title: 'IP Limit',
              dataIndex: 'ip_limit',
              width: 140,
              render: (_, record) => (
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  value={record.ip_limit}
                  onChange={(value) => updateRow(record.key, { ip_limit: value ?? 0 })}
                />
              ),
            },
            {
              title: 'Status',
              dataIndex: 'status',
              width: 140,
              render: (_, record) => (
                <Select
                  style={{ width: '100%' }}
                  options={defaultStatusOptions}
                  value={record.status}
                  onChange={(value) => updateRow(record.key, { status: value })}
                />
              ),
            },
            {
              title: 'Actions',
              width: 240,
              render: (_, record) => (
                <Space>
                  <a onClick={() => void handleSingleSave(record)}>
                    {record.isNew ? 'Create' : 'Save'}
                  </a>
                  {!record.isNew ? (
                    <>
                      <a onClick={() => void handleGetClientConfig(record)}>Get Config</a>
                      <a onClick={() => void handleGetUserClientConfigs(record)}>All Configs</a>
                    </>
                  ) : null}
                  {record.isNew ? (
                    <a onClick={() => removeLocalNewRow(record.key)}>Remove</a>
                  ) : (
                    <Popconfirm title="Delete this user?" onConfirm={() => void handleSingleDelete(record)}>
                      <a>Delete</a>
                    </Popconfirm>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Modal>
      <NodeUserClientConfigModal
        open={clientConfigOpen}
        loading={clientConfigLoading}
        value={clientConfig}
        onOpenChange={(nextOpen) => {
          setClientConfigOpen(nextOpen);
          if (!nextOpen) {
            setClientConfig(null);
          }
        }}
      />
      <NodeUserClientConfigsModal
        open={clientConfigsOpen}
        loading={clientConfigsLoading}
        value={clientConfigs}
        onOpenChange={(nextOpen) => {
          setClientConfigsOpen(nextOpen);
          if (!nextOpen) {
            setClientConfigs(null);
          }
        }}
      />
    </>
  );
};

export default NodeUsersManageModal;
