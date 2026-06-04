import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPlans } from '@/services/plan/api';
import {
  fetchWooCommerceOrderMapping,
  saveWooCommerceOrderMapping,
} from '@/services/woocommerce-order-mapping/api';
import styles from './SystemConfigEntry.module.less';

const { Text } = Typography;

type ConfigKey = 'woocommerce-order-mapping';

type MappingFormValues = {
  mappings: API.WooCommerceOrderMappingItem[];
};

const CONFIG_ITEMS: Array<{
  key: ConfigKey;
  title: string;
  description: string;
}> = [
  {
    key: 'woocommerce-order-mapping',
    title: '订单映射配置',
    description: '维护 WooCommerce 商品与本地套餐、周期的对应关系',
  },
];

const PERIOD_LABELS: Record<string, string> = {
  weekly: '周付',
  monthly: '月付',
  quarterly: '季付',
  half_yearly: '半年付',
  yearly: '年付',
  two_yearly: '两年付',
  three_yearly: '三年付',
  onetime: '一次性',
  reset_traffic: '重置流量',
};

const normalizeFetchData = (
  res: API.ApiResponse<API.WooCommerceOrderMappingFetchData>,
): API.WooCommerceOrderMappingFetchData => {
  const data = (res as any)?.data?.data ?? res.data ?? {};
  return {
    mappings: Array.isArray(data.mappings) ? data.mappings : [],
    periods: Array.isArray(data.periods) ? data.periods : [],
  };
};

const SystemConfigEntry: React.FC = () => {
  const { message } = App.useApp();
  const [form] = Form.useForm<MappingFormValues>();

  const [open, setOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeKey, setActiveKey] = useState<ConfigKey>('woocommerce-order-mapping');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<API.PlanItem[]>([]);
  const [periods, setPeriods] = useState<string[]>([]);
  const [planLoadFailed, setPlanLoadFailed] = useState(false);

  const planOptions = useMemo(
    () =>
      plans.map((plan) => ({
        label: `${plan.name} (#${plan.id})`,
        value: plan.id,
      })),
    [plans],
  );

  const periodOptions = useMemo(
    () =>
      periods.map((period) => ({
        label: PERIOD_LABELS[period] ? `${PERIOD_LABELS[period]} (${period})` : period,
        value: period,
      })),
    [periods],
  );

  const filteredConfigItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return CONFIG_ITEMS;
    return CONFIG_ITEMS.filter((item) => {
      const targetText = `${item.title} ${item.description} ${item.key}`.toLowerCase();
      return targetText.includes(keyword);
    });
  }, [searchKeyword]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setPlanLoadFailed(false);

    const [mappingResult, planResult] = await Promise.allSettled([
      fetchWooCommerceOrderMapping(),
      fetchPlans(),
    ]);

    if (mappingResult.status === 'fulfilled') {
      const res = mappingResult.value;
      if (res.code === 0) {
        const data = normalizeFetchData(res);
        setPeriods(data.periods);
        form.setFieldsValue({ mappings: data.mappings });
      } else {
        message.error(res.msg || '加载订单映射配置失败');
        form.setFieldsValue({ mappings: [] });
        setPeriods([]);
      }
    } else {
      message.error('加载订单映射配置失败');
      form.setFieldsValue({ mappings: [] });
      setPeriods([]);
    }

    if (planResult.status === 'fulfilled') {
      const res = planResult.value;
      if (res.code === 0 && Array.isArray(res.data)) {
        setPlans(res.data);
      } else {
        setPlans([]);
        setPlanLoadFailed(true);
        message.error(res.msg || '加载套餐列表失败');
      }
    } else {
      setPlans([]);
      setPlanLoadFailed(true);
      message.error('加载套餐列表失败');
    }

    setLoading(false);
  }, [form, message]);

  useEffect(() => {
    if (open) {
      void loadData();
    }
  }, [loadData, open]);

  const validateDuplicateProductIds = (mappings: API.WooCommerceOrderMappingItem[]) => {
    const productIds = mappings.map((item) => Number(item.product_id));
    const seen = new Set<number>();
    const duplicated = productIds.find((id) => {
      if (seen.has(id)) return true;
      seen.add(id);
      return false;
    });
    if (duplicated !== undefined) {
      message.error(`WooCommerce Product ID ${duplicated} 已重复`);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (planLoadFailed) {
      message.error('套餐列表加载失败，请刷新后再保存');
      return;
    }

    const values = await form.validateFields();
    const mappings = values.mappings ?? [];
    if (!validateDuplicateProductIds(mappings)) return;

    const payload: API.WooCommerceOrderMappingSaveParams = {
      mappings: mappings.map((item) => ({
        product_id: Number(item.product_id),
        plan_id: Number(item.plan_id),
        period: item.period,
      })),
    };

    setSaving(true);
    try {
      const res = await saveWooCommerceOrderMapping(payload);
      if (res.code !== 0) {
        message.error(res.msg || '保存订单映射配置失败');
        return;
      }
      message.success('订单映射配置已保存');
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const renderWooCommerceMapping = () => (
    <Form form={form} layout="vertical" initialValues={{ mappings: [] }}>
      <Form.List name="mappings">
        {(fields, { add, remove }) => {
          const columns: ColumnsType<(typeof fields)[number]> = [
            {
              title: 'WooCommerce Product ID',
              width: 210,
              render: (_, field) => (
                <Form.Item
                  className={styles.inlineFormItem}
                  name={[field.name, 'product_id']}
                  rules={[
                    { required: true, message: '请输入 Product ID' },
                    {
                      validator: async (_, value) => {
                        if (!Number.isInteger(Number(value)) || Number(value) <= 0) {
                          throw new Error('Product ID 必须为正整数');
                        }
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={1}
                    precision={0}
                    style={{ width: '100%' }}
                    placeholder="例如 68"
                  />
                </Form.Item>
              ),
            },
            {
              title: '本地套餐',
              render: (_, field) => (
                <Form.Item
                  className={styles.inlineFormItem}
                  name={[field.name, 'plan_id']}
                  rules={[{ required: true, message: '请选择本地套餐' }]}
                >
                  <Select
                    showSearch
                    disabled={planLoadFailed}
                    optionFilterProp="label"
                    options={planOptions}
                    placeholder="选择套餐"
                  />
                </Form.Item>
              ),
            },
            {
              title: '接口回显套餐名',
              width: 180,
              render: (_, field) => (
                <Form.Item
                  className={styles.inlineFormItem}
                  name={[field.name, 'plan_name']}
                >
                  <Select
                    disabled
                    options={[]}
                    placeholder="保存后由接口回显"
                    suffixIcon={null}
                  />
                </Form.Item>
              ),
            },
            {
              title: '周期',
              width: 210,
              render: (_, field) => (
                <Form.Item
                  className={styles.inlineFormItem}
                  name={[field.name, 'period']}
                  rules={[{ required: true, message: '请选择周期' }]}
                >
                  <Select
                    showSearch
                    optionFilterProp="label"
                    options={periodOptions}
                    placeholder="选择周期"
                  />
                </Form.Item>
              ),
            },
            {
              title: '操作',
              width: 80,
              align: 'center',
              render: (_, field) => (
                <Tooltip title="删除映射">
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => remove(field.name)}
                  />
                </Tooltip>
              ),
            },
          ];

          return (
            <>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelTitle}>订单映射配置</div>
                  <div className={styles.panelDesc}>
                    保存时会以当前表格内容全量覆盖后端 WooCommerce 商品映射。
                  </div>
                </div>
                <div className={styles.toolbar}>
                  <Tag color="blue">{fields.length} 条映射</Tag>
                  <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
                    刷新
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({
                        product_id: undefined as unknown as number,
                        plan_id: undefined as unknown as number,
                        period: periods[0],
                      })
                    }
                  >
                    新增映射
                  </Button>
                </div>
              </div>
              <div className={styles.tableWrap}>
                {planLoadFailed ? (
                  <Alert
                    type="warning"
                    showIcon
                    style={{ marginBottom: 12 }}
                    message="套餐列表加载失败"
                    description="当前映射仍可查看，但为避免保存错误套餐 ID，需要刷新成功后才能保存。"
                  />
                ) : null}
                <Table
                  rowKey="key"
                  loading={loading}
                  dataSource={fields}
                  columns={columns}
                  pagination={false}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无订单映射"
                      />
                    ),
                  }}
                  scroll={{ x: 860 }}
                />
              </div>
            </>
          );
        }}
      </Form.List>
    </Form>
  );

  return (
    <>
      <Tooltip title="系统配置">
        <Button
          type="text"
          className={styles.entryButton}
          icon={<SettingOutlined />}
          aria-label="系统配置"
          onClick={() => setOpen(true)}
        />
      </Tooltip>
      <Modal
        open={open}
        width="86vw"
        title={null}
        footer={null}
        className={styles.modal}
        styles={{ body: { padding: 0 } }}
        destroyOnHidden
        onCancel={() => setOpen(false)}
      >
        <div className={styles.modalBody}>
          <div className={styles.container}>
            <div className={styles.header}>
              <div>
                <div className={styles.headerTitle}>系统配置</div>
                <div className={styles.headerSubtitle}>
                  集中维护后台系统级配置，当前配置变更会直接影响对应业务能力。
                </div>
              </div>
              <Space>
                <Button
                  type="primary"
                  loading={saving}
                  disabled={planLoadFailed}
                  onClick={() => void handleSave()}
                >
                  保存配置
                </Button>
              </Space>
            </div>

            <div className={styles.main}>
              <aside className={styles.sidebar}>
                <div className={styles.sectionLabel}>配置项</div>
                <Input
                  allowClear
                  className={styles.configSearch}
                  prefix={<SearchOutlined />}
                  placeholder="搜索配置项"
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                />
                <div className={styles.configList}>
                  {filteredConfigItems.length > 0 ? (
                    filteredConfigItems.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`${styles.configItem} ${
                          activeKey === item.key ? styles.configItemActive : ''
                        }`}
                        onClick={() => setActiveKey(item.key)}
                      >
                        <div className={styles.configItemTitle}>{item.title}</div>
                        <div className={styles.configItemDesc}>{item.description}</div>
                      </button>
                    ))
                  ) : (
                    <div className={styles.configEmpty}>
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="未找到配置项"
                      />
                    </div>
                  )}
                </div>
              </aside>

              <main className={styles.content}>
                <div className={styles.panel}>
                  {activeKey === 'woocommerce-order-mapping'
                    ? renderWooCommerceMapping()
                    : null}
                  <div className={styles.footer}>
                    <Text type="secondary">
                      保存 payload 仅包含 product_id、plan_id、period，plan_name 不会提交。
                    </Text>
                    <Space>
                      <Button onClick={() => void loadData()}>恢复接口数据</Button>
                      <Button
                        type="primary"
                        loading={saving}
                        disabled={planLoadFailed}
                        onClick={() => void handleSave()}
                      >
                        保存配置
                      </Button>
                    </Space>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SystemConfigEntry;
