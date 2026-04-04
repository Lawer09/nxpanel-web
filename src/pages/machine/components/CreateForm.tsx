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
import { Button, message } from 'antd';
import React, { useRef } from 'react';
import { createMachine } from '@/services/machine/api';

interface CreateFormProps {
  reload?: (resetPageIndex?: boolean) => Promise<void>;
  providerOptions?: Array<{ label: string; value: number }>;
}

const CreateForm: React.FC<CreateFormProps> = ({
  reload,
  providerOptions = [],
}) => {
  const formRef = useRef<ProFormInstance>(null);

  return (
    <ModalForm<API.Machine>
      title="Create Machine"
      trigger={<Button type="primary">New</Button>}
      formRef={formRef}
      autoFocusFirstInput
      modalProps={{
        destroyOnHidden: true,
      }}
      initialValues={{ is_active: true }}
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
        <ProFormText
          width="md"
          name="name"
          label="Machine Name"
          rules={[{ required: true, message: 'Please enter machine name' }]}
          fieldProps={{ maxLength: 255 }}
        />
        <ProFormText
          width="md"
          name="hostname"
          label="Hostname"
          rules={[{ required: true, message: 'Please enter hostname' }]}
          fieldProps={{ maxLength: 255 }}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText
          width="md"
          name="ip_address"
          label="IP Address"
          rules={[{ required: true, message: 'Please enter IP address' }]}
        />
        <ProFormDigit
          width="md"
          name="port"
          label="SSH Port"
          min={1}
          max={65535}
          rules={[{ required: true, message: 'Please enter port' }]}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText
          width="md"
          name="username"
          label="SSH Username"
          rules={[{ required: true, message: 'Please enter SSH username' }]}
        />
        <ProFormText width="md" name="os_type" label="OS Type" />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText.Password
          width="md"
          name="password"
          label="Password"
          tooltip="Password and Private Key, at least one is required"
        />
        <ProFormTextArea
          width="md"
          name="private_key"
          label="Private Key"
          tooltip="Password and Private Key, at least one is required"
          fieldProps={{ rows: 3 }}
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

      <ProFormText
        name="provider_instance_id"
        label="Provider Instance ID"
        tooltip="供应商平台上的实例 ID"
        fieldProps={{ maxLength: 255 }}
      />
      <ProFormTextArea name="description" label="Description" />
    </ModalForm>
  );
};

export default CreateForm;
