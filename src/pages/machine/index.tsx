import type {
  ActionType,
  ProColumns,
  ProDescriptionsItemProps,
} from '@ant-design/pro-components';
import {
  FooterToolbar,
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { useRequest } from '@umijs/max';
import { Button, Drawer, Tooltip, message } from 'antd';
import { DeleteOutlined, EditOutlined, LinkOutlined } from '@ant-design/icons';
import React, { useCallback, useRef, useState } from 'react';
import {
  getMachineList,
  deleteMachine,
  batchDeleteMachines,
  testMachineConnection,
} from '@/services/swagger/machine';
import CreateForm from './components/CreateForm';
import UpdateForm from './components/UpdateForm';

const MachineList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.Machine>();
  const [selectedRowsState, setSelectedRows] = useState<API.Machine[]>([]);

  const [messageApi, contextHolder] = message.useMessage();

  const { run: delRun } = useRequest(deleteMachine, {
    manual: true,
    onSuccess: () => {
      setSelectedRows([]);
      actionRef.current?.reloadAndRest?.();
      messageApi.success('Machine deleted successfully');
    },
    onError: () => {
      messageApi.error('Delete failed, please try again');
    },
  });

  const { run: batchDelRun, loading: batchDeleteLoading } = useRequest(
    batchDeleteMachines,
    {
      manual: true,
      onSuccess: () => {
        setSelectedRows([]);
        actionRef.current?.reloadAndRest?.();
        messageApi.success('Batch delete completed successfully');
      },
      onError: () => {
        messageApi.error('Batch delete failed, please try again');
      },
    },
  );

  const { run: testConnRun } = useRequest(testMachineConnection, {
    manual: true,
    formatResult: (res: any) => res,
    onSuccess: (res: any) => {
      if (res?.code === 0) {
        messageApi.success('Connection test successful');
      } else {
        messageApi.error(res?.msg || 'Connection test failed');
      }
    },
    onError: () => {
      messageApi.error('Connection test error');
    },
  });

  const columns: ProColumns<API.Machine>[] = [
    {
      title: 'Machine Name',
      dataIndex: 'name',
      render: (dom, entity) => (
        <a
          onClick={() => {
            setCurrentRow(entity);
            setShowDetail(true);
          }}
        >
          {dom}
        </a>
      ),
    },
    {
      title: 'Hostname',
      dataIndex: 'hostname',
      search: true,
    },
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      search: false,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      valueEnum: {
        online: { text: 'Online', status: 'Success' },
        offline: { text: 'Offline', status: 'Default' },
        error: { text: 'Error', status: 'Error' },
        maintenance: { text: 'Maintenance', status: 'Processing' },
      },
    },
    {
      title: 'OS Type',
      dataIndex: 'os_type',
      search: false,
    },
    {
      title: 'CPU Cores',
      dataIndex: 'cpu_cores',
      search: false,
    },
    {
      title: 'Memory',
      dataIndex: 'memory',
      search: false,
    },
    {
      title: 'Provider',
      dataIndex: 'provider',
      search: false,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      search: false,
      render: (_, record) => (record.price ? `$${record.price}` : '-'),
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      valueEnum: {
        1: { text: 'Active', status: 'Success' },
        0: { text: 'Inactive', status: 'Default' },
      },
    },
    {
      title: 'Operations',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <UpdateForm
          key="edit"
          trigger={
            <Tooltip title="Edit">
              <EditOutlined />
            </Tooltip>
          }
          onOk={actionRef.current?.reload}
          values={record}
        />,
        <Tooltip key="test" title="Test Connection">
          <LinkOutlined
            onClick={() => {
              if (record.id) {
                testConnRun({ id: record.id });
              } else {
                messageApi.error('Invalid machine id');
              }
            }}
            style={{ cursor: 'pointer', color: '#1890ff' }}
          />
        </Tooltip>,
        <Tooltip key="delete" title="Delete">
          <DeleteOutlined
            onClick={() => {
              if (record.id) {
                delRun({ id: record.id });
              } else {
                messageApi.error('Invalid machine id');
              }
            }}
            style={{ cursor: 'pointer', color: '#ff4d4f' }}
          />
        </Tooltip>,
      ],
    },
  ];

  const handleRemove = useCallback(
    async (selectedRows: API.Machine[]) => {
      if (!selectedRows?.length) {
        messageApi.warning('Please select machines to delete');
        return;
      }
      await batchDelRun({
        ids: selectedRows.map((row) => row.id).filter((id): id is number => typeof id === 'number'),
      });
    },
    [batchDelRun, messageApi],
  );

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<API.Machine>
        headerTitle="Machine Management"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <CreateForm key="create" reload={actionRef.current?.reload} />,
        ]}
        request={async (params) => {
          const res = await getMachineList({
            page: params.current || 1,
            pageSize: params.pageSize || 10,
            name: params.name,
            hostname: params.hostname,
            status: params.status,
          });
          return {
            data: res.data?.data || [],
            total: res.data?.total || 0,
            success: res.code === 0,
          };
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
      />

      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              Selected <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a> machines
            </div>
          }
        >
          <Button
            loading={batchDeleteLoading}
            onClick={() => {
              handleRemove(selectedRowsState);
            }}
            danger
          >
            Batch Delete
          </Button>
        </FooterToolbar>
      )}

      <Drawer
        width={600}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.name && (
          <ProDescriptions<API.Machine>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.id,
            }}
            columns={columns as ProDescriptionsItemProps<API.Machine>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default MachineList;
