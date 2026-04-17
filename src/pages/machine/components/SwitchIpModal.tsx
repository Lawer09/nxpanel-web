import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProForm,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { App, Space, Typography } from 'antd';
import React, { useRef } from 'react';
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
          request={async (params, formData) => {
            if (!machine?.id) {
              message.error('Invalid machine id');
              return [];
            }
            if (!machine?.provider) {
              message.error('Invalid provider id');
              return [];
            }
            if (!machine.zoneId && !machine.zone_id) {
              message.error('Invalid zone id');
              return [];
            }
            const res = await getProviderEips({
              providerId: machine.provider,
              zoneId: machine.zoneId || machine.zone_id,
              status: formData?.only_unbound ? 'UNBIND' : undefined,
              page: 1,
              pageSize: 1000,
            });
            if (res.code !== 0) {
              message.error(res.msg || 'Failed to load IP list');
              return [];
            }
            const items = res.data?.data || [];
            return items.map((item) => {
              const ipLabel = Array.isArray(item.ipAddress)
                ? item.ipAddress.join(', ')
                : item.ipAddress;
              return {
                label: (
                  <Space direction="vertical" size={0}>
                    <Space size={6} align="center">
                      <Text>{ipLabel}</Text>
                      {machine?.ip_address && ipLabel === machine.ip_address && (
                        <Text type="warning" style={{ fontSize: 12 }}>
                          当前IP
                        </Text>
                      )}
                      <Text style={{ fontSize: 12 }}>{item.zoneId || '-'}</Text>
                    </Space>
                  </Space>
                ),
                value: item.eipId,
                labelText: `${ipLabel} ${item.zoneId || ''}`.trim(),
              };
            });
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
