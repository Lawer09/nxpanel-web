import React, { useRef, useState } from 'react';
import { PageContainer, type ProColumns, ProTable, type ActionType } from '@ant-design/pro-components';
import { history } from '@umijs/max';
import { App, AutoComplete, Button, Form, Input, Modal, Select, Space, Tag, Typography } from 'antd';
import {
  CheckCircleOutlined,
  InboxOutlined,
  PlusOutlined,
  StopOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  batchUpdateProjectAdStatus,
  batchUpdateProjectAppPlatform,
  batchUpdateProjectDepartment,
  getProjectDepartments,
  getProjects,
  updateProject,
  updateProjectStatus,
} from '@/services/project/api';
import type { ProjectFetchRequest, ProjectItem } from '@/services/project/types';
import { formatUTC8 } from '@/utils/format';
import ProjectTableForm from './components/ProjectTableForm';
import ProjectTableDetailDrawer from './components/ProjectTableDetailDrawer';
import ProjectBatchImportModal from './components/ProjectBatchImportModal';
import ProjectSyncModal from './components/ProjectSyncModal';
import ProjectVersionImportModal from './components/ProjectVersionImportModal';
import ProjectVersionRecords from './components/ProjectVersionRecords';
import { PROJECT_TABLE_FIELDS } from './fields';
import { PROJECT_APP_PLATFORM_OPTIONS, PROJECT_AD_STATUS_OPTIONS } from '@/pages/project/constants';
import { buildProjectTrendSearch, PROJECT_TREND_DASHBOARD_PATH } from '@/pages/report/project-trend/utils';

const { Text } = Typography;
type BatchFieldType = 'adStatus' | 'appPlatform' | 'department';
type EditableProjectTextField = 'ownerName' | 'department';

const renderStatus = (status?: string) => {
  switch (status) {
    case 'active':
      return <Tag color="success">启用</Tag>;
    case 'inactive':
      return <Tag color="default">停用</Tag>;
    case 'archived':
      return <Tag color="#595959">已归档</Tag>;
    default:
      return status ? <Tag>{status}</Tag> : '-';
  }
};

const countEnabled = (items?: { enabled: number }[]) => {
  const total = items?.length ?? 0;
  const enabled = items?.filter((item) => item.enabled === 1).length ?? 0;
  return `${enabled} / ${total}`;
};

const normalizeBatchValue = (value?: string | null) => {
  if (value === undefined || value === null) return null;
  return value.trim() === '' ? null : value;
};

interface AdStatusModalEditorProps {
  record: ProjectItem;
  onSaved: (record: ProjectItem, adStatus: string | null) => void;
}

const AdStatusModalEditor: React.FC<AdStatusModalEditorProps> = ({
  record,
  onSaved,
}) => {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(record.adStatus ?? '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setValue(record.adStatus ?? '');
    }
  }, [open, record.adStatus]);

  const save = async () => {
    const normalized = normalizeBatchValue(value);
    const current = record.adStatus ?? null;
    if (normalized === current) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      await updateProject({ id: record.id, adStatus: normalized });
      message.success('投放状态已更新');
      onSaved(record, normalized);
      setOpen(false);
    } catch (_error) {
      setValue(record.adStatus ?? '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <a
        onClick={() => setOpen(true)}
        style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
      >
        {record.adStatus || '设置'}
      </a>
      <Modal
        title="修改投放状态"
        open={open}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
        onOk={() => void save()}
        onCancel={() => {
          if (saving) return;
          setOpen(false);
          setValue(record.adStatus ?? '');
        }}
      >
        <Form layout="vertical">
          <Form.Item label="投放状态">
            <AutoComplete
              allowClear
              value={value}
              options={PROJECT_AD_STATUS_OPTIONS}
              placeholder="选择或输入投放状态；清空后保存将清空投放状态"
              onChange={(nextValue) => setValue(nextValue)}
              filterOption={(inputValue, option) =>
                `${option?.value ?? ''}`.toLowerCase().includes(inputValue.toLowerCase())
              }
            >
              <Input
                onPressEnter={() => {
                  void save();
                }}
              />
            </AutoComplete>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

interface ProjectTextFieldModalEditorProps {
  record: ProjectItem;
  field: EditableProjectTextField;
  label: string;
  options?: Array<{ label: string; value: string }>;
  onOpen?: () => void;
  onSaved: (
    record: ProjectItem,
    field: EditableProjectTextField,
    value: string | null,
  ) => void;
}

const ProjectTextFieldModalEditor: React.FC<ProjectTextFieldModalEditorProps> = ({
  record,
  field,
  label,
  options,
  onOpen,
  onSaved,
}) => {
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(record[field] ?? '');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!open) {
      setValue(record[field] ?? '');
    }
  }, [field, open, record]);

  const openModal = () => {
    onOpen?.();
    setOpen(true);
  };

  const save = async () => {
    const normalized = normalizeBatchValue(value);
    const current = record[field] ?? null;
    if (normalized === current) {
      setOpen(false);
      return;
    }

    setSaving(true);
    try {
      const payload: Pick<ProjectItem, 'id'> &
        Partial<Record<EditableProjectTextField, string | null>> = {
        id: record.id,
        [field]: normalized,
      };
      await updateProject(payload);
      message.success(`${label}已更新`);
      onSaved(record, field, normalized);
      setOpen(false);
    } catch (_error) {
      setValue(record[field] ?? '');
    } finally {
      setSaving(false);
    }
  };

  const editor = options ? (
    <AutoComplete
      allowClear
      value={value}
      options={options}
      placeholder={`选择或输入${label}；清空后保存将清空${label}`}
      onChange={(nextValue) => setValue(nextValue)}
      filterOption={(inputValue, option) =>
        `${option?.value ?? ''}`.toLowerCase().includes(inputValue.toLowerCase())
      }
    >
      <Input
        onPressEnter={() => {
          void save();
        }}
      />
    </AutoComplete>
  ) : (
    <Input
      allowClear
      value={value}
      placeholder={`请输入${label}；清空后保存将清空${label}`}
      onChange={(event) => setValue(event.target.value)}
      onPressEnter={() => {
        void save();
      }}
    />
  );

  return (
    <>
      <a onClick={openModal} style={{ textDecoration: 'none' }}>
        {record[field] || '设置'}
      </a>
      <Modal
        title={`修改${label}`}
        open={open}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
        onOk={() => void save()}
        onCancel={() => {
          if (saving) return;
          setOpen(false);
          setValue(record[field] ?? '');
        }}
      >
        <Form layout="vertical">
          <Form.Item label={label}>{editor}</Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const ProjectTablePage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [batchForm] = Form.useForm<{ adStatus?: string | null; appPlatform?: string | null; department?: string | null }>();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<ProjectItem | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState('detail');
  const [selectedRows, setSelectedRows] = useState<ProjectItem[]>([]);
  const [batchModalType, setBatchModalType] = useState<BatchFieldType | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [departmentOptionsLoaded, setDepartmentOptionsLoaded] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [versionImportOpen, setVersionImportOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);

  const reloadTable = () => {
    actionRef.current?.reload();
  };

  const handleStatusChange = (record: ProjectItem, status: ProjectItem['status']) => {
    Modal.confirm({
      title: '确认更新状态',
      content: `确定将项目 ${record.projectName} 的状态更新为 ${status} 吗？`,
      onOk: async () => {
        await updateProjectStatus({ id: record.id, status });
        message.success('状态更新成功');
        if (detailProject?.id === record.id) {
          setDetailProject({ ...detailProject, status });
        }
        reloadTable();
      },
    });
  };

  const openEdit = (record: ProjectItem) => {
    setEditingProject(record);
    setFormOpen(true);
  };

  const openDetail = (record: ProjectItem, activeTab = 'detail') => {
    setDetailProject(record);
    setDetailActiveTab(activeTab);
    setDetailOpen(true);
  };

  const jumpToProjectTrend = (record: ProjectItem) => {
    if (!record.projectCode) return;
    const search = buildProjectTrendSearch({
      projectCode: record.projectCode,
      adStatus: record.adStatus || undefined,
      from: 'project-table',
    });
    history.push(`${PROJECT_TREND_DASHBOARD_PATH}?${search}`);
  };

  const renderResourceCount = (
    record: ProjectItem,
    field: 'trafficAccounts' | 'adAccounts' | 'userApps',
    activeTab: string,
  ) => (
    <a onClick={() => openDetail(record, activeTab)}>
      {countEnabled(record[field])}
    </a>
  );

  const handleAdStatusSaved = (record: ProjectItem, adStatus: string | null) => {
    if (detailProject?.id === record.id) {
      setDetailProject({ ...detailProject, adStatus });
    }
    reloadTable();
  };

  const ensureDepartmentOptions = () => {
    if (departmentOptionsLoaded) return;
    void (async () => {
      const res = await getProjectDepartments();
      const rows = Array.isArray(res.data) ? res.data : [];
      setDepartmentOptions(rows.filter(Boolean).map((item) => ({ label: item, value: item })));
      setDepartmentOptionsLoaded(true);
    })();
  };

  const handleTextFieldSaved = (
    record: ProjectItem,
    field: EditableProjectTextField,
    value: string | null,
  ) => {
    if (detailProject?.id === record.id) {
      setDetailProject({ ...detailProject, [field]: value });
    }
    reloadTable();
  };

  const openBatchModal = (type: BatchFieldType) => {
    batchForm.resetFields();
    setBatchModalType(type);
    if (type === 'department' && !departmentOptionsLoaded) {
      ensureDepartmentOptions();
    }
  };

  const handleBatchUpdate = async () => {
    const ids = selectedRows.map((row) => row.id);
    if (!ids.length) {
      message.warning('请先选择项目');
      return false;
    }
    if (ids.length > 500) {
      message.warning('单次最多选择 500 个项目');
      return false;
    }

    const values = await batchForm.validateFields();
    setBatchLoading(true);
    try {
      if (!batchModalType) {
        return false;
      }

      const nextValue = normalizeBatchValue(values[batchModalType]);
      const res =
        batchModalType === 'adStatus'
          ? await batchUpdateProjectAdStatus({
              ids,
              adStatus: nextValue,
            })
          : batchModalType === 'appPlatform'
            ? await batchUpdateProjectAppPlatform({
              ids,
              appPlatform: nextValue,
            })
            : await batchUpdateProjectDepartment({
              ids,
              department: nextValue,
            });
      const result = res.data;
      const missingIds = result?.missingIds ?? [];
      const requested = result?.requested ?? ids.length;
      const updated = result?.updated ?? ids.length;
      const missingText = missingIds.length ? `，缺失 ${missingIds.length} 个` : '';
      message.success(`批量更新完成，请求 ${requested} 个，更新 ${updated} 个${missingText}`);
      setBatchModalType(null);
      if (detailProject && ids.includes(detailProject.id)) {
        setDetailProject({ ...detailProject, [batchModalType]: nextValue });
      }
      setSelectedRows([]);
      batchForm.resetFields();
      reloadTable();
      return true;
    } finally {
      setBatchLoading(false);
    }
  };

  const columns: ProColumns<ProjectItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      search: false,
      fixed: 'left',
    },
    {
      title: '代号',
      dataIndex: 'projectCode',
      width: 90,
      search: false,
      fixed: 'left',
      ellipsis: true,
      render: (_, record) =>
        record.projectCode ? <a onClick={() => jumpToProjectTrend(record)}>{record.projectCode}</a> : '-',
    },
    {
      title: '名称',
      dataIndex: 'projectName',
      width: 90,
      search: false,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '流量账号',
      dataIndex: 'trafficAccounts',
      width: 80,
      search: false,
      fixed: 'left',
      render: (_, record) => renderResourceCount(record, 'trafficAccounts', 'traffic'),
    },
    {
      title: '广告账号',
      dataIndex: 'adAccounts',
      width: 80,
      search: false,
      fixed: 'left',
      render: (_, record) => renderResourceCount(record, 'adAccounts', 'ad'),
    },
    {
      title: '用户 App',
      dataIndex: 'userApps',
      width: 80,
      search: false,
      fixed: 'left',
      render: (_, record) => renderResourceCount(record, 'userApps', 'app'),
    },
    {
      title: '关键字',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '项目代号 / 项目名称 / 包名 ',
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 60,
      valueType: 'select',
      valueEnum: {
        active: { text: '启用' },
        inactive: { text: '停用' },
        archived: { text: '已归档' },
      },
      render: (_, record) => renderStatus(record.status),
    },
    {
      title: '投放状态',
      dataIndex: 'adStatus',
      width: 90,
      renderFormItem: () => (
        <AutoComplete
          allowClear
          options={PROJECT_AD_STATUS_OPTIONS}
          placeholder="选择或输入投放状态"
          filterOption={(inputValue, option) =>
            `${option?.value ?? ''}`.toLowerCase().includes(inputValue.toLowerCase())
          }
        >
          <Input />
        </AutoComplete>
      ),
      ellipsis: true,
      render: (_, record) => (
        <AdStatusModalEditor record={record} onSaved={handleAdStatusSaved} />
      ),
    },
    {
      title: '应用平台',
      dataIndex: 'appPlatform',
      width: 80,
      search: false,
      ellipsis: true,
    },
    {
      title: '项目包名',
      dataIndex: 'packageName',
      width: 180,
      ellipsis: true,
    },
    {
      title: '开发者 Gmail',
      dataIndex: 'developerGmail',
      width: 120,
      ellipsis: true,
    },
    {
      title: '负责人 ID',
      dataIndex: 'ownerId',
      hideInTable: true,
      valueType: 'digit',
    },
    ...PROJECT_TABLE_FIELDS.filter(
      (field) =>
        !['projectCode', 'projectName', 'adStatus', 'appPlatform', 'packageName', 'developerGmail', 'remark'].includes(
          field.name,
        ),
    ).map<ProColumns<ProjectItem>>((field) => ({
      title: field.label,
      dataIndex: field.name,
      width: field.width ?? 120,
      search: false,
      ellipsis: true,
      render: (_, record) => {
        if (field.name === 'ownerName' || field.name === 'department') {
          return (
            <ProjectTextFieldModalEditor
              record={record}
              field={field.name}
              label={field.label}
              options={field.name === 'department' ? departmentOptions : undefined}
              onOpen={field.name === 'department' ? ensureDepartmentOptions : undefined}
              onSaved={handleTextFieldSaved}
            />
          );
        }
        const value = record[field.name];
        return value ? <Text ellipsis>{String(value)}</Text> : '-';
      },
    })),
    {
      title: '备注',
      dataIndex: 'remark',
      width: 180,
      search: false,
      ellipsis: true,
      render: (_, record) => (record.remark ? <Text ellipsis>{record.remark}</Text> : '-'),
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
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <a onClick={() => openDetail(record)}>详情</a>
          <a onClick={() => openEdit(record)}>编辑</a>
          {record.status === 'active' ? (
            <a onClick={() => handleStatusChange(record, 'inactive')}>
              <StopOutlined /> 停用
            </a>
          ) : (
            <a onClick={() => handleStatusChange(record, 'active')}>
              <CheckCircleOutlined /> 启用
            </a>
          )}
          <a onClick={() => handleStatusChange(record, 'archived')}>
            <InboxOutlined /> 归档
          </a>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '项目管理',
        extra: [
          <Button key="sync" onClick={() => setSyncOpen(true)}>
            同步
          </Button>,
        ],
      }}
    >
      <ProTable<ProjectItem, ProjectFetchRequest>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        rowSelection={{
          selectedRowKeys: selectedRows.map((row) => row.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        expandable={{
          expandedRowRender: (record) => (
            <ProjectVersionRecords projectId={record.id} projectCode={record.projectCode} />
          ),
        }}
        tableAlertRender={({ selectedRowKeys, onCleanSelected }) => (
          <Space>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <a onClick={onCleanSelected}>取消选择</a>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <Button type="link" size="small" onClick={() => openBatchModal('adStatus')}>
              修改投放状态
            </Button>
            <Button type="link" size="small" onClick={() => openBatchModal('appPlatform')}>
              修改应用平台
            </Button>
            <Button type="link" size="small" onClick={() => openBatchModal('department')}>
              修改部门
            </Button>
          </Space>
        )}
        scroll={{ x: 5600 }}
        search={{ labelWidth: 90 }}
        options={{ density: true, fullScreen: true, reload: true, setting: true }}
        pagination={{ showSizeChanger: true, defaultPageSize: 20 }}
        toolBarRender={() => [
          <Button key="import" icon={<UploadOutlined />} onClick={() => setImportOpen(true)}>
            导入数据
          </Button>,
          <Button key="version-import" icon={<UploadOutlined />} onClick={() => setVersionImportOpen(true)}>
            版本导入
          </Button>,
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProject(undefined);
              setFormOpen(true);
            }}
          >
            新建
          </Button>,
        ]}
        request={async (params) => {
          const { current, pageSize, keyword, status, adStatus, packageName, developerGmail, ownerId } = params;
          const res = await getProjects({
            page: current,
            pageSize,
            keyword,
            status,
            adStatus,
            packageName,
            developerGmail,
            ownerId,
          });
          const pageData = res.data;
          return {
            data: pageData?.data ?? [],
            total: pageData?.total ?? 0,
            success: true,
          };
        }}
      />

      <ProjectTableForm
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) {
            setEditingProject(undefined);
          }
        }}
        initialValues={editingProject}
        onSuccess={(updated) => {
          setFormOpen(false);
          if (editingProject && updated && detailProject?.id === editingProject.id) {
            setDetailProject({ ...detailProject, ...updated });
          }
          setEditingProject(undefined);
          reloadTable();
        }}
      />

      <ProjectTableDetailDrawer
        open={detailOpen}
        project={detailProject}
        activeTab={detailActiveTab}
        onClose={() => {
          setDetailOpen(false);
          setDetailProject(null);
          setDetailActiveTab('detail');
        }}
        onProjectChange={setDetailProject}
        onRefresh={reloadTable}
      />

      <ProjectBatchImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          setImportOpen(false);
          reloadTable();
        }}
      />

      <ProjectSyncModal open={syncOpen} onClose={() => setSyncOpen(false)} />

      <ProjectVersionImportModal
        open={versionImportOpen}
        onClose={() => setVersionImportOpen(false)}
        onSuccess={() => {
          setVersionImportOpen(false);
          reloadTable();
        }}
      />

      <Modal
        title={
          batchModalType === 'appPlatform'
            ? '批量修改应用平台'
            : batchModalType === 'department'
              ? '批量修改部门'
              : '批量修改投放状态'
        }
        open={!!batchModalType}
        confirmLoading={batchLoading}
        okText="确认修改"
        onOk={handleBatchUpdate}
        onCancel={() => {
          if (batchLoading) return;
          setBatchModalType(null);
        }}
        destroyOnHidden
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            已选择 {selectedRows.length} 个项目，单次最多支持 500 个项目。
          </Typography.Text>
          <Form form={batchForm} layout="vertical">
            {batchModalType === 'appPlatform' ? (
              <Form.Item name="appPlatform" label="应用平台">
                <Select
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  placeholder="请选择应用平台；清空后提交将清空应用平台"
                  options={PROJECT_APP_PLATFORM_OPTIONS}
                />
              </Form.Item>
            ) : batchModalType === 'department' ? (
              <Form.Item name="department" label="所属部门">
                <Select
                  mode="tags"
                  allowClear
                  showSearch
                  optionFilterProp="label"
                  maxTagCount={1}
                  tokenSeparators={[',', '，']}
                  placeholder="请选择或输入部门；清空后提交将清空部门"
                  options={departmentOptions}
                  onChange={(value) => {
                    const normalized = Array.isArray(value)
                      ? value.map((item) => `${item}`.trim()).filter(Boolean)
                      : [];
                    const nextValue = normalized.length ? normalized[normalized.length - 1] : undefined;
                    batchForm.setFieldsValue({ department: nextValue });
                  }}
                />
              </Form.Item>
            ) : (
              <Form.Item name="adStatus" label="投放状态">
                <AutoComplete
                  allowClear
                  options={PROJECT_AD_STATUS_OPTIONS}
                  placeholder="请选择或输入投放状态；清空后提交将清空投放状态"
                  filterOption={(inputValue, option) =>
                    `${option?.value ?? ''}`.toLowerCase().includes(inputValue.toLowerCase())
                  }
                >
                  <Input />
                </AutoComplete>
              </Form.Item>
            )}
          </Form>
        </Space>
      </Modal>
    </PageContainer>
  );
};

export default ProjectTablePage;
