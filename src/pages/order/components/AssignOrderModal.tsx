import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { App, Form } from 'antd';
import React from 'react';
import { assignOrder } from '@/services/order/api';

const PERIOD_OPTIONS = [
  { label: '月付', value: 'month_price' },
  { label: '季付', value: 'quarter_price' },
  { label: '半年付', value: 'half_year_price' },
  { label: '年付', value: 'year_price' },
  { label: '两年付', value: 'two_year_price' },
  { label: '三年付', value: 'three_year_price' },
  { label: '一次性', value: 'onetime_price' },
  { label: '重置流量', value: 'reset_price' },
];

interface AssignOrderModalProps {
  open: boolean;
  plans: API.PlanItem[];
  onOpenChange: (open: boolean) => void;
  onSuccess: (tradeNo: string) => void;
}

const AssignOrderModal: React.FC<AssignOrderModalProps> = ({
  open,
  plans,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [form] = Form.useForm();

  return (
    <ModalForm
      title="分配订单（管理员开通套餐）"
      open={open}
      form={form}
      width={480}
      modalProps={{ destroyOnHidden: true }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        const payload: API.OrderAssignParams = {
          plan_id: values.plan_id,
          email: values.email,
          total_amount: Math.round(Number(values.total_amount_yuan) * 100),
          period: values.period,
        };
        const res = await assignOrder(payload);
        if (res.code !== 0) {
          messageApi.error(res.msg || '分配失败');
          return false;
        }
        messageApi.success(`订单已创建，交易号：${res.data}`);
        onSuccess(res.data);
        return true;
      }}
    >
      <ProFormText
        name="email"
        label="用户邮箱"
        rules={[
          { required: true, message: '请输入用户邮箱' },
          { type: 'email', message: '邮箱格式不正确' },
        ]}
      />
      <ProFormSelect
        name="plan_id"
        label="套餐"
        rules={[{ required: true, message: '请选择套餐' }]}
        options={plans.map((p) => ({ label: p.name, value: p.id }))}
      />
      <ProFormSelect
        name="period"
        label="订阅周期"
        rules={[{ required: true, message: '请选择周期' }]}
        options={PERIOD_OPTIONS}
      />
      <ProFormDigit
        name="total_amount_yuan"
        label="支付金额 (元)"
        rules={[{ required: true, message: '请输入支付金额' }]}
        fieldProps={{ min: 0, precision: 2, addonBefore: '¥' }}
        tooltip="管理员手动定价，不受套餐价格限制"
      />
    </ModalForm>
  );
};

export default AssignOrderModal;
