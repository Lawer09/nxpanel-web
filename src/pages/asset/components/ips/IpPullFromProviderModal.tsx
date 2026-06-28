import { Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import React, { useEffect } from 'react';

const PULL_STATUS_OPTIONS = [
  { label: 'All statuses', value: undefined },
  { label: 'bound', value: 'bound' },
  { label: 'unbound', value: 'unbound' },
  { label: 'binding', value: 'binding' },
  { label: 'unavailable', value: 'unavailable' },
  { label: 'available', value: 'available' },
];

type Props = {
  open: boolean;
  loading: boolean;
  accounts: API.AssetProviderAccount[];
  initialValues?: Partial<API.AssetIpPullFromProviderParams>;
  onCancel: () => void;
  onSubmit: (values: API.AssetIpPullFromProviderParams) => Promise<void>;
};

const IpPullFromProviderModal: React.FC<Props> = ({
  open,
  loading,
  accounts,
  initialValues,
  onCancel,
  onSubmit,
}) => {
  const [form] = Form.useForm<API.AssetIpPullFromProviderParams>();

  useEffect(() => {
    if (!open) {
      return;
    }
    form.setFieldsValue({
      account_id: initialValues?.account_id,
      region: initialValues?.region,
      status: initialValues?.status,
      page: initialValues?.page ?? 1,
      page_size: initialValues?.page_size ?? 50,
      refresh: initialValues?.refresh ?? false,
    });
  }, [form, initialValues, open]);

  return (
    <Modal
      title="Pull IPs From Provider"
      open={open}
      destroyOnHidden
      confirmLoading={loading}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(values);
      }}
    >
      <Form<API.AssetIpPullFromProviderParams> form={form} layout="vertical">
        <Form.Item
          name="account_id"
          label="Provider Account"
          rules={[{ required: true, message: 'Please select provider account.' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            options={accounts.map((item) => ({
              label: `${item.name} (#${item.id})`,
              value: item.id,
            }))}
          />
        </Form.Item>
        <Form.Item name="region" label="Region">
          <Input placeholder="Optional region filter" />
        </Form.Item>
        <Form.Item name="status" label="Provider Status Filter">
          <Select allowClear options={PULL_STATUS_OPTIONS.slice(1)} />
        </Form.Item>
        <Form.Item name="page" label="Provider Page">
          <InputNumber min={1} precision={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="page_size" label="Provider Page Size">
          <InputNumber
            min={1}
            max={200}
            precision={0}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item name="refresh" label="Force Refresh" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default IpPullFromProviderModal;
