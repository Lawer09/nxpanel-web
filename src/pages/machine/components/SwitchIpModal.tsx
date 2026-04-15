import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProForm,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { App, Space, Typography } from 'antd';
import React, { useRef } from 'react';
import { getSwitchableIps } from '@/services/infra/api';
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

  return (
    <ModalForm<{
      ip_id: number;
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
        <ProFormSelect
          name="ip_id"
          label="New IP"
          rules={[{ required: true, message: 'Please select an IP' }]}
          showSearch
          dependencies={['only_unbound']}
          request={async (params) => {
            if (!machine?.id) {
              message.error('Invalid machine id');
              return [];
            }
            const res = await getSwitchableIps({
              machine_id: machine.id,
              current: 1,
              pageSize: 1000,
            });
            if (res.code !== 0) {
              message.error(res.msg || 'Failed to load IP list');
              return [];
            }
            const items = res.data?.data || [];
            return items.map((item) => ({
              label: (
                <Space direction="vertical" size={0}>
                  <Space size={6} align="center">
                    <Text>{item.ip}</Text>
                    {machine?.ip_address && item.ip === machine.ip_address && (
                      <Text type="warning" style={{ fontSize: 12 }}>
                        当前IP
                      </Text>
                    )}
                    <Text style={{ fontSize: 12 }}>
                    {[
                      item.country,
                      item.region,
                    ].filter(Boolean).join(' / ') || '-'}
                  </Text>
                  </Space>
                </Space>
              ),
              value: item.id,
              labelText: `${item.ip} ${item.country || ''} ${item.region || ''}`.trim(),
            }));
          }}
          fieldProps={{ optionFilterProp: 'labelText' }}
          colProps={{ span: 16 }}
        />
        <ProFormSwitch
          name="only_unbound"
          label="Only unbound"
          colProps={{ span: 8 }}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormSwitch
          name="set_as_primary"
          label="Set as Primary"
          colProps={{ span: 12 }}
        />
        <ProFormSwitch
          name="set_as_egress"
          label="Set as Egress"
          colProps={{ span: 12 }}
        />
      </ProForm.Group>
    </ModalForm>
  );
};

export default SwitchIpModal;
