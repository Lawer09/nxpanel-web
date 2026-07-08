import {
  FileTextOutlined,
  PlusOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import {
  App,
  Badge,
  Button,
  Col,
  Empty,
  Popconfirm,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import {
  addDictData,
  addDictType,
  deleteDictData,
  deleteDictType,
  getDictDataByCode,
  getDictTypePage,
  updateDictData,
  updateDictType,
} from '@/services/ads-console/dict';

const { Text, Title } = Typography;

/** Tag 颜色预设选项 */
const TAG_COLOR_OPTIONS = [
  { label: '默认（无颜色）', value: '' },
  { label: '成功 / 绿', value: 'success' },
  { label: '处理中 / 蓝', value: 'processing' },
  { label: '警告 / 橙', value: 'warning' },
  { label: '错误 / 红', value: 'error' },
  { label: '蓝色', value: 'blue' },
  { label: '青色', value: 'cyan' },
  { label: '绿色', value: 'green' },
  { label: '橙色', value: 'orange' },
  { label: '紫色', value: 'purple' },
  { label: '红色', value: 'red' },
  { label: '金色', value: 'gold' },
  { label: '酸橙', value: 'lime' },
  { label: '玫红', value: 'magenta' },
  { label: '浅粉', value: 'pink' },
];

const DictManagePage: React.FC = () => {
  const { message } = App.useApp();

  // 字典类型
  const [typeLoading, setTypeLoading] = useState(false);
  const [typeList, setTypeList] = useState<AdsConsole.SysDictType[]>([]);
  const [selectedType, setSelectedType] = useState<AdsConsole.SysDictType | null>(
    null,
  );
  const [typeEditOpen, setTypeEditOpen] = useState(false);
  const [typeEditRecord, setTypeEditRecord] = useState<AdsConsole.SysDictType | null>(
    null,
  );
  const [typeModalKey, setTypeModalKey] = useState(0);

  // 字典数据
  const [dataLoading, setDataLoading] = useState(false);
  const [dataList, setDataList] = useState<AdsConsole.SysDictData[]>([]);
  const [dataEditOpen, setDataEditOpen] = useState(false);
  const [dataEditRecord, setDataEditRecord] = useState<AdsConsole.SysDictData | null>(
    null,
  );
  const [dataModalKey, setDataModalKey] = useState(0);

  const loadTypes = async () => {
    setTypeLoading(true);
    try {
      const res = await getDictTypePage({ current: 1, size: 200 });
      if (res?.success) setTypeList(res.data?.records || []);
    } finally {
      setTypeLoading(false);
    }
  };

  const loadDictData = async (type: AdsConsole.SysDictType) => {
    setDataLoading(true);
    try {
      const res = await getDictDataByCode(type.typeCode);
      if (res?.success) setDataList(res.data || []);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    loadTypes();
  }, []);

  const handleSelectType = (type: AdsConsole.SysDictType) => {
    setSelectedType(type);
    loadDictData(type);
  };

  const handleDeleteType = async (id: string) => {
    const res = await deleteDictType(id);
    if (res?.success) {
      message.success('删除成功');
      if (selectedType?.id === id) {
        setSelectedType(null);
        setDataList([]);
      }
      loadTypes();
    } else {
      message.error(res?.errorMessage || '删除失败');
    }
  };

  const handleDeleteData = async (id: string) => {
    const res = await deleteDictData(id);
    if (res?.success) {
      message.success('删除成功');
      if (selectedType) loadDictData(selectedType);
    } else {
      message.error(res?.errorMessage || '删除失败');
    }
  };

  // 字典类型列
  const typeColumns: ColumnsType<AdsConsole.SysDictType> = [
    {
      dataIndex: 'name',
      ellipsis: true,
      render: (name, record) => (
        <div style={{ padding: '2px 0' }}>
          <Space size={8}>
            <FileTextOutlined
              style={{
                color: selectedType?.id === record.id ? '#1677ff' : '#8c8c8c',
                fontSize: 14,
              }}
            />
            <span
              style={{
                color:
                  selectedType?.id === record.id
                    ? '#1677ff'
                    : 'rgba(0,0,0,0.88)',
                fontWeight: selectedType?.id === record.id ? 600 : undefined,
                fontSize: 14,
              }}
            >
              {name}
            </span>
          </Space>
          <div style={{ marginTop: 2, paddingLeft: 22 }}>
            <Text code style={{ fontSize: 11, color: '#8c8c8c' }}>
              {record.typeCode}
            </Text>
          </div>
        </div>
      ),
    },
    {
      dataIndex: 'status',
      width: 48,
      align: 'center',
      render: (s) => <Badge status={s === 1 ? 'success' : 'error'} />,
    },
    {
      width: 64,
      align: 'center',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            style={{ padding: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setTypeEditRecord(record);
              setTypeModalKey((k) => k + 1);
              setTypeEditOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该字典类型？"
            description="同时会删除该类型下所有字典数据"
            onConfirm={(e) => {
              e?.stopPropagation();
              handleDeleteType(record.id);
            }}
          >
            <Button
              type="link"
              size="small"
              danger
              style={{ padding: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 字典数据列
  const dataColumns: ColumnsType<AdsConsole.SysDictData> = [
    {
      title: '字典标签',
      dataIndex: 'label',
      width: 150,
      ellipsis: true,
      render: (label, record) =>
        record.listClass ? (
          <Tag color={record.listClass}>{label}</Tag>
        ) : (
          <span>{label}</span>
        ),
    },
    {
      title: '字典键值',
      dataIndex: 'value',
      width: 100,
      render: (v) => (
        <Text code style={{ fontSize: 12 }}>
          {v}
        </Text>
      ),
    },
    {
      title: 'Tag 颜色',
      dataIndex: 'listClass',
      width: 100,
      render: (c) =>
        c ? <Tag color={c}>{c}</Tag> : <Text type="secondary">—</Text>,
    },
    {
      title: '排序',
      dataIndex: 'sort',
      width: 70,
      align: 'center',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      align: 'center',
      render: (s) => (
        <Tag color={s === 1 ? 'success' : 'error'} style={{ margin: 0 }}>
          {s === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      render: (v) =>
        v ? <Text type="secondary">{v}</Text> : <Text type="secondary">—</Text>,
    },
    {
      title: '操作',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setDataEditRecord(record);
              setDataModalKey((k) => k + 1);
              setDataEditOpen(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除该字典数据？"
            onConfirm={() => handleDeleteData(record.id)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    // 与用户/角色页面保持相同的白色卡片容器风格
    <div style={{ background: '#fff', borderRadius: 8, padding: '16px 24px' }}>
      <Row gutter={24}>
        {/* 左侧：字典类型 */}
        <Col
          span={7}
          style={{ borderRight: '1px solid #f0f0f0', paddingRight: 16 }}
        >
          {/* 左侧标题栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Space>
              <TagsOutlined style={{ color: '#1677ff', fontSize: 16 }} />
              <Title level={5} style={{ margin: 0 }}>
                字典类型
              </Title>
              <Tag color="blue">{typeList.length}</Tag>
            </Space>
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => {
                setTypeEditRecord(null);
                setTypeModalKey((k) => k + 1);
                setTypeEditOpen(true);
              }}
            >
              新增
            </Button>
          </div>

          <Table<AdsConsole.SysDictType>
            rowKey="id"
            columns={typeColumns}
            dataSource={typeList}
            loading={typeLoading}
            pagination={false}
            showHeader={false}
            size="middle"
            rowClassName={(record) =>
              selectedType?.id === record.id ? 'dict-type-row-selected' : ''
            }
            onRow={(record) => ({
              onClick: () => handleSelectType(record),
              style: {
                cursor: 'pointer',
                background:
                  selectedType?.id === record.id ? '#e6f4ff' : undefined,
                borderRadius: 6,
                transition: 'background 0.15s',
              },
            })}
          />
        </Col>

        {/* 右侧：字典数据 */}
        <Col span={17}>
          {/* 右侧标题栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              minHeight: 32,
            }}
          >
            {selectedType ? (
              <Space>
                <FileTextOutlined style={{ color: '#1677ff', fontSize: 16 }} />
                <Title level={5} style={{ margin: 0 }}>
                  {selectedType.name}
                </Title>
                <Text code style={{ fontSize: 12 }}>
                  {selectedType.typeCode}
                </Text>
                <Tag color="blue">{dataList.length} 条</Tag>
              </Space>
            ) : (
              <Space>
                <FileTextOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
                <Title
                  level={5}
                  style={{ margin: 0, color: '#bfbfbf', fontWeight: 400 }}
                >
                  字典数据
                </Title>
              </Space>
            )}
            {selectedType && (
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  setDataEditRecord(null);
                  setDataModalKey((k) => k + 1);
                  setDataEditOpen(true);
                }}
              >
                新增数据
              </Button>
            )}
          </div>

          {!selectedType ? (
            <Empty
              description={
                <span style={{ color: '#bfbfbf' }}>
                  请在左侧选择一个字典类型
                </span>
              }
              style={{ marginTop: 60 }}
            />
          ) : (
            <Table<AdsConsole.SysDictData>
              rowKey="id"
              columns={dataColumns}
              dataSource={dataList}
              loading={dataLoading}
              size="small"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                size: 'small',
              }}
              scroll={{ x: 700 }}
            />
          )}
        </Col>
      </Row>

      {/* 字典类型弹窗 */}
      <ModalForm
        key={typeModalKey}
        title={
          <Space>
            <TagsOutlined />
            {typeEditRecord ? '编辑字典类型' : '新增字典类型'}
          </Space>
        }
        open={typeEditOpen}
        onOpenChange={(open) => {
          setTypeEditOpen(open);
          if (!open) setTypeEditRecord(null);
        }}
        initialValues={typeEditRecord || { status: 1 }}
        onFinish={async (values) => {
          let res: any;
          if (typeEditRecord) {
            res = await updateDictType({ id: typeEditRecord.id, ...values });
          } else {
            res = await addDictType(values);
          }
          if (res?.success) {
            message.success(typeEditRecord ? '修改成功' : '新增成功');
            loadTypes();
            return true;
          }
          message.error(res?.errorMessage || '操作失败');
          return false;
        }}
        width={460}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormText
          name="name"
          label="字典名称"
          rules={[{ required: true, message: '请输入字典名称' }]}
          placeholder="如：广告竞价类型"
        />
        <ProFormText
          name="typeCode"
          label="字典编码"
          rules={[{ required: true, message: '请输入字典编码' }]}
          disabled={!!typeEditRecord}
          placeholder="如：ad_bid_type"
          tooltip="编码创建后不可修改，建议使用小写下划线命名"
        />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ]}
          initialValue={1}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="（可选）"
          rows={2}
        />
      </ModalForm>

      {/* 字典数据弹窗 */}
      <ModalForm
        key={dataModalKey}
        title={
          <Space>
            <FileTextOutlined />
            {dataEditRecord
              ? '编辑字典数据'
              : `新增字典数据 — ${selectedType?.name ?? ''}`}
          </Space>
        }
        open={dataEditOpen}
        onOpenChange={(open) => {
          setDataEditOpen(open);
          if (!open) setDataEditRecord(null);
        }}
        initialValues={dataEditRecord || { status: 1, sort: 0 }}
        onFinish={async (values) => {
          let res: any;
          if (dataEditRecord) {
            res = await updateDictData({ id: dataEditRecord.id, ...values });
          } else {
            res = await addDictData({
              ...values,
              dictTypeId: selectedType?.id ?? '',
              typeCode: selectedType?.typeCode ?? '',
            });
          }
          if (res?.success) {
            message.success(dataEditRecord ? '修改成功' : '新增成功');
            if (selectedType) loadDictData(selectedType);
            return true;
          }
          message.error(res?.errorMessage || '操作失败');
          return false;
        }}
        width={480}
        modalProps={{ destroyOnHidden: true, maskClosable: false }}
      >
        <ProFormText
          name="label"
          label="字典标签"
          rules={[{ required: true, message: '请输入标签' }]}
          placeholder="如：CPC"
        />
        <ProFormText
          name="value"
          label="字典键值"
          rules={[{ required: true, message: '请输入键值' }]}
          placeholder="如：1"
        />
        <ProFormSelect
          name="listClass"
          label="Tag 颜色"
          options={TAG_COLOR_OPTIONS}
          placeholder="请选择颜色（可选）"
          fieldProps={{
            optionRender: (option) =>
              option.value ? (
                <Tag color={option.value as string}>{option.label}</Tag>
              ) : (
                <span style={{ color: '#8c8c8c' }}>{option.label}</span>
              ),
          }}
          tooltip="用于在前端展示时为该值添加 Tag 颜色"
        />
        <ProFormDigit name="sort" label="排序" min={0} initialValue={0} />
        <ProFormSelect
          name="status"
          label="状态"
          options={[
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ]}
          initialValue={1}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          placeholder="（可选）"
          rows={2}
        />
      </ModalForm>
    </div>
  );
};

export default DictManagePage;



