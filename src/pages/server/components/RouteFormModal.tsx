import React from 'react';
import { ModalForm, ProFormSelect, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';
import { saveServerRoute } from '@/services/swagger/server';

type RouteFormModalValues = Partial<API.ServerRouteSaveParams> & {
  match?: string[];
};

type RouteFormModalProps = {
  open: boolean;
  route?: API.ServerRoute;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const RouteFormModal: React.FC<RouteFormModalProps> = ({
  open,
  route,
  onOpenChange,
  onSuccess,
}) => {
  return (
    <ModalForm<RouteFormModalValues>
      title={route ? '编辑路由' : '新建路由'}
      open={open}
      initialValues={
        route
          ? {
              ...route,
              match: route.match || [],
            }
          : {
              action: 'block',
              match: [],
            }
      }
      modalProps={{
        destroyOnHidden: true,
      }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        try {
          await saveServerRoute({
            id: route?.id,
            remarks: String(values.remarks || ''),
            match: values.match || [],
            action: (values.action || 'block') as 'block' | 'dns',
            action_value: values.action_value,
          });
          message.success(route ? '路由已更新' : '路由已创建');
          onSuccess();
          return true;
        } catch (error: any) {
          message.error(error?.message || '路由保存失败');
          return false;
        }
      }}
    >
      <ProFormText
        name="remarks"
        label="备注"
        rules={[{ required: true, message: '请输入备注' }]}
      />
      <ProFormSelect
        name="match"
        label="匹配规则"
        mode="tags"
        fieldProps={{ tokenSeparators: [','] }}
        rules={[{ required: true, message: '请输入匹配规则' }]}
      />
      <ProFormSelect
        name="action"
        label="动作"
        options={[
          { label: 'block', value: 'block' },
          { label: 'dns', value: 'dns' },
        ]}
        rules={[{ required: true, message: '请选择动作' }]}
      />
      <ProFormText name="action_value" label="动作值" />
    </ModalForm>
  );
};

export default RouteFormModal;
