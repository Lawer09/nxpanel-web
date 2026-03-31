import type { ProFormInstance } from '@ant-design/pro-components';
import {
  ModalForm,
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App } from 'antd';
import React, { useRef } from 'react';
import { updateMachine } from '@/services/swagger/machine';

interface UpdateFormProps {
  trigger: React.ReactNode;
  onOk?: () => void;
  values: API.Machine;
  providerOptions?: Array<{ label: string; value: number }>;
}

const UpdateForm: React.FC<UpdateFormProps> = ({
  trigger,
  onOk,
  values,
  providerOptions = [],
}) => {
  const formRef = useRef<ProFormInstance>(null);
  const { message } = App.useApp();

  return (
    <ModalForm<Partial<API.Machine>>
      title="Update Machine"
      trigger={trigger}
      formRef={formRef}
      autoFocusFirstInput
      modalProps={{
        destroyOnHidden: true,
      }}
      initialValues={values}
      submitTimeout={2000}
      onFinish={async (formValues) => {
        try {
          const data = {
            id: values.id,
            ...formValues,
          };
          const res = await updateMachine(data);
          if (res.code === 0) {
            message.success('Machine updated successfully');
            onOk?.();
            return true;
          } else {
            message.error(res.msg || 'Failed to update machine');
            return false;
          }
        } catch (_error) {
          message.error('Update failed');
          return false;
        }
      }}
    >
      <ProForm.Group>
        <ProFormText
          width="md"
          name="name"
          label="Machine Name"
          fieldProps={{ maxLength: 255 }}
        />
        <ProFormText
          width="md"
          name="hostname"
          label="Hostname"
          fieldProps={{ maxLength: 255 }}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText width="md" name="ip_address" label="IP Address" />
        <ProFormDigit
          width="md"
          name="port"
          label="SSH Port"
          min={1}
          max={65535}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText width="md" name="username" label="SSH Username" />
        <ProFormText width="md" name="os_type" label="OS Type" />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText.Password
          width="md"
          name="password"
          label="Password"
          placeholder="Leave blank to keep unchanged"
        />
        <ProFormTextArea
          width="md"
          name="private_key"
          label="Private Key"
          placeholder="Leave blank to keep unchanged"
          fieldProps={{ rows: 3 }}
        />
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
          ]}
        />
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
        <ProFormSelect
          width="md"
          name="provider"
          label="Provider"
          options={providerOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormDigit
          width="md"
          name="price"
          label="Price"
          fieldProps={{ precision: 2 }}
        />
        <ProFormSelect
          width="md"
          name="pay_mode"
          label="Pay Mode"
          options={[
            { label: 'Hourly', value: 1 },
            { label: 'Daily', value: 2 },
            { label: 'Monthly', value: 3 },
            { label: 'Quarterly', value: 4 },
            { label: 'Yearly', value: 5 },
            { label: 'Once', value: 6 },
          ]}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText width="md" name="tags" label="Tags" />
        <ProFormSwitch name="is_active" label="Active" />
      </ProForm.Group>

      <ProFormTextArea name="description" label="Description" />
    </ModalForm>
  );
};

export default UpdateForm;
