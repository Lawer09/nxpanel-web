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
import { Button, App, message } from 'antd';
import React, { useRef } from 'react';
import { createMachine, updateMachine } from '@/services/machine/api';

interface SaveFormProps {
  reload?: (resetPageIndex?: boolean) => Promise<void>;
  providerOptions?: Array<{ label: string; value: number }>;
  trigger?: React.ReactNode;
  values?: Partial<API.Machine>;
  onOk?: () => void;
  mode?: 'create' | 'update';
}

const SaveForm: React.FC<SaveFormProps> = ({
  reload,
  providerOptions = [],
  trigger,
  values = {},
  onOk,
  mode = 'create',
}) => {
  const formRef = useRef<ProFormInstance>(null);
  const { message: messageApi } = App.useApp ? App.useApp() : { message };

  return (
    <ModalForm<Partial<API.Machine>>
      title={mode === 'create' ? 'Create Machine' : 'Update Machine'}
      trigger={trigger || (mode === 'create' ? <Button type="primary">New</Button> : undefined)}
      formRef={formRef}
      autoFocusFirstInput
      grid
      rowProps={{ gutter: 16 }}
      modalProps={{
        destroyOnHidden: true,
      }}
      initialValues={mode === 'update' ? values : { is_active: true, ...values }}
      submitTimeout={2000}
      onFinish={async (formValues) => {
        try {
          let res;
          if (mode === 'create') {
            res = await createMachine(formValues as API.Machine);
          } else {
            res = await updateMachine({ id: values.id, ...formValues });
          }
          if (res.code === 0) {
            messageApi.success(mode === 'create' ? 'Machine created successfully' : 'Machine updated successfully');
            if (mode === 'create') {
              await reload?.();
            } else {
              onOk?.();
            }
            return true;
          } else {
            messageApi.error(res.msg || (mode === 'create' ? 'Failed to create machine' : 'Failed to update machine'));
            return false;
          }
        } catch (_error) {
          messageApi.error(mode === 'create' ? 'Create failed' : 'Update failed');
          return false;
        }
      }}
    >
      <ProForm.Group>
        <ProFormText
          name="name"
          label="Machine Name"
          rules={mode === 'create' ? [{ required: true, message: 'Please enter machine name' }] : undefined}
          fieldProps={{ maxLength: 255 }}
          colProps={{ span: 12 }}
        />
        <ProFormText
          name="hostname"
          label="Hostname"
          rules={mode === 'create' ? [{ required: true, message: 'Please enter hostname' }] : undefined}
          fieldProps={{ maxLength: 255 }}
          colProps={{ span: 12 }}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText
          name="ip_address"
          label="IP Address"
          rules={mode === 'create' ? [{ required: true, message: 'Please enter IP address' }] : undefined}
          colProps={{ span: 8 }}
        />
        <ProFormText
          name="private_ip_address"
          label="Private IP Address"
          colProps={{ span: 8 }}
        />
        <ProFormDigit
          name="port"
          label="SSH Port"
          min={1}
          max={65535}
          rules={mode === 'create' ? [{ required: true, message: 'Please enter port' }] : undefined}
          colProps={{ span: 8 }}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText
          name="username"
          label="SSH Username"
          rules={mode === 'create' ? [{ required: true, message: 'Please enter SSH username' }] : undefined}
          colProps={{ span: 12 }}
        />
        <ProFormText name="os_type" label="OS Type" colProps={{ span: 12 }} />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText.Password
          name="password"
          label="Password"
          tooltip={mode === 'create' ? 'Password and Private Key, at least one is required' : 'Leave blank to keep unchanged'}
          placeholder={mode === 'update' ? 'Leave blank to keep unchanged' : undefined}
          colProps={{ span: 12 }}
        />
        <ProFormTextArea
          name="private_key"
          label="Private Key"
          tooltip={mode === 'create' ? 'Password and Private Key, at least one is required' : 'Leave blank to keep unchanged'}
          placeholder={mode === 'update' ? 'Leave blank to keep unchanged' : undefined}
          fieldProps={{ rows: 3 }}
          colProps={{ span: 12 }}
        />
      </ProForm.Group>

      {mode === 'update' && (
        <ProForm.Group>
          <ProFormSelect
            name="status"
            label="Status"
            options={[
              { label: 'Online', value: 'online' },
              { label: 'Offline', value: 'offline' },
              { label: 'Error', value: 'error' },
            ]}
            colProps={{ span: 12 }}
          />
        </ProForm.Group>
      )}

      <ProForm.Group>
        <ProFormText name="cpu_cores" label="CPU Cores" colProps={{ span: 12 }} />
        <ProFormText name="memory" label="Memory" colProps={{ span: 12 }} />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText name="disk" label="Disk" colProps={{ span: 12 }} />
        <ProFormText name="gpu_info" label="GPU Info" colProps={{ span: 12 }} />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormDigit name="bandwidth" label="Bandwidth (Mbps)" colProps={{ span: 12 }} />
        <ProFormSelect
          name="provider"
          label="Provider"
          options={providerOptions}
          showSearch
          fieldProps={{ optionFilterProp: 'label' }}
          colProps={{ span: 12 }}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormDigit
          name="price"
          label="Price"
          fieldProps={{ precision: 2 }}
          colProps={{ span: 12 }}
        />
        <ProFormSelect
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
          colProps={{ span: 12 }}
        />
      </ProForm.Group>

      <ProForm.Group>
        <ProFormText name="tags" label="Tags" colProps={{ span: 12 }} />
        <ProFormSwitch name="is_active" label="Active" colProps={{ span: 12 }} />
      </ProForm.Group>

      <ProFormText
        name="provider_instance_id"
        label="Provider Instance ID"
        tooltip="供应商平台上的实例 ID"
        fieldProps={{ maxLength: 255 }}
        colProps={{ span: 12 }}
      />
      <ProFormText
        name="provider_nic_id"
        label="NIC ID"
        tooltip="网卡 ID"
        fieldProps={{ maxLength: 255 }}
        colProps={{ span: 12 }}
      />
      <ProFormTextArea name="description" label="Description" colProps={{ span: 24 }} />
    </ModalForm>
  );
};

export default SaveForm;