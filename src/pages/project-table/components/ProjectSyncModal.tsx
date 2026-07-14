import { App, DatePicker, Form, Modal, Segmented, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  STANDARD_DATE_PRESET_ITEMS,
  toRangePickerPresets,
} from '@/components/report/reportDatePreset';
import { aggregateHourly, aggregateSync, getProjects } from '@/services/project/api';
import type { ProjectItem } from '@/services/project/types';

const { RangePicker } = DatePicker;

const DATE_PRESETS = toRangePickerPresets(STANDARD_DATE_PRESET_ITEMS);
const DEFAULT_SYNC_HOUR = (dayjs().hour() + 23) % 24;
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, hour) => ({
  label: `${String(hour).padStart(2, '0')}:00`,
  value: hour,
}));

type SyncMode = 'daily' | 'hourly';

type ProjectSyncModalProps = {
  open: boolean;
  onClose: () => void;
};

type ProjectSyncFormValues = {
  mode: SyncMode;
  dateRange: [Dayjs, Dayjs];
  hourFrom?: number;
  hourTo?: number;
  projectId?: number;
};

const createDefaultFormValues = (): ProjectSyncFormValues => ({
  mode: 'daily',
  dateRange: [dayjs(), dayjs()],
  hourFrom: DEFAULT_SYNC_HOUR,
  hourTo: DEFAULT_SYNC_HOUR,
  projectId: undefined,
});

const ProjectSyncModal: React.FC<ProjectSyncModalProps> = ({ open, onClose }) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<ProjectSyncFormValues>();
  const syncMode = Form.useWatch('mode', form) || 'daily';
  const [submitting, setSubmitting] = useState(false);
  const [projectItems, setProjectItems] = useState<ProjectItem[]>([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const projectOptionsLoadedRef = useRef(false);

  const projectOptions = useMemo(
    () =>
      projectItems.map((item) => ({
        label: item.projectName ? `${item.projectCode} / ${item.projectName}` : item.projectCode,
        value: item.id,
      })),
    [projectItems],
  );

  const loadProjects = useCallback(async () => {
    setProjectLoading(true);
    try {
      const res = await getProjects({
        page: 1,
        pageSize: 200,
      });
      if (res.code !== 0) {
        message.error(res.msg || '获取项目列表失败');
        return;
      }

      const nextItems = (res.data?.data ?? []).filter(
        (item): item is ProjectItem => Boolean(item?.id) && Boolean(item?.projectCode),
      );
      setProjectItems(nextItems);
    } finally {
      setProjectLoading(false);
    }
  }, [message]);

  useEffect(() => {
    if (!open) {
      return;
    }

    form.setFieldsValue(createDefaultFormValues());

    if (!projectOptionsLoadedRef.current) {
      projectOptionsLoadedRef.current = true;
      void loadProjects();
    }
  }, [form, loadProjects, open]);

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      const [startDate, endDate] = values.dateRange;
      const resolvedHourFrom = values.hourFrom ?? values.hourTo;
      const resolvedHourTo = values.hourTo ?? values.hourFrom;

      if (
        values.mode === 'hourly' &&
        resolvedHourFrom !== undefined &&
        resolvedHourTo !== undefined &&
        resolvedHourFrom > resolvedHourTo
      ) {
        message.error('开始小时不能大于结束小时');
        return;
      }

      setSubmitting(true);
      const commonPayload = {
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
      };
      const projectPayload = values.projectId !== undefined ? { projectId: values.projectId } : {};
      const res =
        values.mode === 'hourly'
          ? await aggregateHourly({
              ...commonPayload,
              ...projectPayload,
              ...(resolvedHourFrom !== undefined ? { hourFrom: resolvedHourFrom } : {}),
              ...(resolvedHourTo !== undefined ? { hourTo: resolvedHourTo } : {}),
            })
          : await aggregateSync({
              ...commonPayload,
              ...projectPayload,
            });

      if (res.code !== 0 || (values.mode === 'hourly' && !res.data?.success)) {
        message.error(
          res.msg || (values.mode === 'hourly' ? res.data?.output || '小时同步失败' : '日同步失败'),
        );
        return;
      }

      message.success(values.projectId ? '项目同步已完成' : '全部项目同步已完成');
      onClose();
    } catch (error) {
      if ((error as { errorFields?: unknown[] } | undefined)?.errorFields) {
        return;
      }
      message.error(syncMode === 'hourly' ? '小时同步失败' : '日同步失败');
    } finally {
      setSubmitting(false);
    }
  }, [form, message, onClose, syncMode]);

  return (
    <Modal
      destroyOnHidden
      title="同步"
      open={open}
      confirmLoading={submitting}
      okText="开始同步"
      onCancel={() => {
        if (submitting) return;
        onClose();
      }}
      onOk={handleSubmit}
    >
      <Form form={form} layout="vertical" initialValues={createDefaultFormValues()}>
        <Form.Item name="mode" label="同步类型">
          <Segmented
            block
            options={[
              { label: '日同步', value: 'daily' },
              { label: '小时同步', value: 'hourly' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="dateRange"
          label="日期范围"
          rules={[{ required: true, message: '请选择日期范围' }]}
        >
          <RangePicker allowClear={false} presets={DATE_PRESETS} />
        </Form.Item>
        {syncMode === 'hourly' ? (
          <Form.Item label="小时范围">
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item name="hourFrom" noStyle>
                <Select allowClear style={{ width: '50%' }} options={HOUR_OPTIONS} placeholder="开始小时" />
              </Form.Item>
              <Form.Item name="hourTo" noStyle>
                <Select allowClear style={{ width: '50%' }} options={HOUR_OPTIONS} placeholder="结束小时" />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        ) : null}
        <Form.Item name="projectId" label="项目代号">
          <Select
            allowClear
            showSearch
            loading={projectLoading}
            optionFilterProp="label"
            placeholder="留空则同步全部项目"
            options={projectOptions}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProjectSyncModal;
