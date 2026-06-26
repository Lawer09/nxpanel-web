import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { App, Button, Checkbox, Modal, Result, Select, Space, Steps, Table, Typography, Upload } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo, useState } from 'react';
import { batchSaveProjects } from '@/services/project/api';
import type { ProjectBatchSaveItem, ProjectBatchSaveResult } from '@/services/project/types';

interface ProjectBatchImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportTargetField =
  | 'projectCode'
  | 'projectName'
  | 'ownerName'
  | 'department'
  | 'status'
  | 'adStatus'
  | 'appPlatform'
  | 'packageName'
  | 'remark';

type CsvRow = Record<string, string>;

type PreviewRow = {
  key: string;
  valid: boolean;
  projectCode?: string | null;
  projectName?: string | null;
  ownerName?: string | null;
  department?: string | null;
  status?: string | null;
  adStatus?: string | null;
  appPlatform?: string | null;
  packageName?: string | null;
  remark?: string | null;
};

const PREVIEW_LIMIT = 20;

const IMPORT_FIELD_OPTIONS: Array<{ label: string; value: ImportTargetField; required?: boolean }> = [
  { label: '项目代号', value: 'projectCode', required: true },
  { label: '项目名称', value: 'projectName' },
  { label: '负责人', value: 'ownerName' },
  { label: '所属部门', value: 'department' },
  { label: '状态', value: 'status' },
  { label: '投放状态', value: 'adStatus' },
  { label: '应用平台', value: 'appPlatform' },
  { label: '项目包名', value: 'packageName' },
  { label: '备注', value: 'remark' },
];

const splitCsvLine = (line: string) => line.split(',').map((cell) => cell.trim());

const normalizeImportValue = (value?: string) => {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
};

const ProjectBatchImportModal: React.FC<ProjectBatchImportModalProps> = ({ open, onClose, onSuccess }) => {
  const { message: messageApi } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [selectedFields, setSelectedFields] = useState<ImportTargetField[]>(['projectCode']);
  const [fieldMapping, setFieldMapping] = useState<Partial<Record<ImportTargetField, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [importResult, setImportResult] = useState<ProjectBatchSaveResult | null>(null);

  const resetState = () => {
    setCurrentStep(0);
    setFileName('');
    setHeaders([]);
    setRows([]);
    setSelectedFields(['projectCode']);
    setFieldMapping({});
    setSubmitting(false);
    setImportResult(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length < 2) {
        messageApi.error('CSV 文件至少需要包含表头和一行数据');
        return;
      }

      const nextHeaders = splitCsvLine(lines[0]);
      if (!nextHeaders.length) {
        messageApi.error('CSV 文件缺少表头');
        return;
      }

      const duplicated = nextHeaders.filter((header, index) => nextHeaders.indexOf(header) !== index);
      if (duplicated.length) {
        messageApi.error(`CSV 表头存在重复字段：${Array.from(new Set(duplicated)).join('、')}`);
        return;
      }

      const parsedRows: CsvRow[] = lines.slice(1).map((line) => {
        const values = splitCsvLine(line);
        return nextHeaders.reduce<CsvRow>((acc, header, index) => {
          acc[header] = values[index] ?? '';
          return acc;
        }, {});
      });

      setFileName(file.name);
      setHeaders(nextHeaders);
      setRows(parsedRows);
      setFieldMapping({});
      setImportResult(null);
      setCurrentStep(1);
      messageApi.success(`解析成功，共 ${parsedRows.length} 行`);
    };
    reader.readAsText(file);
    return false;
  };

  const availableHeaderOptions = useMemo(
    () => headers.map((header) => ({ label: header, value: header })),
    [headers],
  );

  const previewRows = useMemo<PreviewRow[]>(() => {
    return rows.slice(0, PREVIEW_LIMIT).map((row, index) => {
      const preview: PreviewRow = { key: `${index}` , valid: true };
      selectedFields.forEach((field) => {
        const header = fieldMapping[field];
        const raw = header ? row[header] : '';
        preview[field] = field === 'projectCode' ? raw.trim() || null : normalizeImportValue(raw);
      });
      if (!preview.projectCode) {
        preview.valid = false;
      }
      return preview;
    });
  }, [rows, selectedFields, fieldMapping]);

  const invalidRowCount = useMemo(
    () =>
      rows.reduce((count, row) => {
        const projectCodeHeader = fieldMapping.projectCode;
        if (!projectCodeHeader) return count + 1;
        return row[projectCodeHeader]?.trim() ? count : count + 1;
      }, 0),
    [rows, fieldMapping],
  );

  const canPreview = useMemo(() => {
    if (!selectedFields.includes('projectCode')) return false;
    if (!fieldMapping.projectCode) return false;
    return selectedFields.every((field) => !!fieldMapping[field]);
  }, [selectedFields, fieldMapping]);

  const previewColumns = useMemo<ColumnsType<PreviewRow>>(
    () => [
      { title: '有效', dataIndex: 'valid', width: 80, render: (value: boolean) => (value ? '是' : '否') },
      ...selectedFields.map((field) => {
        const meta = IMPORT_FIELD_OPTIONS.find((item) => item.value === field);
        return {
          title: meta?.label || field,
          dataIndex: field,
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

  const buildPayload = (): ProjectBatchSaveItem[] => {
    return rows.reduce<ProjectBatchSaveItem[]>((acc, row) => {
      const projectCodeHeader = fieldMapping.projectCode;
      const projectCode = projectCodeHeader ? row[projectCodeHeader]?.trim() : '';
      if (!projectCode) {
        return acc;
      }

      const item = selectedFields.reduce<Partial<ProjectBatchSaveItem>>((draft, field) => {
        const header = fieldMapping[field];
        if (!header) return draft;
        const value = row[header];
        if (field === 'projectCode') {
          draft.projectCode = projectCode;
          return draft;
        }
        draft[field] = normalizeImportValue(value);
        return draft;
      }, { projectCode });

      acc.push(item as ProjectBatchSaveItem);
      return acc;
    }, []);
  };

  const handleSubmit = async () => {
    if (!canPreview) {
      messageApi.warning('请先完成字段映射');
      return;
    }
    if (invalidRowCount > 0) {
      messageApi.error(`存在 ${invalidRowCount} 行缺少项目代号，无法导入`);
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
      if (res.code !== 0) {
        messageApi.error(res.msg || 'CSV 导入失败');
        return;
      }
      const result = res.data;
      setImportResult(result);
      setCurrentStep(2);
      messageApi.success(`导入完成：新增 ${result?.created ?? 0}，更新 ${result?.updated ?? 0}`);
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="导入 CSV"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={960}
      destroyOnHidden
    >
      <Steps
        current={currentStep}
        items={[{ title: '上传与映射' }, { title: '预览确认' }, { title: '导入结果' }]}
        style={{ marginBottom: 24 }}
      />

      {currentStep === 0 && (
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <div>
            <Typography.Title level={5}>上传文件</Typography.Title>
            <Upload beforeUpload={handleFileUpload} accept=".csv" maxCount={1} showUploadList={false}>
              <Button icon={<UploadOutlined />}>选择 CSV 文件</Button>
            </Upload>
            <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              CSV 必须包含表头行，后续通过表头完成字段映射。
            </Typography.Text>
            {fileName ? (
              <Typography.Text style={{ display: 'block', marginTop: 8 }}>当前文件：{fileName}</Typography.Text>
            ) : null}
          </div>

          {headers.length ? (
            <div>
              <Typography.Title level={5}>字段选择与字段对应</Typography.Title>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
                      <Checkbox
                        key={field.value}
                        value={field.value}
                        disabled={field.required}
                      >
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
                  }))}
                  columns={[
                    { title: '导入字段', dataIndex: 'label' },
                    {
                      title: 'CSV 对应列',
                      dataIndex: 'value',
                      render: (field: ImportTargetField) => {
                        const usedHeaders = Object.entries(fieldMapping)
                          .filter(([mappedField]) => mappedField !== field)
                          .map(([, header]) => header);
                        const options = availableHeaderOptions.map((option) => ({
                          ...option,
                          disabled: usedHeaders.includes(option.value),
                        }));
                        return (
                          <Select
                            allowClear={!IMPORT_FIELD_OPTIONS.find((item) => item.value === field)?.required}
                            showSearch
                            style={{ width: '100%' }}
                            placeholder="请选择 CSV 列"
                            options={options}
                            value={fieldMapping[field]}
                            onChange={(value: string) =>
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
                />
              </Space>

              <Space style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  disabled={!canPreview}
                  onClick={() => {
                    if (invalidRowCount > 0) {
                      messageApi.warning(`检测到 ${invalidRowCount} 行缺少项目代号，提交前需修正 CSV`);
                    }
                    setCurrentStep(1);
                  }}
                >
                  预览导入
                </Button>
                <Button icon={<DeleteOutlined />} onClick={resetState}>
                  重新选择文件
                </Button>
              </Space>
            </div>
          ) : null}
        </Space>
      )}

      {currentStep === 1 && (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Typography.Title level={5} style={{ marginBottom: 8 }}>
              导入信息预览
            </Typography.Title>
            <Typography.Text type="secondary">
              预览前 {Math.min(rows.length, PREVIEW_LIMIT)} 行映射结果，本次将仅提交已选择并完成映射的字段。
            </Typography.Text>
            {invalidRowCount > 0 ? (
              <Typography.Text type="danger" style={{ display: 'block', marginTop: 8 }}>
                检测到 {invalidRowCount} 行缺少项目代号，无法提交。
              </Typography.Text>
            ) : null}
          </div>
          <Table
            size="small"
            pagination={false}
            rowKey="key"
            dataSource={previewRows}
            columns={previewColumns}
            scroll={{ x: 'max-content' }}
          />
          <Space>
            <Button onClick={() => setCurrentStep(0)}>返回修改映射</Button>
            <Button type="primary" loading={submitting} disabled={invalidRowCount > 0} onClick={handleSubmit}>
              确认导入
            </Button>
          </Space>
        </Space>
      )}

      {currentStep === 2 && (
        <Result
          status="success"
          title={`导入完成，共 ${importResult?.total ?? 0} 条`}
          subTitle={`新增 ${importResult?.created ?? 0} 条，更新 ${importResult?.updated ?? 0} 条`}
          extra={[
            <Button key="done" type="primary" onClick={handleClose}>
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
      )}
    </Modal>
  );
};

export default ProjectBatchImportModal;
