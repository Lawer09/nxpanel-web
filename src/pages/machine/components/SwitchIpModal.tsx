import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProForm,
  ProFormItem,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { App, Card, Space, Table, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getProviderEips } from '@/services/provider/api';
import { switchMachineIp } from '@/services/machine/api';

interface SwitchIpModalProps {
  trigger: React.ReactNode;
  machine?: API.Machine;
  onSuccess?: () => void;
}

const SwitchIpModal: React.FC<SwitchIpModalProps> = ({
  trigger,
  machine,
  onSuccess,
}) => {
  const formRef = useRef<ProFormInstance>(null);
  const { message } = App.useApp();
  const { Text } = Typography;
  const [open, setOpen] = useState(false);
  const [ipLoading, setIpLoading] = useState(false);
  const [ipList, setIpList] = useState<
    {
      key: string;
      ipLabel: string;
      zoneId?: string;
      networkLineType?: string;
      regionId?: string;
      bandwidth?: number | string;
      raw: any;
    }[]
  >([]);
  const [selectedKey, setSelectedKey] = useState<string | undefined>();
  const [ipPage, setIpPage] = useState(1);
  const [ipPageSize, setIpPageSize] = useState(20);
  const [ipTotal, setIpTotal] = useState(0);

  const fetchEips = useCallback(
    async (onlyUnbound?: boolean, page = 1, pageSize = ipPageSize) => {
      if (!machine?.id) {
        message.error('Invalid machine id');
        return;
      }
      if (!machine?.provider) {
        message.error('Invalid provider id');
        return;
      }
      if (!machine.provider_zone_id) {
        message.error('Invalid zone id');
        return;
      }
      setIpLoading(true);
      try {
        const res = await getProviderEips({
          providerId: machine.provider,
          zoneId: machine.provider_zone_id,
          status: onlyUnbound ? 'UNBIND' : undefined,
          page,
          pageSize,
        });
        if (res.code !== 0) {
          message.error(res.msg || 'Failed to load IP list');
          setIpList([]);
          return;
        }
        const items = res.data?.data || [];
        setIpTotal(res.data?.total || 0);
        setIpPage(res.data?.page || page);
        setIpPageSize(res.data?.pageSize || pageSize);
        const mapped = items.map((item: any) => {
          const ipLabel = Array.isArray(item.ipAddress)
            ? item.ipAddress.join(', ')
            : item.ipAddress;
          return {
            key: item.eipId,
            ipLabel,
            zoneId: item.zoneId,
            networkLineType: item.metadata?.networkLineType,
            regionId: item.metadata?.regionId,
            bandwidth: item.metadata?.bandwidth,
            raw: item,
          };
        });
        setIpList(mapped);
      } finally {
        setIpLoading(false);
      }
    },
    [machine, message, ipPageSize],
  );

  useEffect(() => {
    if (!open) return;
    const onlyUnbound = formRef.current?.getFieldValue('only_unbound');
    fetchEips(Boolean(onlyUnbound));
  }, [open, fetchEips]);

  const tableColumns = useMemo(
    () => [
      {
        title: 'IP Address',
        width: 140,
        dataIndex: 'ipLabel',
        render: (value: string) => (
          <Space size={8} align="center">
            <Text>{value}</Text>
            {machine?.ip_address && value === machine.ip_address && (
              <Text type="warning" style={{ fontSize: 12 }}>
                当前IP
              </Text>
            )}
          </Space>
        ),
      },
      // { title: 'Zone', dataIndex: 'zoneId', width: 120 },
      { title: 'Network Line', dataIndex: 'networkLineType', width: 140 },
      { title: 'Region', dataIndex: 'regionId', width: 120 },
      {
        title: 'Bandwidth',
        dataIndex: 'bandwidth',
        width: 120,
        render: (value: number | string | undefined) => (value === undefined ? '-' : `${value} Mbps`),
      },
    ],
    [machine?.ip_address, Text],
  );

  return (
    <ModalForm<{
      ip_id: string;
      set_as_primary: boolean;
      set_as_egress: boolean;
      only_unbound: boolean;
    }>
      title="Switch IP"
      trigger={trigger}
      formRef={formRef}
      autoFocusFirstInput
      grid
      rowProps={{ gutter: 16 }}
      modalProps={{
        destroyOnHidden: true,
      }}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setIpList([]);
          setSelectedKey(undefined);
          setIpPage(1);
          setIpTotal(0);
        }
      }}
      initialValues={{
        set_as_primary: true,
        set_as_egress: true,
        only_unbound: true,
      }}
      onFinish={async (values) => {
        if (!machine?.id) {
          message.error('Invalid machine id');
          return false;
        }
        const res = await switchMachineIp({
          machine_id: machine.id,
          ip_id: values.ip_id,
          set_as_primary: values.set_as_primary,
          set_as_egress: values.set_as_egress,
        });
        if (res.code === 0) {
          if (res.data?.is_egress === false) {
            message.warning('IP switched, but set egress failed');
          } else {
            message.success('IP switched successfully');
          }
          onSuccess?.();
          return true;
        }
        message.error(res.msg || 'Switch IP failed');
        return false;
      }}
    >
      <ProForm.Group>
        <ProFormItem
          name="ip_id"
          label="New IP"
          rules={[{ required: true, message: 'Please select an IP' }]}
        >
          <Card size="small" styles={{ body: { padding: 10 } }}>
            <Table
              rowKey="key"
              columns={tableColumns as any}
              dataSource={ipList}
              pagination={{
                current: ipPage,
                pageSize: ipPageSize,
                total: ipTotal,
                showSizeChanger: true,
                onChange: (page, pageSize) => {
                  const onlyUnbound = formRef.current?.getFieldValue('only_unbound');
                  fetchEips(Boolean(onlyUnbound), page, pageSize);
                },
              }}
              scroll={{ y: 360 }}
              loading={ipLoading}
              size="small"
              rowSelection={{
                type: 'radio',
                selectedRowKeys: selectedKey ? [selectedKey] : [],
                onChange: (keys) => {
                  const nextKey = String(keys[0] ?? '');
                  setSelectedKey(nextKey || undefined);
                  formRef.current?.setFieldsValue({ ip_id: nextKey || undefined });
                },
              }}
            />
          </Card>
        </ProFormItem>
      </ProForm.Group>

      <ProForm.Group>
        <ProFormSwitch
          name="only_unbound"
          label="Only unbound"
          colProps={{ span: 8 }}
          fieldProps={{
            onChange: (checked) => {
              setIpPage(1);
              fetchEips(Boolean(checked), 1, ipPageSize);
            },
          }}
        />
        <ProFormSwitch
          name="set_as_primary"
          label="Set as Primary"
          colProps={{ span: 8 }}
        />
        <ProFormSwitch
          name="set_as_egress"
          label="Set as Egress"
          colProps={{ span: 8 }}
        />
      </ProForm.Group>
    </ModalForm>
  );
};

export default SwitchIpModal;
