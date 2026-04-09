import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProForm,
  ProFormSelect,
  ProFormSwitch,
} from '@ant-design/pro-components';
import { App } from 'antd';
import React, { useRef } from 'react';
import { fetchIpPool } from '@/services/infra/api';
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
        <ProFormSwitch name="only_unbound" label="Only unbound" />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormSelect
          width="md"
          name="ip_id"
          label="New IP"
          rules={[{ required: true, message: 'Please select an IP' }]}
          showSearch
          dependencies={['only_unbound']}
          request={async (params) => {
            const res = await fetchIpPool({
              current: 1,
              pageSize: 1000,
              status: 'active',
            });
            if (res.code !== 0) {
              message.error(res.msg || 'Failed to load IP list');
              return [];
            }
            const onlyUnbound = params?.only_unbound ?? true;
            const items = res.data?.data || [];
            const filtered = onlyUnbound
              ? items.filter((item) => !item.machine_id)
              : items;
            return filtered.map((item) => ({
              label: item.ip,
              value: item.id,
            }));
          }}
          fieldProps={{ optionFilterProp: 'label' }}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormSwitch name="set_as_primary" label="Set as Primary" />
        <ProFormSwitch name="set_as_egress" label="Set as Egress" />
      </ProForm.Group>
    </ModalForm>
  );
};

export default SwitchIpModal;
