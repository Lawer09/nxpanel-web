import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Checkbox, Modal, Result, Select, Space, Steps, Table, Tag, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Papa from 'papaparse';
import React, { useMemo, useState } from 'react';
import { batchSaveProjects } from '@/services/project/api';
import type { ProjectBatchSaveItem, ProjectBatchSaveResult } from '@/services/project/types';
import { PROJECT_TABLE_FIELDS } from '../fields';

interface ProjectBatchImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportTargetField = keyof ProjectBatchSaveItem;
type CsvRow = Record<string, string>;
type ParsedCsvTable = { headers: string[]; rows: string[][] };

type ImportFieldOption = {
  label: string;
  value: ImportTargetField;
  required?: boolean;
};

type PreviewRow = {
  key: string;
  valid: boolean;
  skipReason?: string;
  statusText: string;
} & Partial<Record<ImportTargetField, string | null>>;

const PREVIEW_LIMIT = 20;

const IMPORT_FIELD_OPTIONS: ImportFieldOption[] = [
  ...PROJECT_TABLE_FIELDS.map((field) => ({
    label: field.label,
    value: field.name,
    required: field.name === 'projectCode',
  })),
  { label: '状态', value: 'status' },
];

const IMPORT_FIELD_ALIASES: Partial<Record<ImportTargetField, string[]>> = {
  projectCode: ['项目编码', '项目编号', 'project_code'],
  projectName: ['项目', '项目名称', 'project_name'],
  ownerName: ['负责人', 'owner_name'],
  department: ['部门'],
  status: ['项目状态'],
  adStatus: ['投放状态', '广告状态'],
  appPlatform: ['应用平台', '平台'],
  adspowerEnv: ['adspower环境'],
  developerGmail: ['开发者Gmail', 'gmail'],
  appName: ['应用名称'],
  packageName: ['包名', '应用包名'],
  domainInfoStatus: ['域名信息状态'],
  admobPubId: ['admobpubid'],
  domainUrl: ['域名url'],
  privacyPolicyUrl: ['隐私协议url'],
  termsUrl: ['服务条款url'],
  facebookInfoStatus: ['facebook信息状态', 'fb信息状态'],
  facebookAppId: ['facebook应用id', 'fb应用id'],
  facebookAppToken: ['facebook应用token', 'fb应用token'],
  facebookKeyHash: ['facebook密钥散列', 'fb密钥散列'],
  facebookClassName: ['facebook类名', 'fb类名'],
  admobAccountStatus: ['admob账号状态'],
  admobAppId: ['admob应用id'],
  admobAdIds: ['admob广告id配置'],
  admobAppAdsTxt: ['admobappadstxt'],
  firebaseConfigNote: ['firebase配置说明'],
  yandexAccount: ['yandex账号'],
  yandexAdIds: ['yandex广告id配置'],
  yandexAppAdsTxt: ['yandexappadstxt'],
  storePageUrl: ['商店页链接', 'storeurl'],
  remark: ['备注'],
};

const normalizeHeaderToken = (value: string) =>
  value
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[\s_\-()（）【】\[\]{}:：./\\]/g, '');

const normalizeImportValue = (value?: string) => {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const parseCsvTable = (content: string): ParsedCsvTable => {
  const result = Papa.parse<string[]>(content, {
    skipEmptyLines: 'greedy',
  });

  if (result.errors.length > 0) {
    throw new Error(result.errors[0]?.message || 'CSV 解析失败');
  }

  const rows = (result.data ?? []).filter((row) => Array.isArray(row) && row.some((cell) => `${cell ?? ''}`.trim() !== ''));
  if (rows.length < 2) {
    throw new Error('CSV 文件至少需要包含表头和一行数据');
  }

  const headers = (rows[0] ?? []).map((header) => `${header ?? ''}`.replace(/^\uFEFF/, '').trim());
  if (!headers.length || headers.every((header) => !header)) {
    throw new Error('CSV 文件缺少表头');
  }

  return {
    headers,
    rows: rows.slice(1).map((row) => headers.map((_, index) => `${row[index] ?? ''}`)),
  };
};

const buildAutoFieldMapping = (headers: string[]) => {
  const normalizedHeaders = headers.map((header) => ({
    header,
    token: normalizeHeaderToken(header),
  }));
  const usedHeaders = new Set<string>();

  return IMPORT_FIELD_OPTIONS.reduce<Partial<Record<ImportTargetField, string>>>((mapping, option) => {
    const candidateTokens = new Set(
      [option.value, option.label, ...(IMPORT_FIELD_ALIASES[option.value] ?? [])]
        .map((item) => normalizeHeaderToken(String(item)))
        .filter(Boolean),
    );

    const matched = normalizedHeaders.find(
      ({ header, token }) => candidateTokens.has(token) && !usedHeaders.has(header),
    );

    if (matched) {
      mapping[option.value] = matched.header;
      usedHeaders.add(matched.header);
    }

    return mapping;
  }, {});
};

const ProjectBatchImportModal: React.FC<ProjectBatchImportModalProps> = ({ open, onClose, onSuccess }) => {
  const { message: messageApi } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [selectedFields, setSelectedFields] = useState<ImportTargetField[]>(['projectCode']);
  const [fieldMapping, setFieldMapping] = useState<Partial<Record<ImportTargetField, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<ProjectBatchSaveResult | null>(null);
  const [frontendSkippedCount, setFrontendSkippedCount] = useState(0);

  const resetState = () => {
    setCurrentStep(0);
    setFileName('');
    setHeaders([]);
    setRows([]);
    setSelectedFields(['projectCode']);
    setFieldMapping({});
    setSubmitting(false);
    setImportResult(null);
    setFrontendSkippedCount(0);
  };

  const closeWithoutRefresh = () => {
    resetState();
    onClose();
  };

  const closeWithRefresh = () => {
    resetState();
    onSuccess();
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      try {
        const parsedTable = parseCsvTable(content);
        const duplicated = parsedTable.headers.filter((header, index) => parsedTable.headers.indexOf(header) !== index);
        if (duplicated.length) {
          messageApi.error(`CSV 表头存在重复字段：${Array.from(new Set(duplicated)).join('、')}`);
          return;
        }

        const parsedRows = parsedTable.rows.reduce<CsvRow[]>((acc, valueRow) => {
          const record = parsedTable.headers.reduce<CsvRow>((draft, header, index) => {
            draft[header] = valueRow[index] ?? '';
            return draft;
          }, {});

          const hasAnyValue = Object.values(record).some((value) => value.trim() !== '');
          if (hasAnyValue) {
            acc.push(record);
          }
          return acc;
        }, []);

        if (!parsedRows.length) {
          messageApi.error('CSV 文件没有可导入的数据行');
          return;
        }

        const autoMapping = buildAutoFieldMapping(parsedTable.headers);
        const autoSelectedFields = Array.from(
          new Set<ImportTargetField>([
            'projectCode',
            ...IMPORT_FIELD_OPTIONS.filter((option) => !!autoMapping[option.value]).map((option) => option.value),
          ]),
        );

        setFileName(file.name);
        setHeaders(parsedTable.headers);
        setRows(parsedRows);
        setFieldMapping(autoMapping);
        setSelectedFields(autoSelectedFields);
        setImportResult(null);
        setFrontendSkippedCount(0);
        setCurrentStep(1);

        messageApi.success(`CSV 解析成功，共 ${parsedRows.length} 行，已进入字段映射步骤`);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : 'CSV 解析失败');
      }
    };

    reader.readAsText(file);
    return false;
  };

  const availableHeaderOptions = useMemo(
    () => headers.map((header) => ({ label: header, value: header })),
    [headers],
  );

  const mappedRows = useMemo<PreviewRow[]>(() => {
    return rows.map((row, index) => {
      const preview = {
        key: `${index}`,
        valid: true,
        statusText: '有效',
      } as PreviewRow;

      selectedFields.forEach((field) => {
        const header = fieldMapping[field];
        const rawValue = header ? row[header] : '';
        preview[field] = field === 'projectCode' ? rawValue.trim() || null : normalizeImportValue(rawValue);
      });

      if (!preview.projectCode) {
        preview.valid = false;
        preview.skipReason = '缺少项目代号';
        preview.statusText = '跳过：缺少项目代号';
      }

      return preview;
    });
  }, [fieldMapping, rows, selectedFields]);

  const previewRows = useMemo(() => mappedRows.slice(0, PREVIEW_LIMIT), [mappedRows]);

  const validRowCount = useMemo(() => mappedRows.filter((row) => row.valid).length, [mappedRows]);
  const skippedRowCount = mappedRows.length - validRowCount;

  const canPreview = useMemo(() => {
    if (!selectedFields.length || !selectedFields.includes('projectCode')) {
      return false;
    }

    return selectedFields.every((field) => !!fieldMapping[field]);
  }, [fieldMapping, selectedFields]);

  const previewColumns = useMemo<ColumnsType<PreviewRow>>(
    () => [
      {
        title: '状态',
        dataIndex: 'statusText',
        width: 160,
        fixed: 'left',
        render: (_, record) =>
          record.valid ? <Tag color="success">有效</Tag> : <Tag color="default">{record.statusText}</Tag>,
      },
      ...selectedFields.map((field) => {
        const meta = IMPORT_FIELD_OPTIONS.find((item) => item.value === field);
        return {
          title: meta?.label || field,
          dataIndex: field,
          width: 180,
          render: (value: unknown) => (value === null || value === undefined || value === '' ? '-' : String(value)),
        };
      }),
    ],
    [selectedFields],
  );

  const resultColumns = useMemo<ColumnsType<ProjectBatchSaveResult['items'][number]>>(
    () => [
      { title: '项目代号', dataIndex: 'projectCode' },
      { title: '操作', dataIndex: 'action' },
      { title: '项目 ID', dataIndex: 'id' },
    ],
    [],
  );

  const buildPayload = () => {
    return mappedRows.reduce<ProjectBatchSaveItem[]>((acc, row) => {
      const projectCode = row.projectCode;
      if (!row.valid || !projectCode) {
        return acc;
      }

      const item = selectedFields.reduce<Partial<ProjectBatchSaveItem>>(
        (draft, field) => {
          const value = row[field];
          if (field === 'projectCode') {
            draft.projectCode = projectCode;
            return draft;
          }

          draft[field] = value === undefined ? null : value;
          return draft;
        },
        { projectCode },
      );

      acc.push(item as ProjectBatchSaveItem);
      return acc;
    }, []);
  };

  const handleSubmit = async () => {
    if (!canPreview) {
      messageApi.warning('请先完成字段映射');
      return;
    }

    const items = buildPayload();
    if (!items.length) {
      messageApi.warning('无有效导入数据');
      return;
    }

    setSubmitting(true);
    try {
      const res = await batchSaveProjects({ items });
      if (res.code !== 0 || !res.data) {
        messageApi.error(res.msg || 'CSV 导入失败');
        return;
      }

      setImportResult(res.data);
      setFrontendSkippedCount(skippedRowCount);
      setCurrentStep(3);
      messageApi.success(`导入完成：新增 ${res.data.created}，更新 ${res.data.updated}，跳过 ${skippedRowCount}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="导入 CSV"
      open={open}
      onCancel={() => {
        if (currentStep === 3 && importResult) {
          closeWithRefresh();
          return;
        }
        closeWithoutRefresh();
      }}
      footer={null}
      width={1080}
      destroyOnHidden
    >
      <Steps
        current={currentStep}
        items={[
          { title: '上传 CSV' },
          { title: '字段映射' },
          { title: '导入预览' },
          { title: '导入结果' },
        ]}
        style={{ marginBottom: 24 }}
      />

      {currentStep === 0 ? (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Typography.Title level={5}>上传文件</Typography.Title>
            <Upload beforeUpload={handleFileUpload} accept=".csv" maxCount={1} showUploadList={false}>
              <Button icon={<UploadOutlined />}>选择 CSV 文件</Button>
            </Upload>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              CSV 必须包含表头，上传后会进入字段映射步骤；仅提交你勾选且完成映射的字段。
            </Typography.Text>
          </div>
        </Space>
      ) : null}

      {currentStep === 1 ? (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Typography.Title level={5}>字段选择与字段对应</Typography.Title>
            <Typography.Text type="secondary">
              当前文件：{fileName}，共识别 {headers.length} 个表头、{rows.length} 行数据。已按表头做自动预匹配，你可以继续调整。
            </Typography.Text>
          </div>

          <Checkbox.Group
            value={selectedFields}
            onChange={(values) => {
              const normalized = Array.from(new Set(values as ImportTargetField[]));
              if (!normalized.includes('projectCode')) {
                normalized.unshift('projectCode');
              }
              setSelectedFields(normalized);
            }}
          >
            <Space wrap>
              {IMPORT_FIELD_OPTIONS.map((field) => (
                <Checkbox key={field.value} value={field.value} disabled={field.required}>
                  {field.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>

          <Table
            size="small"
            pagination={false}
            rowKey="value"
            dataSource={selectedFields.map((field) => ({
              key: field,
              value: field,
              label: IMPORT_FIELD_OPTIONS.find((item) => item.value === field)?.label || field,
              required: field === 'projectCode',
            }))}
            columns={[
              {
                title: '导入字段',
                dataIndex: 'label',
                width: 260,
                render: (_, record: { label: string; required: boolean }) => (
                  <Space size={8}>
                    <span>{record.label}</span>
                    {record.required ? <Tag color="blue">必填</Tag> : null}
                  </Space>
                ),
              },
              {
                title: 'CSV 对应列',
                dataIndex: 'value',
                render: (field: ImportTargetField) => {
                  const usedHeaders = Object.entries(fieldMapping)
                    .filter(([mappedField, header]) => mappedField !== field && selectedFields.includes(mappedField as ImportTargetField) && !!header)
                    .map(([, header]) => header as string);

                  return (
                    <Select
                      allowClear={field !== 'projectCode'}
                      showSearch
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                      placeholder="请选择 CSV 表头"
                      options={availableHeaderOptions.map((option) => ({
                        ...option,
                        disabled: usedHeaders.includes(option.value),
                      }))}
                      value={fieldMapping[field]}
                      onChange={(value) =>
                        setFieldMapping((prev) => ({
                          ...prev,
                          [field]: value,
                        }))
                      }
                    />
                  );
                },
              },
            ]}
            scroll={{ y: 480 }}
          />

          <Space>
            <Button onClick={() => setCurrentStep(0)}>重新选择文件</Button>
            <Button
              type="primary"
              disabled={!canPreview}
              onClick={() => {
                if (skippedRowCount > 0) {
                  messageApi.info(`检测到 ${skippedRowCount} 行缺少项目代号，预览后将按跳过处理`);
                }
                setCurrentStep(2);
              }}
            >
              预览导入
            </Button>
            <Button icon={<DeleteOutlined />} onClick={resetState}>
              重置
            </Button>
          </Space>
        </Space>
      ) : null}

      {currentStep === 2 ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              导入信息预览
            </Typography.Title>
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              预览前 {Math.min(rows.length, PREVIEW_LIMIT)} 行映射结果。有效 {validRowCount} 行，跳过 {skippedRowCount} 行。
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              跳过规则：当前仅对缺少项目代号的行做前端跳过，不会阻塞其它有效行提交。
            </Typography.Text>
          </div>

          <Table
            size="small"
            pagination={false}
            rowKey="key"
            dataSource={previewRows}
            columns={previewColumns}
            scroll={{ x: 'max-content', y: 420 }}
          />

          <Space>
            <Button onClick={() => setCurrentStep(1)}>返回修改映射</Button>
            <Button type="primary" loading={submitting} disabled={validRowCount === 0} onClick={handleSubmit}>
              确认导入
            </Button>
          </Space>
        </Space>
      ) : null}

      {currentStep === 3 ? (
        <Result
          status="success"
          title={`导入完成，共提交 ${importResult?.total ?? 0} 条`}
          subTitle={`新增 ${importResult?.created ?? 0} 条，更新 ${importResult?.updated ?? 0} 条，前端跳过 ${frontendSkippedCount} 条`}
          extra={[
            <Button key="done" type="primary" onClick={closeWithRefresh}>
              完成
            </Button>,
          ]}
        >
          <Table
            size="small"
            rowKey={(record) => `${record.projectCode}-${record.id}`}
            pagination={false}
            dataSource={importResult?.items ?? []}
            columns={resultColumns}
          />
        </Result>
      ) : null}
    </Modal>
  );
};

export default ProjectBatchImportModal;
