import {
  CloudDownloadOutlined,
  DeleteOutlined,
  EditOutlined,
  LinkOutlined,
  SwapOutlined,
} from '@ant-design/icons';
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
import { App, Button, Drawer, Spin, Tooltip } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  batchDeleteMachines,
  deleteMachine,
  getMachineDetail,
  getMachineList,
  testMachineConnection,
} from '@/services/machine/api';
import { fetchProvider } from '@/services/provider/api';
import BatchDeployModal from './components/BatchDeployModal';
import SaveForm from './components/SaveForm';
import DeployModal from './components/DeployModal';
import ImportFromCloudModal from './components/ImportFromCloudModal';
import CreateFromCloudModal from './components/CreateFromCloudModal';
import SwitchIpModal from './components/SwitchIpModal';

const PAY_MODE_MAP: Record<number, string> = {
  1: 'Hourly',
  2: 'Daily',
  3: 'Monthly',
  4: 'Quarterly',
  5: 'Yearly',
  6: 'Once',
};

const MachineList: React.FC = () => {
  const { message: messageApi, modal } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.Machine>();
  const [selectedRowsState, setSelectedRows] = useState<API.Machine[]>([]);
  const [providerOptions, setProviderOptions] = useState<
    Array<{ label: string; value: number }>
  >([]);
  const [testingMachineId, setTestingMachineId] = useState<number | null>(null);
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [selectedDeployMachine, setSelectedDeployMachine] = useState<
    API.Machine | undefined
  >();
  const [batchDeployOpen, setBatchDeployOpen] = useState(false);
  const [importCloudOpen, setImportCloudOpen] = useState(false);
  const [createCloudOpen, setCreateCloudOpen] = useState(false);

  // 加载供应商列表
  useEffect(() => {
    fetchProvider({ current: 1, pageSize: 1000 }).then((res) => {
      if (res.code === 0 && res.data?.data) {
        setProviderOptions(
          res.data.data.map((item) => ({ label: item.name, value: item.id })),
        );
      }
    });
  }, []);

  const { run: delRun } = useRequest(deleteMachine, {
    manual: true,
    formatResult: (res: any) => res,
    onSuccess: (res: any) => {
      if (res?.code === 0) {
        setSelectedRows([]);
        actionRef.current?.reloadAndRest?.();
        messageApi.success('Machine deleted successfully');
      } else {
        messageApi.error(res?.msg || 'Delete failed');
      }
    },
    onError: () => {
      messageApi.error('Delete failed, please try again');
    },
  });

  const { run: batchDelRun, loading: batchDeleteLoading } = useRequest(
    batchDeleteMachines,
    {
      manual: true,
      formatResult: (res: any) => res,
      onSuccess: (res: any) => {
        if (res?.code === 0) {
          setSelectedRows([]);
          actionRef.current?.reloadAndRest?.();
          messageApi.success('Batch delete completed successfully');
        } else {
          messageApi.error(res?.msg || 'Batch delete failed');
        }
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
        actionRef.current?.reload?.();
      } else {
        messageApi.error(res?.msg || 'Connection test failed');
      }
      setTestingMachineId(null);
    },
    onError: () => {
      messageApi.error('Connection test error');
      setTestingMachineId(null);
    },
  });

  // 供应商ID → 名称 映射函数
  const getProviderName = useCallback(
    (id?: number) => {
      if (id === undefined || id === null) return '-';
      const found = providerOptions.find((p) => p.value === id);
      return found?.label || String(id);
    },
    [providerOptions],
  );

  const columns: ProColumns<API.Machine>[] = [
    {
      title: 'Machine Name',
      dataIndex: 'name',
      render: (dom, entity) => (
        <a
          onClick={async () => {
            if (entity.id) {
              const res = await getMachineDetail({ id: entity.id });
              if (res.code === 0 && res.data) {
                setCurrentRow(res.data);
                setShowDetail(true);
              } else {
                messageApi.error(res.msg || 'Failed to get detail');
              }
            }
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
        online: { text: '', status: 'Success' },
        offline: { text: '', status: 'Default' },
        error: { text: '', status: 'Error' },
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
      render: (_, record) => getProviderName(record.provider),
    },
    // {
    //   title: 'Price',
    //   dataIndex: 'price',
    //   search: false,
    //   render: (_, record) => (record.price ? `$${record.price}` : '-'),
    // },
    // {
    //   title: 'Pay Mode',
    //   dataIndex: 'pay_mode',
    //   search: false,
    //   render: (_, record) =>
    //     record.pay_mode
    //       ? PAY_MODE_MAP[record.pay_mode] || record.pay_mode
    //       : '-',
    // },
    {
      title: 'Tags',
      dataIndex: 'tags',
      search: true,
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      search: false,
      render: (_, record) => (record.is_active ? 'Active' : 'Inactive'),
    },
    {
      title: 'Operations',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <SaveForm
          key="edit"
          trigger={
            <Tooltip title="Edit">
              <EditOutlined />
            </Tooltip>
          }
          mode="update"
          onOk={actionRef.current?.reload}
          values={record}
          providerOptions={providerOptions}
        />,
        <Tooltip key="test" title="Test Connection">
          <Spin size="small" spinning={testingMachineId === record.id}>
            <LinkOutlined
              onClick={() => {
                if (record.id) {
                  setTestingMachineId(record.id);
                  testConnRun({ id: record.id });
                } else {
                  messageApi.error('Invalid machine id');
                }
              }}
              style={{ cursor: 'pointer', color: '#1890ff' }}
            />
          </Spin>
        </Tooltip>,
        <SwitchIpModal
          key="switch-ip"
          trigger={
            <Tooltip title="Switch IP">
              <SwapOutlined style={{ cursor: 'pointer', color: '#722ed1' }} />
            </Tooltip>
          }
          machine={record}
          onSuccess={() => actionRef.current?.reload?.()}
        />,
        // <Tooltip key="deploy" title="Deploy">
        //   <Button
        //     type="link"
        //     size="small"
        //     onClick={() => {
        //       if (record.id) {
        //         setSelectedDeployMachine(record);
        //         setDeployModalOpen(true);
        //       } else {
        //         messageApi.error('Invalid machine id');
        //       }
        //     }}
        //     style={{ color: '#52c41a', padding: 0 }}
        //   >
        //     部署
        //   </Button>
        // </Tooltip>,
        <Tooltip key="delete" title="Delete">
          <DeleteOutlined
            onClick={() => {
              modal.confirm({
                title: `Are you sure to delete machine "${record.name}"?`,
                onOk: () => {
                  if (record.id) {
                    delRun({ id: record.id });
                  } else {
                    messageApi.error('Invalid machine id');
                  }
                },
              });
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
      modal.confirm({
        title: `Are you sure to delete ${selectedRows.length} selected machines?`,
        onOk: async () => {
          await batchDelRun({
            ids: selectedRows
              .map((row) => row.id)
              .filter((id): id is number => typeof id === 'number'),
          });
        },
      });
    },
    [batchDelRun, messageApi],
  );

  return (
    <PageContainer>
      <ProTable<API.Machine>
        headerTitle="Machine Management"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ y: 600 }}
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="importCloud"
            icon={<CloudDownloadOutlined />}
            onClick={() => setImportCloudOpen(true)}
          >
            从云端导入
          </Button>,
          <Button key="createCloud" onClick={() => setCreateCloudOpen(true)}>
            云端创建
          </Button>,
          <SaveForm
            key="create"
            mode="create"
            reload={actionRef.current?.reload}
            providerOptions={providerOptions}
          />,
        ]}
        request={async (params) => {
          const res = await getMachineList({
            page: params.current || 1,
            pageSize: params.pageSize || 10,
            name: params.name,
            hostname: params.hostname,
            status: params.status,
            tags: params.tags,
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
              Selected{' '}
              <a style={{ fontWeight: 600 }}>{selectedRowsState.length}</a>{' '}
              machines
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
          <Button
            type="primary"
            onClick={() => setBatchDeployOpen(true)}
            disabled={selectedRowsState.length === 0}
          >
            批量部署 ({selectedRowsState.length})
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

      <DeployModal
        open={deployModalOpen}
        machine={selectedDeployMachine}
        onClose={() => {
          setDeployModalOpen(false);
          setSelectedDeployMachine(undefined);
        }}
        onSuccess={() => actionRef.current?.reload()}
      />

      <BatchDeployModal
        open={batchDeployOpen}
        machines={selectedRowsState}
        onClose={() => setBatchDeployOpen(false)}
        onSuccess={() => {
          setBatchDeployOpen(false);
          setSelectedRows([]);
          actionRef.current?.reload();
        }}
      />

      <ImportFromCloudModal
        open={importCloudOpen}
        providerOptions={providerOptions}
        onClose={() => setImportCloudOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />

      <CreateFromCloudModal
        open={createCloudOpen}
        providerOptions={providerOptions}
        onClose={() => setCreateCloudOpen(false)}
        onSuccess={() => actionRef.current?.reload()}
      />
    </PageContainer>
  );
};

export default MachineList;
