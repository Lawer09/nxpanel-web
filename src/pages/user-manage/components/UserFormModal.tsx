import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormGroup,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, Divider } from 'antd';
import dayjs from 'dayjs';
import React, { useMemo } from 'react';
import { useRequest } from '@umijs/max';
import { updateUser } from '@/services/user/api';
import { fetchPlans } from '@/services/plan/api';

type UserFormModalProps = {
  open: boolean;
  current?: API.UserItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

const META_FIELDS: { name: keyof API.RegisterMetadata; label: string }[] = [
  { name: 'app_id', label: '包名' },
  { name: 'app_version', label: '应用版本' },
  { name: 'channel_type', label: '渠道' },
  { name: 'platform', label: '平台' },
  { name: 'country', label: '国家' },
  { name: 'city', label: '城市' },
  { name: 'brand', label: '品牌' },
  { name: 'utm_source', label: '来源' },
  { name: 'utm_medium', label: '媒介' },
  { name: 'raw_referrer', label: 'Referrer' },
];

const UserFormModal: React.FC<UserFormModalProps> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();

  const { data: plansRes } = useRequest(fetchPlans, { cacheKey: 'plan-list' });
  const planOptions = useMemo(
    () => [
      { label: '无套餐', value: null },
      ...((plansRes as any) ?? []).map((p: API.PlanItem) => ({
        label: p.name,
        value: p.id,
      })),
    ],
    [plansRes],
  );

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
        register_metadata: current.register_metadata ?? {},
      }
    : {};

  const metaInitial =
    current?.register_metadata && Object.keys(current.register_metadata).length > 0;

  return (
    <ModalForm
      title={`编辑用户 — ${current?.email || ''}`}
      open={open}
      initialValues={initialValues}
      modalProps={{ destroyOnHidden: true, width: 720 }}
      onOpenChange={onOpenChange}
      onFinish={async (values) => {
        const payload: API.UserUpdateParams = {
          id: current!.id,
        };

        if (values.email !== current?.email) payload.email = values.email;
        if (values.password) payload.password = values.password;
        if (values.transfer_enable_gb != null)
          payload.transfer_enable = Math.round(values.transfer_enable_gb * 1073741824);
        if (values.expired_at !== undefined) {
          payload.expired_at = values.expired_at
            ? dayjs(values.expired_at).unix()
            : null;
        }
        if (values.banned !== undefined) payload.banned = values.banned ? 1 : 0;
        if (values.is_admin !== undefined) payload.is_admin = values.is_admin ? 1 : 0;
        if (values.is_staff !== undefined) payload.is_staff = values.is_staff ? 1 : 0;
        if (values.plan_id !== undefined) payload.plan_id = values.plan_id || null;
        if (values.balance != null) payload.balance = values.balance;
        if (values.commission_balance != null) payload.commission_balance = values.commission_balance;
        if (values.commission_rate != null) payload.commission_rate = values.commission_rate;
        if (values.commission_type != null) payload.commission_type = values.commission_type;
        if (values.discount != null) payload.discount = values.discount;
        if (values.speed_limit !== undefined) payload.speed_limit = values.speed_limit || null;
        if (values.device_limit !== undefined) payload.device_limit = values.device_limit || null;
        if (values.remarks !== undefined) payload.remarks = values.remarks || null;
        if (values.invite_user_email) payload.invite_user_email = values.invite_user_email;

        const meta = values.register_metadata ?? {};
        const hasMeta = META_FIELDS.some((f) => meta[f.name] !== current?.register_metadata?.[f.name]);
        if (hasMeta) {
          payload.register_metadata = Object.fromEntries(
            META_FIELDS.map((f) => [f.name, meta[f.name] ?? null]),
          );
        }

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
      <ProFormGroup>
        <ProFormText
          name="email"
          label="邮箱"
          colProps={{ span: 12 }}
          rules={[{ required: true, type: 'email', message: '请输入合法邮箱' }]}
        />
        <ProFormText.Password
          name="password"
          label="密码"
          colProps={{ span: 12 }}
          placeholder="不填则不修改"
          rules={[{ min: 8, message: '密码至少 8 位' }]}
        />
      </ProFormGroup>

      <ProFormGroup>
        <ProFormSelect
          name="plan_id"
          label="套餐"
          colProps={{ span: 12 }}
          options={planOptions}
          placeholder="选择套餐"
          allowClear
        />
        <ProFormDateTimePicker
          name="expired_at"
          label="过期时间"
          colProps={{ span: 12 }}
          placeholder="留空则永不过期"
          fieldProps={{ format: 'YYYY-MM-DD HH:mm:ss', allowClear: true }}
        />
      </ProFormGroup>

      <ProFormGroup>
        <ProFormDigit
          name="transfer_enable_gb"
          label="总流量 (GB)"
          colProps={{ span: 12 }}
          min={0}
          fieldProps={{ precision: 2 }}
          placeholder="留空则不修改"
        />
        <ProFormDigit
          name="balance"
          label="余额 (元)"
          colProps={{ span: 12 }}
          min={0}
          fieldProps={{ precision: 2, step: 0.01 }}
        />
      </ProFormGroup>

      <ProFormGroup>
        <ProFormDigit
          name="commission_balance"
          label="佣金余额 (元)"
          colProps={{ span: 12 }}
          min={0}
          fieldProps={{ precision: 2, step: 0.01 }}
        />
        <ProFormDigit
          name="commission_rate"
          label="返佣比例 (%)"
          colProps={{ span: 12 }}
          min={0}
          max={100}
          fieldProps={{ precision: 0 }}
        />
      </ProFormGroup>

      <ProFormGroup>
        <ProFormSelect
          name="commission_type"
          label="返佣类型"
          colProps={{ span: 12 }}
          options={[
            { label: '跟随系统', value: 0 },
            { label: '循环返佣', value: 1 },
            { label: '一次性返佣', value: 2 },
          ]}
        />
        <ProFormDigit
          name="discount"
          label="专属折扣 (%)"
          colProps={{ span: 12 }}
          min={0}
          max={100}
          fieldProps={{ precision: 0 }}
        />
      </ProFormGroup>

      <ProFormGroup>
        <ProFormDigit
          name="speed_limit"
          label="限速 (Mbps)"
          colProps={{ span: 12 }}
          min={0}
          placeholder="留空则不限"
        />
        <ProFormDigit
          name="device_limit"
          label="设备数量限制"
          colProps={{ span: 12 }}
          min={0}
          placeholder="留空则不限"
        />
      </ProFormGroup>

      <ProFormGroup>
        <ProFormText
          name="invite_user_email"
          label="邀请人邮箱"
          colProps={{ span: 12 }}
          placeholder="设置邀请人（可选）"
        />
        <ProFormTextArea
          name="remarks"
          label="备注"
          colProps={{ span: 12 }}
          placeholder="备注信息（可选）"
        />
      </ProFormGroup>

      <ProFormGroup>
        <ProFormSwitch name="banned" label="封禁" colProps={{ span: 8 }} />
        <ProFormSwitch name="is_admin" label="管理员" colProps={{ span: 8 }} />
        <ProFormSwitch name="is_staff" label="员工" colProps={{ span: 8 }} />
      </ProFormGroup>

      <Divider style={{ margin: '8px 0' }} />
      <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#333' }}>
        注册元数据
      </div>
      <ProFormGroup>
        {META_FIELDS.map((field) => (
          <ProFormText
            key={field.name}
            name={['register_metadata', field.name]}
            label={field.label}
            colProps={{ span: 12 }}
            placeholder={metaInitial ? undefined : '留空则不修改'}
          />
        ))}
      </ProFormGroup>
    </ModalForm>
  );
};

export default UserFormModal;
