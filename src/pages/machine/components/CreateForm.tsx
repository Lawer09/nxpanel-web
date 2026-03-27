import React, { useRef } from 'react';
import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormTextArea,
  ProFormDigit,
  ProFormCheckbox,
} from '@ant-design/pro-components';
import { Button, message } from 'antd';
import { createMachine } from '@/services/swagger/machine';

interface CreateFormProps {
  reload?: (resetPageIndex?: boolean) => Promise<void>;
}

const CreateForm: React.FC<CreateFormProps> = ({ reload }) => {
  const formRef = useRef<ProFormInstance>(null);

  return (
    <ModalForm<API.Machine>
      title="Create Machine"
      trigger={
        <Button type="primary">
          New
        </Button>
      }
      formRef={formRef}
      autoFocusFirstInput
      modalProps={{
        destroyOnHidden: true,
      }}
      submitTimeout={2000}
      onFinish={async (formValues) => {
        try {
          const res = await createMachine(formValues);
          if (res.code === 0) {
            message.success('Machine created successfully');
            await reload?.();
            return true;
          } else {
            message.error(res.msg || 'Failed to create machine');
            return false;
          }
        } catch (_error) {
          message.error('Create failed');
          return false;
        }
      }}
    >
      <ProForm.Group>
        <ProFormText width="md" name="name" label="Machine Name" />
        <ProFormText width="md" name="hostname" label="Hostname" />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText width="md" name="ip_address" label="IP Address" />
        <ProFormDigit width="md" name="port" label="SSH Port" min={1} max={65535} />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText width="md" name="username" label="SSH Username" />
        <ProFormText.Password width="md" name="password" label="Password" />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormSelect
          width="md"
          name="status"
          label="Status"
          options={[
            { label: 'Online', value: 'online' },
            { label: 'Offline', value: 'offline' },
            { label: 'Error', value: 'error' },
            { label: 'Maintenance', value: 'maintenance' },
          ]}
        />
        <ProFormText width="md" name="os_type" label="OS Type" />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText width="md" name="cpu_cores" label="CPU Cores" />
        <ProFormText width="md" name="memory" label="Memory" />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText width="md" name="disk" label="Disk" />
        <ProFormText width="md" name="gpu_info" label="GPU Info" />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormDigit width="md" name="bandwidth" label="Bandwidth (Mbps)" />
        <ProFormText width="md" name="provider" label="Cloud Provider" />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormDigit width="md" name="price" label="Price" />
        <ProFormSelect
          width="md"
          name="pay_mode"
          label="Pay Mode"
          options={[
            { label: 'Hourly', value: 'hourly' },
            { label: 'Daily', value: 'daily' },
            { label: 'Monthly', value: 'monthly' },
            { label: 'Quarterly', value: 'quarterly' },
            { label: 'Yearly', value: 'yearly' },
            { label: 'Once', value: 'once' },
          ]}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText width="md" name="tags" label="Tags" />
      </ProForm.Group>

      <ProFormTextArea name="description" label="Description" />

      <ProFormCheckbox name="is_active" label="Active" />
    </ModalForm>
  );
};

export default CreateForm;
