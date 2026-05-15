import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { ActionType, ProTable, ProColumns, ModalForm, ProFormText, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Space, Popconfirm, Tag, App, Select, Form } from 'antd';
import { getAdAccounts as getProjectAdAccounts, createAdAccount, updateAdAccount, deleteAdAccount } from '@/services/project/api';
import { getAdAccounts as fetchAdPlatformAccounts, getAdRevenueApps } from '@/services/ad/api';
import type { ProjectAdAccount } from '@/services/project/types';

interface AdAccountsProps {
  projectId: number;
}

export interface ResourceActionRef {
  openAdd: () => void;
  reload: () => void;
}

const AdAccounts = forwardRef<ResourceActionRef, AdAccountsProps>(({ projectId }, ref) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<ProjectAdAccount | undefined>(undefined);
  const [adAccountOptions, setAdAccountOptions] = useState<{ label: string; value: number }[]>([]);
  const [appOptions, setAppOptions] = useState<{ label: string; value: string }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | undefined>();
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>();
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>();
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    openAdd: () => {
      setCurrentRow(undefined);
      setSelectedAccountId(undefined);
      setSelectedPlatform(undefined);
      setSelectedAppId(undefined);
      setAppOptions([]);
      setFormVisible(true);
    },
    reload: () => {
      actionRef.current?.reload();
    }
  }));

  const columns: ProColumns<ProjectAdAccount>[] = [
    { title: '平台代码', dataIndex: 'platformCode' },
    { title: '绑定类型', dataIndex: 'bindType' },
    { title: '广告账号ID', dataIndex: 'adPlatformAccountId' },
    { title: '外部AppID', dataIndex: 'externalAppId', hideInSearch: true },
    { title: '外部广告位ID', dataIndex: 'externalAdUnitId', hideInSearch: true },
    {
      title: '状态',
      dataIndex: 'enabled',
      valueEnum: {
        1: { text: <Tag color="success">启用</Tag>, status: 'Success' },
        0: { text: <Tag color="default">停用</Tag>, status: 'Default' },
      },
    },
    { title: '备注', dataIndex: 'remark', hideInSearch: true },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => (
        <Space>
          <a onClick={() => { setCurrentRow(record); setFormVisible(true); }}>编辑</a>
          <Popconfirm
            title="确认删除该关联？"
            onConfirm={async () => {
              await deleteAdAccount({ id: record.id, projectId });
              message.success('删除成功');
              actionRef.current?.reload();
            }}
          >
            <a style={{ color: 'red' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const loadAdAccounts = async (search?: string) => {
    try {
      const res = await fetchAdPlatformAccounts({ keyword: search, page: 1, pageSize: 200 });
      const list = res.data?.data || [];
      setAdAccountOptions(list.map((item) => ({
        label: `[${item.id}] ${item.accountLabel ? `${item.accountLabel} - ` : ''}${item.accountName} (${item.sourcePlatform})`,
        value: item.id,
      })));
      // cache for platform lookup
      (window as any).__adAccountOptions = list;
    } catch (e) {
      // ignore
    }
  };

  const handleAccountChange = (value: number) => {
    setSelectedAccountId(value);
    setSelectedAppId(undefined);
    setAppOptions([]);
    const account = (window as any).__adAccountOptions?.find((a: any) => a.id === value);
    const platform = account?.sourcePlatform;
    setSelectedPlatform(platform);
    form.setFieldsValue({ externalAppId: undefined, bindType: 'account', platformCode: platform });
    if (value) loadApps(value);
  };

  const loadApps = async (accountId: number) => {
    try {
      const res = await getAdRevenueApps({ accountId, page: 1, pageSize: 200 });
      const list = res.data?.data || [];
      setAppOptions(list.map((item) => ({
        label: `${item.providerAppName} (${item.providerAppId})`,
        value: item.providerAppId,
      })));
    } catch (e) {
      setAppOptions([]);
    }
  };

  const handleAppChange = (value: string | undefined) => {
    setSelectedAppId(value);
    if (value) {
      form.setFieldsValue({ bindType: 'app' });
    } else {
      form.setFieldsValue({ bindType: 'account' });
    }
  };

  return (
    <>
      <ProTable<ProjectAdAccount>
        actionRef={actionRef}
        rowKey="id"
        search={false}
        options={false}
        pagination={false}
        params={{ projectId }}
        request={async (params) => {
          const res = await getProjectAdAccounts(params.projectId);
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          return { data: list, success: true };
        }}
        columns={columns}
      />

      {formVisible && (
        <ModalForm
          title={currentRow ? '编辑广告账号关联' : '新增广告账号关联'}
          open={formVisible}
          onOpenChange={(open) => {
            setFormVisible(open);
            if (!open) {
              setSelectedAccountId(undefined);
              setSelectedAppId(undefined);
              setAppOptions([]);
            }
          }}
          form={form}
          initialValues={currentRow || { enabled: 1 }}
          modalProps={{ destroyOnHidden: true }}
          onFinish={async (values) => {
            try {
              if (currentRow) {
                await updateAdAccount({
                  id: currentRow.id,
                  projectId,
                  enabled: values.enabled,
                  remark: values.remark,
                });
                message.success('编辑成功');
              } else {
                await createAdAccount({
                    ...values,
                    projectId,
                    platformCode: selectedPlatform,
                    adPlatformAccountId: values.adPlatformAccountId,
                    bindType: selectedAppId ? 'app' : 'account',
                } as any);
                message.success('新增成功');
              }
              setFormVisible(false);
              actionRef.current?.reload();
              return true;
            } catch (error) {
              return false;
            }
          }}
        >
          {!currentRow ? (
            <div>
              <Form.Item
                name="adPlatformAccountId"
                label="广告账号"
                rules={[{ required: true, message: '请选择广告账号' }]}
              >
                <Select
                  showSearch
                  placeholder="搜索并选择广告账号"
                  options={adAccountOptions}
                  onFocus={() => { if (adAccountOptions.length === 0) loadAdAccounts(); }}
                  onSearch={loadAdAccounts}
                  filterOption={false}
                  onChange={handleAccountChange}
                  allowClear
                />
              </Form.Item>
              <Form.Item
                name="externalAppId"
                label="App"
              >
                <Select
                  showSearch
                  placeholder="选择 App（可选）"
                  options={appOptions}
                  onFocus={() => { if (selectedAccountId) loadApps(selectedAccountId); }}
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={handleAppChange}
                  allowClear
                  notFoundContent={selectedAccountId ? '暂无 App 数据' : '请先选择广告账号'}
                  disabled={!selectedAccountId}
                />
              </Form.Item>
              <Form.Item name="bindType" label="绑定类型" hidden>
                <Select
                  disabled
                  options={[
                    { label: 'Account', value: 'account' },
                    { label: 'App', value: 'app' },
                  ]}
                />
              </Form.Item>
              <ProFormText name="externalAdUnitId" label="外部广告位ID" hidden />
            </div>
          ) : (
            <div>
              <ProFormText name="platformCode" label="平台代码" disabled />
              <ProFormText name="adPlatformAccountId" label="广告账号ID" disabled />
              <ProFormText name="externalAppId" label="外部AppID" disabled />
              <ProFormText name="externalAdUnitId" label="外部广告位ID" hidden />
            </div>
          )}
          <ProFormSelect
            name="enabled"
            label="状态"
            options={[
              { label: '启用', value: 1 },
              { label: '停用', value: 0 },
            ]}
            rules={[{ required: true }]}
          />
          <ProFormTextArea name="remark" label="备注" />
        </ModalForm>
      )}
    </>
  );
});

export default AdAccounts;
