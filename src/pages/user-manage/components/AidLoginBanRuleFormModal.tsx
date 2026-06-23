import {
  ProFormDatePicker,
  ModalForm,
  ProFormDateTimePicker,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { App, AutoComplete, Form } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { saveAidLoginBanRule, updateAidLoginBanRule } from '@/services/user/api';

type AidLoginBanRuleFormModalProps = {
  open: boolean;
  current?: API.AidLoginBanRuleItem;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

type AidLoginBanRuleFormValues = Omit<
  API.AidLoginBanRuleSaveParams,
  'weeklyWindows' | 'dateWindows'
> & {
  cutoffAt?: string;
  weeklyWindows?: API.AidLoginBanRuleWeeklyWindow[];
  dateWindows?: API.AidLoginBanRuleDateWindow[];
};

const WEEKDAY_OPTIONS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
];

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_TIMEZONE = 'Asia/Shanghai';
const TIMEZONE_OPTIONS = [
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai(UTC+8)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong(UTC+8)' },
  { value: 'Asia/Taipei', label: 'Asia/Taipei(UTC+8)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore(UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo(UTC+9)' },
  { value: 'Asia/Seoul', label: 'Asia/Seoul(UTC+9)' },
  { value: 'Asia/Bangkok', label: 'Asia/Bangkok(UTC+7)' },
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta(UTC+7)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata(UTC+5:30)' },
  { value: 'Europe/Kaliningrad', label: 'Europe/Kaliningrad(UTC+2)' },
  { value: 'Europe/Moscow', label: 'Europe/Moscow(UTC+3)' },
  { value: 'Europe/Samara', label: 'Europe/Samara(UTC+4)' },
  { value: 'Asia/Yekaterinburg', label: 'Asia/Yekaterinburg(UTC+5)' },
  { value: 'Asia/Omsk', label: 'Asia/Omsk(UTC+6)' },
  { value: 'Asia/Novosibirsk', label: 'Asia/Novosibirsk(UTC+7)' },
  { value: 'Asia/Krasnoyarsk', label: 'Asia/Krasnoyarsk(UTC+7)' },
  { value: 'Asia/Irkutsk', label: 'Asia/Irkutsk(UTC+8)' },
  { value: 'Asia/Yakutsk', label: 'Asia/Yakutsk(UTC+9)' },
  { value: 'Asia/Vladivostok', label: 'Asia/Vladivostok(UTC+10)' },
  { value: 'Asia/Magadan', label: 'Asia/Magadan(UTC+11)' },
  { value: 'Asia/Kamchatka', label: 'Asia/Kamchatka(UTC+12)' },
  { value: 'Europe/London', label: 'Europe/London(UTC+0/+1)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin(UTC+1/+2)' },
  { value: 'Europe/Paris', label: 'Europe/Paris(UTC+1/+2)' },
  { value: 'UTC', label: 'UTC(UTC+0)' },
  { value: 'America/New_York', label: 'America/New_York(UTC-5/-4)' },
  { value: 'America/Chicago', label: 'America/Chicago(UTC-6/-5)' },
  { value: 'America/Denver', label: 'America/Denver(UTC-7/-6)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles(UTC-8/-7)' },
  { value: 'America/Sao_Paulo', label: 'America/Sao_Paulo(UTC-3)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney(UTC+10/+11)' },
];

const normalizeTags = (value?: string[]) =>
  (value ?? []).map((item) => String(item).trim()).filter(Boolean);

const normalizeCountries = (value?: string[]) =>
  normalizeTags(value).map((item) => item.toUpperCase());

const AidLoginBanRuleFormModal: React.FC<AidLoginBanRuleFormModalProps> = ({
  open,
  current,
  onOpenChange,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();

  const initialValues = current
    ? {
        ...current,
        timezone: current.timezone || DEFAULT_TIMEZONE,
        cutoffAt: current.cutoffAt || undefined,
        enabled: current.enabled,
        weeklyWindows: current.weeklyWindows ?? [],
        dateWindows: current.dateWindows ?? [],
        packageNames: current.packageNames ?? [],
        projectCodes: current.projectCodes ?? [],
        countries: current.countries ?? [],
      }
    : {
        enabled: true,
        timezone: DEFAULT_TIMEZONE,
        weeklyWindows: [],
        dateWindows: [],
        packageNames: [],
        projectCodes: [],
        countries: [],
      };

  return (
    <ModalForm
      title={current ? `编辑封禁策略 ${current.name}` : '新增封禁策略'}
      open={open}
      initialValues={initialValues}
      modalProps={{ destroyOnHidden: true, width: 760 }}
      onOpenChange={onOpenChange}
      submitter={{ searchConfig: { submitText: current ? '保存' : '新增' } }}
      onFinish={async (values: AidLoginBanRuleFormValues) => {
        const weeklyWindows = (values.weeklyWindows ?? [])
          .filter((item) => item?.weekday || item?.start || item?.end)
          .map((item) => ({
            weekday: Number(item.weekday),
            start: item.start,
            end: item.end,
          }));

        const dateWindows = (values.dateWindows ?? [])
          .filter((item) => item?.date || item?.start || item?.end)
          .map((item) => ({
            date: item.date ? dayjs(item.date).format('YYYY-MM-DD') : '',
            start: item.start,
            end: item.end,
          }));

        const incompleteRange = weeklyWindows.find((item) => !item.weekday || !item.start || !item.end);
        if (incompleteRange) {
          messageApi.error('生效时间段填写后需补全星期、开始时间和结束时间');
          return false;
        }

        const incompleteDateRange = dateWindows.find((item) => !item.date || !item.start || !item.end);
        if (incompleteDateRange) {
          messageApi.error('特定日期生效时间段填写后需补全日期、开始时间和结束时间');
          return false;
        }

        const invalidRange = weeklyWindows.find((item) => item.start && item.end && item.end <= item.start);
        if (invalidRange) {
          messageApi.error('生效时间段的结束时间必须大于开始时间');
          return false;
        }

        const invalidDateRange = dateWindows.find((item) => item.start && item.end && item.end <= item.start);
        if (invalidDateRange) {
          messageApi.error('特定日期生效时间段的结束时间必须大于开始时间');
          return false;
        }

        const timezone = String(values.timezone || '').trim();
        if (!timezone) {
          messageApi.error('请输入规则时区');
          return false;
        }

        const basePayload: API.AidLoginBanRuleSaveParams = {
          name: values.name,
          enabled: values.enabled ?? true,
          timezone,
          cutoffAt: values.cutoffAt ? dayjs(values.cutoffAt).format('YYYY-MM-DD HH:mm:ss') : null,
          weeklyWindows,
          dateWindows,
          packageNames: normalizeTags(values.packageNames),
          projectCodes: normalizeTags(values.projectCodes),
          countries: normalizeCountries(values.countries),
          reason: values.reason || undefined,
        };

        const res = current
          ? await updateAidLoginBanRule({ id: current.id, ...basePayload })
          : await saveAidLoginBanRule(basePayload);

        if (res.code !== 0) {
          messageApi.error(res.msg || '保存失败');
          return false;
        }
        messageApi.success(current ? '封禁策略已更新' : '封禁策略已新增');
        onSuccess();
        return true;
      }}
    >
      <ProFormGroup>
        <ProFormText
          name="name"
          label="规则名称"
          colProps={{ span: 14 }}
          rules={[
            { required: true, message: '请输入规则名称' },
            { max: 191, message: '规则名称最多 191 个字符' },
          ]}
        />
        <ProFormSwitch name="enabled" label="启用" colProps={{ span: 5 }} />
      </ProFormGroup>

      <div
        style={{
          display: 'grid',
          gap: 24,
          gridTemplateColumns: 'minmax(260px, 1fr) minmax(300px, 1fr)',
          marginBottom: 24,
        }}
      >
        <div style={{ minWidth: 0 }}>
        <Form.Item
          name="timezone"
          label="规则时区"
          rules={[
            { required: true, message: '请输入规则时区' },
            { max: 64, message: '规则时区最多 64 个字符' },
          ]}
        >
          <AutoComplete
            options={TIMEZONE_OPTIONS}
            placeholder="选择或输入时区，如 Asia/Shanghai"
            style={{ width: '100%' }}
            filterOption={false}
          />
        </Form.Item>
        </div>
        <div style={{ minWidth: 0 }}>
          <ProFormDateTimePicker
            name="cutoffAt"
            label="有效截止时间"
            placeholder="留空表示不限制截止时间"
            fieldProps={{ format: 'YYYY-MM-DD HH:mm:ss', style: { width: '100%' } }}
          />
        </div>
      </div>

      <ProFormList
        name="weeklyWindows"
        label="生效时间段"
        creatorButtonProps={{ creatorButtonText: '添加时间段' }}
      >
        <ProFormGroup>
          <ProFormSelect
            name="weekday"
            label="星期"
            width="xs"
            options={WEEKDAY_OPTIONS}
          />
          <ProFormText
            name="start"
            label="开始"
            width="xs"
            placeholder="00:00"
            rules={[
              { pattern: TIME_PATTERN, message: '时间格式应为 HH:mm' },
            ]}
          />
          <ProFormText
            name="end"
            label="结束"
            width="xs"
            placeholder="06:00"
            rules={[
              { pattern: TIME_PATTERN, message: '时间格式应为 HH:mm' },
            ]}
          />
        </ProFormGroup>
      </ProFormList>

      <ProFormList
        name="dateWindows"
        label="特定日期生效时间段"
        creatorButtonProps={{ creatorButtonText: '添加日期时间段' }}
      >
        <ProFormGroup>
          <ProFormDatePicker
            name="date"
            label="日期"
            width="xs"
            fieldProps={{ format: 'YYYY-MM-DD' }}
          />
          <ProFormText
            name="start"
            label="开始"
            width="xs"
            placeholder="00:00"
            rules={[
              { pattern: TIME_PATTERN, message: '时间格式应为 HH:mm' },
            ]}
          />
          <ProFormText
            name="end"
            label="结束"
            width="xs"
            placeholder="06:00"
            rules={[
              { pattern: TIME_PATTERN, message: '时间格式应为 HH:mm' },
            ]}
          />
        </ProFormGroup>
      </ProFormList>

      <ProFormSelect
        name="packageNames"
        label="封禁匹配包名列表"
        mode="tags"
        width="xl"
        fieldProps={{ tokenSeparators: [','], style: { width: '100%' } }}
        placeholder="可留空；最终包名为空时不参与封禁检测"
      />
      <ProFormSelect
        name="projectCodes"
        label="封禁匹配项目代号"
        mode="tags"
        width="xl"
        fieldProps={{ tokenSeparators: [','], style: { width: '100%' } }}
        placeholder="可留空；保存时合并项目关联包名"
      />
      <ProFormSelect
        name="countries"
        label="封禁匹配国家列表"
        mode="tags"
        width="xl"
        fieldProps={{ tokenSeparators: [','], style: { width: '100%' } }}
        placeholder="留空表示不限制"
      />

      <ProFormTextArea
        name="reason"
        label="封禁原因"
        fieldProps={{ rows: 3, maxLength: 500, showCount: true }}
        rules={[{ max: 500, message: '封禁原因最多 500 个字符' }]}
      />
    </ModalForm>
  );
};

export default AidLoginBanRuleFormModal;
