import { PlusOutlined } from '@ant-design/icons';
import { Button, Dropdown, Input, Modal, Select } from 'antd';
import React from 'react';

export interface ViewItem {
  id: string;
  name: string;
}

interface ViewManagerProps {
  views: ViewItem[];
  selectedId?: string;
  saveInputValue: string;
  renameModalOpen: boolean;
  renameInputValue: string;
  isAdding: boolean;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onSelect: (id?: string) => void;
  onSave: () => void;
  onSaveInputChange: (value: string) => void;
  onOpenRename: () => void;
  onRenameInputChange: (value: string) => void;
  onRenameConfirm: () => void;
  onRenameCancel: () => void;
  onDelete: () => void;
}

function ViewManager({
  views,
  selectedId,
  saveInputValue,
  renameModalOpen,
  renameInputValue,
  isAdding,
  onStartAdd,
  onCancelAdd,
  onSelect,
  onSave,
  onSaveInputChange,
  onOpenRename,
  onRenameInputChange,
  onRenameConfirm,
  onRenameCancel,
  onDelete,
}: ViewManagerProps) {
  const hasSelection = !!selectedId;

  const actionArea = hasSelection ? (
    <Dropdown.Button
      menu={{
        items: [
          { key: 'rename', label: '重命名', onClick: onOpenRename },
          { key: 'delete', label: '删除', danger: true, onClick: onDelete },
        ],
      }}
      onClick={onSave}
    >
      保存
    </Dropdown.Button>
  ) : isAdding ? (
    <>
      <Input
        style={{ width: 180 }}
        placeholder="输入视图名称"
        value={saveInputValue}
        onChange={(e) => onSaveInputChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSave();
          }
        }}
      />
      <Button type="primary" onClick={onSave}>
        保存
      </Button>
      <Button onClick={onCancelAdd}>
        取消
      </Button>
    </>
  ) : (
    <Button icon={<PlusOutlined />} onClick={onStartAdd}>
      新增
    </Button>
  );

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
      <Select
        value={selectedId}
        style={{ width: 200, minWidth: 200 }}
        allowClear
        popupMatchSelectWidth={200}
        placeholder="选择视图"
        options={views.map((view) => ({ label: view.name, value: view.id }))}
        onChange={(id) => onSelect(id)}
      />
      {actionArea}
      <Modal
        title="重命名视图"
        open={renameModalOpen}
        onOk={onRenameConfirm}
        onCancel={onRenameCancel}
        okText="确定"
        cancelText="取消"
      >
        <Input
          value={renameInputValue}
          onChange={(e) => onRenameInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameConfirm();
          }}
          placeholder="输入新名称"
        />
      </Modal>
    </div>
  );
}

export default ViewManager;
