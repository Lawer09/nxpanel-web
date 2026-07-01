import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Checkbox,
  Input,
  Modal,
  Radio,
  Result,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Papa from 'papaparse';
import React, { useMemo, useState } from 'react';
import { batchSaveProjects } from '@/services/project/api';
import type { ProjectBatchSaveItem, ProjectBatchSaveResult } from '@/services/project/types';
import type { PasteParseIssue } from '../pasteImport';
import { parseProjectPasteText } from '../pasteImport';
import { PROJECT_TABLE_FIELDS } from '../fields';

interface ProjectBatchImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportTargetField = keyof ProjectBatchSaveItem;
type CsvRow = Record<string, string>;
type ParsedCsvTable = { headers: string[]; rows: string[][] };
type ImportSourceMode = 'csv' | 'paste';
type ImportStep = 'source' | 'mapping' | 'preview' | 'result';
type PreviewStatusType = 'valid' | 'warning' | 'skip' | 'error';

type ImportFieldOption = {
  label: string;
  value: ImportTargetField;
  required?: boolean;
};

type PreviewRow = {
  key: string;
  valid: boolean;
  statusType: PreviewStatusType;
  skipReason?: string;
  statusText: string;
  issueMessages?: string[];
  warningMessages?: string[];
} & Partial<Record<ImportTargetField, string | null>>;

const PREVIEW_LIMIT = 20;
const { TextArea } = Input;

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

const getImportFieldLabel = (field: string) =>
  IMPORT_FIELD_OPTIONS.find((item) => item.value === field)?.label || field;

const renderEllipsisText = (value: string, width: number, type?: 'secondary') => (
  <Tooltip title={value}>
    <Typography.Text
      type={type}
      style={{
        display: 'inline-block',
        maxWidth: width,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'bottom',
      }}
    >
      {value}
    </Typography.Text>
  </Tooltip>
);

const formatPasteIssueMessage = (issue: PasteParseIssue) => {
  if (issue.type === 'conflict') {
    return `字段冲突：${getImportFieldLabel(issue.field)}（已有值：${issue.existingValue}；新值：${issue.incomingValue}）`;
  }

  return issue.message;
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
  const [sourceMode, setSourceMode] = useState<ImportSourceMode>('csv');
  const [currentStep, setCurrentStep] = useState<ImportStep>('source');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [pasteText, setPasteText] = useState('');
  const [pasteRows, setPasteRows] = useState<PreviewRow[]>([]);
  const [selectedFields, setSelectedFields] = useState<ImportTargetField[]>(['projectCode']);
  const [fieldMapping, setFieldMapping] = useState<Partial<Record<ImportTargetField, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<ProjectBatchSaveResult | null>(null);
  const [frontendSkippedCount, setFrontendSkippedCount] = useState(0);
  const [frontendExceptionCount, setFrontendExceptionCount] = useState(0);

  const resetImportData = () => {
    setCurrentStep('source');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setPasteText('');
    setPasteRows([]);
    setSelectedFields(['projectCode']);
    setFieldMapping({});
    setSubmitting(false);
    setImportResult(null);
    setFrontendSkippedCount(0);
    setFrontendExceptionCount(0);
  };

  const resetState = () => {
    setSourceMode('csv');
    resetImportData();
  };

  const closeWithoutRefresh = () => {
    resetState();
    onClose();
  };

  const closeWithRefresh = () => {
    resetState();
    onSuccess();
  };

  const handleModeChange = (nextMode: ImportSourceMode) => {
    setSourceMode(nextMode);
    resetImportData();
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
        setFrontendExceptionCount(0);
        setCurrentStep('mapping');

        messageApi.success(`CSV 解析成功，共 ${parsedRows.length} 行，已进入字段映射步骤`);
      } catch (error) {
        messageApi.error(error instanceof Error ? error.message : 'CSV 解析失败');
      }
    };

    reader.readAsText(file);
    return false;
  };

  const handlePasteParse = () => {
    const content = pasteText.trim();
    if (!content) {
      messageApi.warning('请先粘贴项目文本');
      return;
    }

    const parsed = parseProjectPasteText(content);
    if (!parsed.records.length) {
      messageApi.error('未识别到可导入的项目记录，请检查项目代号起始行');
      return;
    }

    const previewData = parsed.records.map<PreviewRow>((record, index) => {
      const hasProjectCode = !!record.projectCode?.trim();
      const hasConflict = record.errors.some((item) => item.type === 'conflict');
      const hasError = record.errors.length > 0;
      const hasWarning = record.warnings.length > 0;

      let statusType: PreviewStatusType = 'valid';
      let statusText = '有效';
      let skipReason: string | undefined;

      if (!hasProjectCode) {
        statusType = 'skip';
        skipReason = '缺少项目代号';
        statusText = '跳过：缺少项目代号';
      } else if (hasError) {
        statusType = 'error';
        statusText = hasConflict ? '异常：字段冲突' : '异常：存在未识别内容';
      } else if (hasWarning) {
        statusType = 'warning';
        statusText = '警告';
      }

      return {
        key: `${index}`,
        valid: statusType !== 'skip' && statusType !== 'error',
        statusType,
        skipReason,
        statusText,
        issueMessages: record.errors.map(formatPasteIssueMessage),
        warningMessages: record.warnings,
        ...record.fields,
        projectCode: record.projectCode || record.fields.projectCode || null,
      };
    });

    const validCount = previewData.filter((item) => item.statusType === 'valid').length;
    const skippedCount = previewData.filter((item) => item.statusType === 'skip').length;
    const exceptionCount = previewData.filter((item) => item.statusType === 'error').length;

    setPasteRows(previewData);
    setImportResult(null);
    setFrontendSkippedCount(skippedCount);
    setFrontendExceptionCount(exceptionCount);
    setCurrentStep('preview');

    messageApi.success(
      `已识别 ${previewData.length} 条记录：有效 ${validCount}，跳过 ${skippedCount}，异常 ${exceptionCount}`,
    );
  };

  const availableHeaderOptions = useMemo(
    () => headers.map((header) => ({ label: header, value: header })),
    [headers],
  );

  const headerUsageCounts = useMemo(
    () =>
      selectedFields.reduce<Record<string, number>>((counts, field) => {
        const header = fieldMapping[field];
        if (!header) return counts;
        counts[header] = (counts[header] || 0) + 1;
        return counts;
      }, {}),
    [fieldMapping, selectedFields],
  );

  const csvMappedRows = useMemo<PreviewRow[]>(() => {
    return rows.map((row, index) => {
      const preview = {
        key: `${index}`,
        valid: true,
        statusType: 'valid',
        statusText: '有效',
      } as PreviewRow;

      selectedFields.forEach((field) => {
        const header = fieldMapping[field];
        const rawValue = header ? row[header] : '';
        preview[field] = field === 'projectCode' ? rawValue.trim() || null : normalizeImportValue(rawValue);
      });

      if (!preview.projectCode) {
        preview.valid = false;
        preview.statusType = 'skip';
        preview.skipReason = '缺少项目代号';
        preview.statusText = '跳过：缺少项目代号';
      }

      return preview;
    });
  }, [fieldMapping, rows, selectedFields]);

  const activeMappedRows = useMemo(
    () => (sourceMode === 'csv' ? csvMappedRows : pasteRows),
    [csvMappedRows, pasteRows, sourceMode],
  );

  const previewRows = useMemo(() => activeMappedRows.slice(0, PREVIEW_LIMIT), [activeMappedRows]);

  const validRowCount = useMemo(
    () => activeMappedRows.filter((row) => row.valid).length,
    [activeMappedRows],
  );
  const skippedRowCount = useMemo(
    () => activeMappedRows.filter((row) => row.statusType === 'skip').length,
    [activeMappedRows],
  );
  const exceptionRowCount = useMemo(
    () => activeMappedRows.filter((row) => row.statusType === 'error').length,
    [activeMappedRows],
  );

  const canPreview = useMemo(() => {
    if (sourceMode === 'paste') {
      return pasteRows.length > 0;
    }

    if (!selectedFields.length || !selectedFields.includes('projectCode')) {
      return false;
    }

    return selectedFields.every((field) => !!fieldMapping[field]);
  }, [fieldMapping, pasteRows.length, selectedFields, sourceMode]);

  const previewFields = useMemo<ImportTargetField[]>(() => {
    if (sourceMode === 'csv') {
      return selectedFields;
    }

    return IMPORT_FIELD_OPTIONS.filter((field) =>
      activeMappedRows.some((row) => {
        const value = row[field.value];
        return value !== null && value !== undefined && value !== '';
      }),
    ).map((field) => field.value);
  }, [activeMappedRows, selectedFields, sourceMode]);

  const previewColumns = useMemo<ColumnsType<PreviewRow>>(
    () => {
      const columns: ColumnsType<PreviewRow> = [
        {
          title: '状态',
          dataIndex: 'statusText',
          width: 84,
          fixed: 'left',
          render: (_, record) => {
            if (record.statusType === 'warning') {
              return (
                <Tooltip
                  title={
                    record.warningMessages?.length ? (
                      <Space direction="vertical" size={2}>
                        {record.warningMessages.map((message) => (
                          <span key={message}>{message}</span>
                        ))}
                      </Space>
                    ) : undefined
                  }
                >
                  <Tag
                    color="warning"
                    style={{
                      maxWidth: 72,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {record.statusText}
                  </Tag>
                </Tooltip>
              );
            }
            if (record.statusType === 'valid') {
              return (
                <Tooltip title="有效">
                  <Tag color="success" style={{ maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    有效
                  </Tag>
                </Tooltip>
              );
            }
            if (record.statusType === 'error') {
              return (
                <Tooltip
                  title={
                    record.issueMessages?.length ? (
                      <Space direction="vertical" size={2}>
                        {record.issueMessages.map((message) => (
                          <span key={message}>{message}</span>
                        ))}
                      </Space>
                    ) : undefined
                  }
                >
                  <Tag
                    color="error"
                    style={{
                      maxWidth: 72,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {record.statusText}
                  </Tag>
                </Tooltip>
              );
            }
            return (
              <Tooltip title={record.statusText}>
                <Tag
                  color="default"
                  style={{
                    maxWidth: 72,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {record.statusText}
                </Tag>
              </Tooltip>
            );
          },
        },
      ];

      if (sourceMode === 'paste') {
        columns.push({
          title: '提示说明',
          dataIndex: 'issueMessages',
          width: 220,
          fixed: 'left',
          render: (_, record) => {
            if (record.statusType === 'valid' && !record.warningMessages?.length) {
              return '-';
            }

            const messages =
              record.statusType === 'skip'
                ? [record.skipReason || '缺少项目代号']
                : record.statusType === 'warning'
                  ? record.warningMessages?.length
                    ? record.warningMessages
                    : ['存在需要注意的缺失字段']
                : record.issueMessages?.length
                  ? record.issueMessages
                  : ['存在未识别内容'];

            const summary = messages.join('；');
            return renderEllipsisText(summary, 200, 'secondary');
          },
        });
      }

      columns.push(
        ...previewFields.map((field) => {
          const meta = IMPORT_FIELD_OPTIONS.find((item) => item.value === field);
          return {
            title: meta?.label || field,
            dataIndex: field,
            width: 180,
            render: (value: unknown) => (value === null || value === undefined || value === '' ? '-' : String(value)),
          };
        }),
      );

      return columns;
    },
    [previewFields, sourceMode],
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
    return activeMappedRows.reduce<ProjectBatchSaveItem[]>((acc, row) => {
      const projectCode = row.projectCode;
      if (!row.valid || !projectCode) {
        return acc;
      }

      const item =
        sourceMode === 'csv'
          ? selectedFields.reduce<Partial<ProjectBatchSaveItem>>(
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
            )
          : Object.entries(row).reduce<Partial<ProjectBatchSaveItem>>(
              (draft, [field, value]) => {
                if (field === 'projectCode') {
                  draft.projectCode = projectCode;
                  return draft;
                }

                if (!IMPORT_FIELD_OPTIONS.some((option) => option.value === field)) {
                  return draft;
                }

                if (value === undefined || value === null || value === '') {
                  return draft;
                }

                if (typeof value !== 'string') {
                  return draft;
                }

                draft[field as ImportTargetField] = value;
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
      messageApi.warning(sourceMode === 'csv' ? '请先完成字段映射' : '请先完成粘贴内容识别');
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
        messageApi.error(res.msg || '导入失败');
        return;
      }

      setImportResult(res.data);
      setFrontendSkippedCount(skippedRowCount);
      setFrontendExceptionCount(exceptionRowCount);
      setCurrentStep('result');
      messageApi.success(
        `导入完成：新增 ${res.data.created}，更新 ${res.data.updated}，跳过 ${skippedRowCount}，异常 ${exceptionRowCount}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const stepItems = useMemo(() => {
    if (sourceMode === 'paste') {
      return [{ title: '粘贴文本' }, { title: '导入预览' }, { title: '导入结果' }];
    }

    return [
      { title: '上传数据' },
      { title: '字段映射' },
      { title: '导入预览' },
      { title: '导入结果' },
    ];
  }, [sourceMode]);

  const currentStepIndex = useMemo(() => {
    if (sourceMode === 'paste') {
      if (currentStep === 'result') return 2;
      if (currentStep === 'preview') return 1;
      return 0;
    }

    if (currentStep === 'mapping') return 1;
    if (currentStep === 'preview') return 2;
    if (currentStep === 'result') return 3;
    return 0;
  }, [currentStep, sourceMode]);

  return (
    <Modal
      title="导入项目"
      open={open}
      onCancel={() => {
        if (currentStep === 'result' && importResult) {
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
        current={currentStepIndex}
        items={stepItems}
        style={{ marginBottom: 24 }}
      />

      {currentStep === 'source' ? (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Typography.Title level={5}>导入来源</Typography.Title>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={sourceMode}
              onChange={(event) => handleModeChange(event.target.value)}
              options={[
                { label: '上传 CSV', value: 'csv' },
                { label: '粘贴文本', value: 'paste' },
              ]}
            />
          </div>

          <div>
            <Typography.Title level={5}>{sourceMode === 'csv' ? '上传文件' : '粘贴项目文本'}</Typography.Title>
            {sourceMode === 'csv' ? (
              <>
                <Upload beforeUpload={handleFileUpload} accept=".csv" maxCount={1} showUploadList={false}>
                  <Button icon={<UploadOutlined />}>选择 CSV 文件</Button>
                </Upload>
                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  CSV 必须包含表头，上传后会进入字段映射步骤；仅提交你勾选且完成映射的字段。
                </Typography.Text>
              </>
            ) : (
              <>
                <TextArea
                  value={pasteText}
                  onChange={(event) => setPasteText(event.target.value)}
                  autoSize={{ minRows: 14, maxRows: 22 }}
                  placeholder="请直接粘贴按行排列的项目块数据，系统会按项目代号起始行自动识别。"
                />
                <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                  粘贴模式不提供手工字段映射，会按项目代号切分记录并自动识别字段；存在未识别内容或字段冲突的记录会标记为异常并跳过。
                </Typography.Text>
                <Space>
                  <Button type="primary" onClick={handlePasteParse}>
                    识别并预览
                  </Button>
                  <Button icon={<DeleteOutlined />} onClick={resetImportData}>
                    清空
                  </Button>
                </Space>
              </>
            )}
          </div>
        </Space>
      ) : null}

      {currentStep === 'mapping' && sourceMode === 'csv' ? (
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
                  return (
                    <Select
                      allowClear={field !== 'projectCode'}
                      showSearch
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                      placeholder="请选择 CSV 表头"
                      options={availableHeaderOptions.map((option) => {
                        const count = headerUsageCounts[option.value] || 0;
                        return {
                          ...option,
                          label: count > 0 ? `${option.label}（已选 ${count}）` : option.label,
                        };
                      })}
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
            <Button onClick={() => setCurrentStep('source')}>重新选择文件</Button>
            <Button
              type="primary"
              disabled={!canPreview}
              onClick={() => {
                if (skippedRowCount > 0) {
                  messageApi.info(`检测到 ${skippedRowCount} 行缺少项目代号，预览后将按跳过处理`);
                }
                setCurrentStep('preview');
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

      {currentStep === 'preview' ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              导入信息预览
            </Typography.Title>
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              预览前 {Math.min(activeMappedRows.length, PREVIEW_LIMIT)} 条记录。有效 {validRowCount} 条，跳过{' '}
              {skippedRowCount} 条，异常 {exceptionRowCount} 条。
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              {sourceMode === 'csv'
                ? '跳过规则：当前仅对缺少项目代号的行做前端跳过，不会阻塞其它有效行提交。'
                : '粘贴模式会提交“有效 / 警告”记录；缺少项目代号、字段冲突或存在未识别内容的记录会保留在预览中但不会入库。'}
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
            <Button onClick={() => setCurrentStep(sourceMode === 'csv' ? 'mapping' : 'source')}>
              {sourceMode === 'csv' ? '返回修改映射' : '返回修改内容'}
            </Button>
            <Button type="primary" loading={submitting} disabled={validRowCount === 0} onClick={handleSubmit}>
              确认导入
            </Button>
          </Space>
        </Space>
      ) : null}

      {currentStep === 'result' ? (
        <Result
          status="success"
          title={`导入完成，共提交 ${importResult?.total ?? 0} 条`}
          subTitle={`新增 ${importResult?.created ?? 0} 条，更新 ${importResult?.updated ?? 0} 条，前端跳过 ${frontendSkippedCount} 条，异常 ${frontendExceptionCount} 条`}
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
