import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { useRequest } from '@umijs/max';
import { updateUser } from '@/services/swagger/user';
import { fetchPlans } from '@/services/swagger/plan';

type UserFormModalProps = {
  open: boolean;
  current?: API.UserItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();

  const { data: plansRes } = useRequest(fetchPlans, { cacheKey: 'plan-list' });
  const planOptions = [
    { label: '无套餐', value: null },
    ...((plansRes as any) ?? []).map((p: API.PlanItem) => ({
      label: p.name,
      value: p.id,
    })),
  ];

  const initialValues = current
    ? {
        ...current,
        expired_at: current.expired_at
          ? dayjs.unix(current.expired_at).format('YYYY-MM-DD HH:mm:ss')
          : undefined,
        transfer_enable_gb:
          current.transfer_enable != null
            ? +(current.transfer_enable / 1073741824).toFixed(2)
            : undefined,
      }
    : {};

  return (
    <ModalForm
      title={`编辑用户 — ${current?.email || ''}`}
      open={open}
      initialValues={initialValues}
      modalProps={{ destroyOnHidden: true, width: 640 }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        const payload: API.UserUpdateParams = {
          id: current!.id,
        };

        if (values.email !== current?.email) payload.email = values.email;
        if (values.password) payload.password = values.password;
        if (values.transfer_enable_gb != null)
          payload.transfer_enable = Math.round(
            values.transfer_enable_gb * 1073741824,
          );
        if (values.expired_at !== undefined) {
          payload.expired_at = values.expired_at
            ? dayjs(values.expired_at).unix()
            : null;
        }
        if (values.banned !== undefined) payload.banned = values.banned ? 1 : 0;
        if (values.is_admin !== undefined)
          payload.is_admin = values.is_admin ? 1 : 0;
        if (values.is_staff !== undefined)
          payload.is_staff = values.is_staff ? 1 : 0;
        if (values.plan_id !== undefined)
          payload.plan_id = values.plan_id || null;
        if (values.balance != null) payload.balance = values.balance;
        if (values.commission_balance != null)
          payload.commission_balance = values.commission_balance;
        if (values.commission_rate != null)
          payload.commission_rate = values.commission_rate;
        if (values.commission_type != null)
          payload.commission_type = values.commission_type;
        if (values.discount != null) payload.discount = values.discount;
        if (values.speed_limit !== undefined)
          payload.speed_limit = values.speed_limit || null;
        if (values.device_limit !== undefined)
          payload.device_limit = values.device_limit || null;
        if (values.remarks !== undefined)
          payload.remarks = values.remarks || null;
        if (values.invite_user_email)
          payload.invite_user_email = values.invite_user_email;

        const res = await updateUser(payload);
        if (res.code !== 0) {
          messageApi.error(res.msg || '保存失败');
          return false;
        }
        messageApi.success('用户已更新');
        onSuccess();
        return true;
      }}
    >
      <ProFormText
        name="email"
        label="邮箱"
        rules={[{ required: true, type: 'email', message: '请输入合法邮箱' }]}
      />
      <ProFormText.Password
        name="password"
        label="密码"
        placeholder="不填则不修改"
        rules={[{ min: 8, message: '密码至少 8 位' }]}
      />
      <ProFormDigit
        name="transfer_enable_gb"
        label="总流量 (GB)"
        min={0}
        fieldProps={{ precision: 2 }}
        placeholder="留空则不修改"
      />
      <ProFormDateTimePicker
        name="expired_at"
        label="过期时间"
        placeholder="留空则永不过期"
        fieldProps={{ format: 'YYYY-MM-DD HH:mm:ss', allowClear: true }}
      />
      <ProFormDigit
        name="balance"
        label="余额 (元)"
        min={0}
        fieldProps={{ precision: 2, step: 0.01 }}
      />
      <ProFormDigit
        name="commission_balance"
        label="佣金余额 (元)"
        min={0}
        fieldProps={{ precision: 2, step: 0.01 }}
      />
      <ProFormSelect
        name="plan_id"
        label="套餐"
        options={planOptions}
        placeholder="选择套餐"
        allowClear
        fieldProps={{ allowClear: true }}
      />
      <ProFormDigit
        name="speed_limit"
        label="限速 (Mbps)"
        min={0}
        placeholder="留空则不限"
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name="device_limit"
        label="设备数量限制"
        min={0}
        placeholder="留空则不限"
        fieldProps={{ precision: 0 }}
      />
      <ProFormDigit
        name="commission_rate"
        label="返佣比例 (%)"
        min={0}
        max={100}
        fieldProps={{ precision: 0 }}
      />
      <ProFormSelect
        name="commission_type"
        label="返佣类型"
        options={[
          { label: '跟随系统', value: 0 },
          { label: '循环返佣', value: 1 },
          { label: '一次性返佣', value: 2 },
        ]}
      />
      <ProFormDigit
        name="discount"
        label="专属折扣 (%)"
        min={0}
        max={100}
        fieldProps={{ precision: 0 }}
      />
      <ProFormText
        name="invite_user_email"
        label="邀请人邮箱"
        placeholder="设置邀请人（可选）"
      />
      <ProFormTextArea name="remarks" label="备注" />
      <ProFormSwitch name="banned" label="封禁" />
      <ProFormSwitch name="is_admin" label="管理员" />
      <ProFormSwitch name="is_staff" label="员工" />
    </ModalForm>
  );
};

export default UserFormModal;
