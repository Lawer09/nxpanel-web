import React, { useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { ActionType, ProTable, ProColumns, ModalForm, ProFormText, ProFormSelect, ProFormTextArea } from '@ant-design/pro-components';
import { Space, Popconfirm, Tag, App, Select, Form } from 'antd';
import { getTrafficAccounts as getProjectTrafficAccounts, createTrafficAccount, updateTrafficAccount, deleteTrafficAccount } from '@/services/project/api';
import { getTrafficAccounts as fetchTrafficPlatformAccounts } from '@/services/traffic-platform/api';
import type { ProjectTrafficAccount } from '@/services/project/types';

interface TrafficAccountsProps {
  projectId: number;
}

export interface ResourceActionRef {
  openAdd: () => void;
  reload: () => void;
}

const TrafficAccounts = forwardRef<ResourceActionRef, TrafficAccountsProps>(({ projectId }, ref) => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [currentRow, setCurrentRow] = useState<ProjectTrafficAccount | undefined>(undefined);
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: number }[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string | undefined>();
  const [form] = Form.useForm();

  useImperativeHandle(ref, () => ({
    openAdd: () => {
      setCurrentRow(undefined);
      setSelectedPlatform(undefined);
      setFormVisible(true);
    },
    reload: () => {
      actionRef.current?.reload();
    }
  }));

  const columns: ProColumns<ProjectTrafficAccount>[] = [
    { title: '平台代码', dataIndex: 'platformCode' },
    { title: '绑定类型', dataIndex: 'bindType' },
    { title: '平台账号ID', dataIndex: 'trafficPlatformAccountId' },
    { title: '外部UID', dataIndex: 'externalUid', hideInSearch: true },
    { title: '外部用户名', dataIndex: 'externalUsername', hideInSearch: true },
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
              await deleteTrafficAccount({ id: record.id, projectId });
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

  const loadAccounts = async (search?: string) => {
    try {
      const res = await fetchTrafficPlatformAccounts({ keyword: search, page: 1, pageSize: 200 });
      const list = res.data?.data || [];
      setAccountOptions(list.map((item) => ({
        label: `[${item.id}] ${item.accountName} (${item.platformCode})`,
        value: item.id,
      })));
      (window as any).__trafficAccountOptions = list;
    } catch (e) {
      // ignore
    }
  };

  const handleAccountChange = (value: number) => {
    const account = (window as any).__trafficAccountOptions?.find((a: any) => a.id === value);
    const platform = account?.platformCode;
    setSelectedPlatform(platform);
    form.setFieldsValue({ platformCode: platform, bindType: 'account', externalUid: undefined, externalUsername: undefined });
  };

  return (
    <>
      <ProTable<ProjectTrafficAccount>
        actionRef={actionRef}
        rowKey="id"
        search={false}
        options={false}
        pagination={false}
        params={{ projectId }}
        request={async (params) => {
          const res = await getProjectTrafficAccounts(params.projectId);
          const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          return { data: list, success: true };
        }}
        columns={columns}
      />

      {formVisible && (
        <ModalForm
          title={currentRow ? '编辑流量账号关联' : '新增流量账号关联'}
          open={formVisible}
          onOpenChange={(open) => {
            setFormVisible(open);
            if (!open) setSelectedPlatform(undefined);
          }}
          form={form}
          initialValues={currentRow || { enabled: 1 }}
          modalProps={{ destroyOnHidden: true }}
          onFinish={async (values) => {
            try {
              if (currentRow) {
                await updateTrafficAccount({
                  id: currentRow.id,
                  projectId,
                  enabled: values.enabled,
                  remark: values.remark,
                });
                message.success('编辑成功');
              } else {
                await createTrafficAccount({
                  ...values,
                  projectId,
                  platformCode: selectedPlatform,
                  bindType: 'account',
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
                name="trafficPlatformAccountId"
                label="流量账号"
                rules={[{ required: true, message: '请选择流量账号' }]}
              >
                <Select
                  showSearch
                  placeholder="搜索并选择流量账号"
                  options={accountOptions}
                  onFocus={() => { if (accountOptions.length === 0) loadAccounts(); }}
                  onSearch={loadAccounts}
                  filterOption={false}
                  onChange={handleAccountChange}
                  allowClear
                />
              </Form.Item>
              <Form.Item name="bindType" label="绑定类型" hidden>
                <Select disabled options={[{ label: 'Account', value: 'account' }]} />
              </Form.Item>
              <ProFormText name="platformCode" label="平台代码" hidden />
              <ProFormText name="externalUid" label="外部UID" hidden />
              <ProFormText name="externalUsername" label="外部用户名" hidden />
            </div>
          ) : (
            <div>
              <ProFormText name="platformCode" label="平台代码" disabled />
              <ProFormText name="trafficPlatformAccountId" label="平台账号ID" disabled />
              <ProFormText name="bindType" label="绑定类型" disabled />
              <ProFormText name="externalUid" label="外部UID" disabled />
              <ProFormText name="externalUsername" label="外部用户名" disabled />
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

export default TrafficAccounts;
