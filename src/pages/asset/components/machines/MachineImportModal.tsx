import { Input, Modal, Select, Space } from 'antd';
import React from 'react';

type Props = {
  open: boolean;
  accounts: API.AssetProviderAccount[];
  accountId?: number;
  region?: string;
  saving: boolean;
  onAccountIdChange: (value?: number) => void;
  onRegionChange: (value?: string) => void;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
};

const MachineImportModal: React.FC<Props> = ({
  open,
  accounts,
  accountId,
  region,
  saving,
  onAccountIdChange,
  onRegionChange,
  onCancel,
  onSubmit,
}) => (
  <Modal
    title="Import Machines From Provider"
    open={open}
    destroyOnHidden
    confirmLoading={saving}
    onCancel={onCancel}
    onOk={onSubmit}
  >
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Select
        showSearch
        value={accountId}
        optionFilterProp="label"
        options={accounts.map((item) => ({
          label: `${item.name} (#${item.id})`,
          value: item.id,
        }))}
        onChange={onAccountIdChange}
        placeholder="Select account"
      />
      <Input
        value={region}
        onChange={(event) => onRegionChange(event.target.value)}
        placeholder="Region"
      />
    </Space>
  </Modal>
);

export default MachineImportModal;
