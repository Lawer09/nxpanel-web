import { getAccountsByBm } from '@/services/ads-console/account';
import { getBmPage } from '@/services/ads-console/bm';
import {
  type ActionType,
  type ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { Button, Modal } from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';

const BmPage: React.FC = () => {
  const actionRef = useRef<ActionType>(undefined);
  const accountActionRef = useRef<ActionType>(undefined);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [currentBm, setCurrentBm] = useState<AdsConsole.FbBm | null>(null);

  const openAccounts = (record: AdsConsole.FbBm) => {
    setCurrentBm(record);
    setAccountsOpen(true);
    setTimeout(() => accountActionRef.current?.reload(), 0);
  };

  const columns: ProColumns<AdsConsole.FbBm>[] = [
    {
      title: 'BM ID',
      dataIndex: 'bmId',
      width: 220,
      copyable: true,
    },
    {
      title: 'BM 名称',
      dataIndex: 'name',
      width: 260,
      ellipsis: true,
    },
    {
      title: '账户数',
      dataIndex: 'accountCount',
      width: 90,
      hideInSearch: true,
      render: (_, record) => (
        <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openAccounts(record)}>
          {record.accountCount ?? 0}
        </Button>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      hideInSearch: true,
      render: (_, record) => record.updateTime ? dayjs(record.updateTime).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ];

  return (
    <>
      <ProTable<AdsConsole.FbBm>
        rowKey="id"
        actionRef={actionRef}
        columns={columns}
        request={async (params) => {
          const res = await getBmPage({
            current: params.current,
            size: params.pageSize,
            bmId: params.bmId,
            name: params.name,
            remark: params.remark,
          });
          return {
            data: res?.data?.records || [],
            total: res?.data?.total || 0,
            success: !!res?.success,
          };
        }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        options={{ reload: true, density: true, setting: true }}
        size="small"
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        title={currentBm ? `关联账户 - ${currentBm.name || currentBm.bmId}` : '关联账户'}
        open={accountsOpen}
        onCancel={() => {
          setAccountsOpen(false);
          setCurrentBm(null);
        }}
        footer={null}
        width={1080}
        destroyOnClose
        styles={{ body: { overflow: 'hidden', height: 660, paddingBottom: 0, display: 'flex', flexDirection: 'column' } }}
      >
        <ProTable<AdsConsole.AdsAccountManage>
          rowKey="id"
          actionRef={accountActionRef}
          search={{ labelWidth: 'auto', defaultCollapsed: false }}
          columns={[
            { title: '账户ID', dataIndex: 'accountId', width: 180 },
            { title: '账户名称', dataIndex: 'name', width: 320, ellipsis: true },
            { title: '代理商', dataIndex: 'agencyName', width: 180, ellipsis: true, hideInSearch: true },
            { title: '项目组', dataIndex: 'groupName', width: 160, ellipsis: true, hideInSearch: true },
            { title: '负责人', dataIndex: 'username', width: 140, hideInSearch: true },
          ]}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          options={false}
          size="small"
          tableStyle={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
          cardProps={{ bodyStyle: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 } }}
          request={async (params) => {
            if (!currentBm?.id) {
              return { data: [], total: 0, success: true };
            }
            const res = await getAccountsByBm({
              current: params.current,
              size: params.pageSize,
              bmRecordId: currentBm.id,
              accountId: params.accountId,
              name: params.name,
            });
            return {
              data: res?.data?.records || [],
              total: res?.data?.total || 0,
              success: !!res?.success,
            };
          }}
          tableRender={(_, dom) => (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {dom}
            </div>
          )}
        />
      </Modal>
    </>
  );
};

export default BmPage;




