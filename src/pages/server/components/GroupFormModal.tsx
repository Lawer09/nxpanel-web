import React from 'react';
import { ModalForm, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';
import { saveServerGroup } from '@/services/swagger/server';

type GroupFormModalProps = {
  open: boolean;
  group?: API.ServerGroup;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const GroupFormModal: React.FC<GroupFormModalProps> = ({
  open,
  group,
  onOpenChange,
  onSuccess,
}) => {
  return (
    <ModalForm<API.ServerGroupSaveParams>
      title={group ? '编辑权限组' : '新建权限组'}
      open={open}
      initialValues={group || { name: '' }}
      modalProps={{
        destroyOnClose: true,
      }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        try {
          await saveServerGroup({
            id: group?.id,
            name: values.name,
          });
          message.success(group ? '权限组已更新' : '权限组已创建');
          onSuccess();
          return true;
        } catch (error: any) {
          message.error(error?.message || '权限组保存失败');
          return false;
        }
      }}
    >
      <ProFormText
        name="name"
        label="组名"
        rules={[{ required: true, message: '请输入组名' }]}
      />
    </ModalForm>
  );
};

export default GroupFormModal;
