import React, { useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Input,
  Modal,
  Result,
  Space,
  Spin,
  Steps,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { createProjectVersionRecord, getProjects } from '@/services/project/api';
import type { ProjectItem } from '@/services/project/types';

interface ProjectVersionImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ImportStep = 'source' | 'preview' | 'result';
type ParsedVersionImportRow = {
  key: string;
  rowIndex: number;
  rawLine: string;
  version: string | null;
  ownerName: string | null;
  content: string | null;
  projectApp: string | null;
  projectCode: string | null;
  projectId: number | null;
  projectName: string | null;
  releaseTimeRaw: string | null;
  releaseTime: string | null;
  valid: boolean;
  errorMessages: string[];
};

type VersionImportResultRow = {
  key: string;
  rowIndex: number;
  projectCode: string | null;
  version: string | null;
  status: 'success' | 'failed' | 'skipped';
  message: string;
};

const { TextArea } = Input;

const parseVersion = (value: string) => {
  const normalized = value.trim().replace(/^v/i, '');
  return /^\d+(?:\.\d+){1,2}$/.test(normalized) ? normalized : null;
};

const extractProjectCode = (value: string) => {
  const matched = value.trim().match(/^([A-Z]\d+[A-Z]?|Demumu)(?:\b|\s*-)/);
  return matched?.[1] ?? null;
};

const parseReleaseTime = (value: string) => {
  const matched = value
    .trim()
    .match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!matched) return null;

  const [, year, month, day, hour, minute, second = '0'] = matched;
  const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(
    2,
    '0',
  )}:${minute.padStart(2, '0')}:${second.padStart(2, '0')}`;
  const parsed = dayjs(formatted);
  if (!parsed.isValid() || parsed.format('YYYY-MM-DD HH:mm:ss') !== formatted) {
    return null;
  }
  return formatted;
};

const renderEllipsis = (value?: string | null, width = 180) => {
  if (!value) return '-';
  return (
    <Tooltip title={<div style={{ maxWidth: 520, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{value}</div>}>
      <Typography.Text
        style={{
          display: 'block',
          maxWidth: width,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value.replace(/\s+/g, ' ').trim()}
      </Typography.Text>
    </Tooltip>
  );
};

const buildProjectMap = (projects: ProjectItem[]) =>
  projects.reduce<Map<string, ProjectItem>>((map, project) => {
    if (project.projectCode) {
      map.set(project.projectCode, project);
    }
    return map;
  }, new Map<string, ProjectItem>());

const parseRows = (text: string, projectMap: Map<string, ProjectItem>) => {
  return text
    .split(/\r?\n/)
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.split('\t').some((cell) => cell.trim()))
    .map<ParsedVersionImportRow>(({ line, index }) => {
      const cells = line.split('\t');
      const [versionRaw = '', ownerRaw = '', contentRaw = '', projectAppRaw = '', releaseTimeRaw = ''] = cells;
      const errors: string[] = [];
      const version = parseVersion(versionRaw);
      const ownerName = ownerRaw.trim() || null;
      const content = contentRaw.trim() || null;
      const projectApp = projectAppRaw.trim() || null;
      const projectCode = projectApp ? extractProjectCode(projectApp) : null;
      const releaseTime = parseReleaseTime(releaseTimeRaw);
      const project = projectCode ? projectMap.get(projectCode) : undefined;

      if (cells.length < 5) {
        errors.push('列数不足：需要版本号、负责人、内容、项目 App、上线时间');
      }
      if (!version) {
        errors.push('版本号为空或格式不正确');
      }
      if (!content) {
        errors.push('版本说明为空');
      }
      if (!projectCode) {
        errors.push('项目 App 未识别到项目代号');
      } else if (!project) {
        errors.push(`项目代号不存在：${projectCode}`);
      }
      if (!releaseTime) {
        errors.push('上线时间为空或格式不正确');
      }

      return {
        key: `${index}`,
        rowIndex: index + 1,
        rawLine: line,
        version,
        ownerName,
        content,
        projectApp,
        projectCode,
        projectId: project?.id ?? null,
        projectName: project?.projectName ?? null,
        releaseTimeRaw: releaseTimeRaw.trim() || null,
        releaseTime,
        valid: errors.length === 0,
        errorMessages: errors,
      };
    });
};

const ProjectVersionImportModal: React.FC<ProjectVersionImportModalProps> = ({ open, onClose, onSuccess }) => {
  const { message } = App.useApp();
  const [currentStep, setCurrentStep] = useState<ImportStep>('source');
  const [rawText, setRawText] = useState('');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resultRows, setResultRows] = useState<VersionImportResultRow[]>([]);

  const projectMap = useMemo(() => buildProjectMap(projects), [projects]);
  const parsedRows = useMemo(() => parseRows(rawText, projectMap), [projectMap, rawText]);
  const validRows = useMemo(() => parsedRows.filter((row) => row.valid), [parsedRows]);
  const skippedCount = parsedRows.length - validRows.length;

  const resetState = () => {
    setCurrentStep('source');
    setRawText('');
    setSubmitting(false);
    setResultRows([]);
  };

  const closeWithoutRefresh = () => {
    resetState();
    onClose();
  };

  const closeWithRefresh = () => {
    resetState();
    onSuccess();
  };

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const allProjects: ProjectItem[] = [];
        let page = 1;
        const pageSize = 200;

        while (true) {
          const res = await getProjects({ page, pageSize });
          const pageData = res.data;
          const rows = pageData?.data ?? [];
          allProjects.push(...rows);

          if (!rows.length || allProjects.length >= (pageData?.total ?? 0)) {
            break;
          }
          page += 1;
        }

        if (!cancelled) {
          setProjects(allProjects);
        }
      } catch (error) {
        if (!cancelled) {
          message.error(error instanceof Error ? error.message : '项目列表加载失败');
        }
      } finally {
        if (!cancelled) {
          setLoadingProjects(false);
        }
      }
    };

    void loadProjects();
    return () => {
      cancelled = true;
    };
  }, [message, open]);

  const previewColumns = useMemo<ColumnsType<ParsedVersionImportRow>>(
    () => [
      {
        title: '状态',
        dataIndex: 'valid',
        width: 120,
        fixed: 'left',
        render: (_, record) =>
          record.valid ? (
            <Tag color="success">有效</Tag>
          ) : (
            <Tooltip
              title={
                <Space direction="vertical" size={2}>
                  {record.errorMessages.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </Space>
              }
            >
              <Tag color="error">跳过</Tag>
            </Tooltip>
          ),
      },
      { title: '行号', dataIndex: 'rowIndex', width: 80 },
      { title: '版本号', dataIndex: 'version', width: 120, render: (_, record) => record.version || '-' },
      { title: '负责人', dataIndex: 'ownerName', width: 120, render: (_, record) => record.ownerName || '-' },
      { title: '版本说明', dataIndex: 'content', width: 260, render: (_, record) => renderEllipsis(record.content, 240) },
      { title: '项目代号', dataIndex: 'projectCode', width: 120, render: (_, record) => record.projectCode || '-' },
      { title: '项目名称', dataIndex: 'projectName', width: 200, render: (_, record) => renderEllipsis(record.projectName, 180) },
      { title: '上线时间', dataIndex: 'releaseTime', width: 170, render: (_, record) => record.releaseTime || '-' },
      {
        title: '异常说明',
        dataIndex: 'errorMessages',
        width: 260,
        render: (_, record) => (record.errorMessages.length ? renderEllipsis(record.errorMessages.join('；'), 240) : '-'),
      },
    ],
    [],
  );

  const resultColumns = useMemo<ColumnsType<VersionImportResultRow>>(
    () => [
      {
        title: '状态',
        dataIndex: 'status',
        width: 100,
        render: (_, record) =>
          record.status === 'success' ? (
            <Tag color="success">成功</Tag>
          ) : record.status === 'skipped' ? (
            <Tag color="default">跳过</Tag>
          ) : (
            <Tag color="error">失败</Tag>
          ),
      },
      { title: '行号', dataIndex: 'rowIndex', width: 80 },
      { title: '项目代号', dataIndex: 'projectCode', width: 120, render: (_, record) => record.projectCode || '-' },
      { title: '版本号', dataIndex: 'version', width: 120, render: (_, record) => record.version || '-' },
      { title: '说明', dataIndex: 'message', render: (_, record) => renderEllipsis(record.message, 520) },
    ],
    [],
  );

  const handlePreview = () => {
    if (loadingProjects) {
      message.warning('项目列表仍在加载，请稍后再试');
      return;
    }
    if (!rawText.trim()) {
      message.warning('请先粘贴版本记录数据');
      return;
    }
    if (!parsedRows.length) {
      message.warning('未识别到可导入的版本记录');
      return;
    }
    setCurrentStep('preview');
  };

  const handleSubmit = async () => {
    if (!validRows.length) {
      message.warning('无有效导入数据');
      return;
    }

    setSubmitting(true);
    const nextResults: VersionImportResultRow[] = parsedRows
      .filter((row) => !row.valid)
      .map((row) => ({
        key: row.key,
        rowIndex: row.rowIndex,
        projectCode: row.projectCode,
        version: row.version,
        status: 'skipped',
        message: row.errorMessages.join('；') || '无效数据',
      }));

    try {
      for (const row of validRows) {
        try {
          await createProjectVersionRecord({
            projectId: row.projectId!,
            version: row.version!,
            versionName: null,
            content: row.content!,
            releaseTime: row.releaseTime!,
            remark: row.ownerName ? `负责人：${row.ownerName}` : null,
          });
          nextResults.push({
            key: row.key,
            rowIndex: row.rowIndex,
            projectCode: row.projectCode,
            version: row.version,
            status: 'success',
            message: '创建成功',
          });
        } catch (error) {
          nextResults.push({
            key: row.key,
            rowIndex: row.rowIndex,
            projectCode: row.projectCode,
            version: row.version,
            status: 'failed',
            message: error instanceof Error ? error.message : '创建失败',
          });
        }
      }

      setResultRows(nextResults.sort((a, b) => a.rowIndex - b.rowIndex));
      setCurrentStep('result');
      const successCount = nextResults.filter((row) => row.status === 'success').length;
      const failedCount = nextResults.filter((row) => row.status === 'failed').length;
      message.success(`版本导入完成：成功 ${successCount}，失败 ${failedCount}，跳过 ${skippedCount}`);
    } finally {
      setSubmitting(false);
    }
  };

  const successCount = resultRows.filter((row) => row.status === 'success').length;
  const failedCount = resultRows.filter((row) => row.status === 'failed').length;
  const resultSkippedCount = resultRows.filter((row) => row.status === 'skipped').length;

  return (
    <Modal
      title="版本导入"
      open={open}
      onCancel={() => {
        if (currentStep === 'result' && successCount > 0) {
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
        current={currentStep === 'result' ? 2 : currentStep === 'preview' ? 1 : 0}
        items={[{ title: '粘贴数据' }, { title: '导入预览' }, { title: '导入结果' }]}
        style={{ marginBottom: 24 }}
      />

      {currentStep === 'source' ? (
        <Spin spinning={loadingProjects} tip="正在加载项目列表...">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Typography.Text type="secondary">
              请粘贴从表格复制的版本记录 TSV 数据，列顺序固定为：版本号、负责人、内容、项目 App、上线时间。
            </Typography.Text>
            <TextArea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              autoSize={{ minRows: 12, maxRows: 20 }}
              placeholder="v1.0.4	李广	修复项目中有两套逻辑的问题，目前只保留aar包一套	A034 - PrimeTunnel VPN	2026/07/15 22:00"
            />
            <Space>
              <Button type="primary" onClick={handlePreview}>
                解析并预览
              </Button>
              <Button icon={<DeleteOutlined />} onClick={() => setRawText('')}>
                清空
              </Button>
            </Space>
          </Space>
        </Spin>
      ) : null}

      {currentStep === 'preview' ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            共识别 {parsedRows.length} 行，有效 {validRows.length} 行，跳过 {skippedCount} 行。仅有效行会提交。
          </Typography.Text>
          <Table
            size="small"
            rowKey="key"
            dataSource={parsedRows}
            columns={previewColumns}
            pagination={{ defaultPageSize: 10, showSizeChanger: true }}
            scroll={{ x: 'max-content', y: 420 }}
          />
          <Space>
            <Button onClick={() => setCurrentStep('source')}>返回修改</Button>
            <Button type="primary" loading={submitting} disabled={!validRows.length} onClick={handleSubmit}>
              确认导入
            </Button>
          </Space>
        </Space>
      ) : null}

      {currentStep === 'result' ? (
        <Result
          status={failedCount > 0 ? 'warning' : 'success'}
          title="版本导入完成"
          subTitle={`共识别 ${resultRows.length} 条，成功 ${successCount} 条，失败 ${failedCount} 条，跳过 ${resultSkippedCount} 条`}
          extra={[
            <Button key="done" type="primary" onClick={successCount > 0 ? closeWithRefresh : closeWithoutRefresh}>
              完成
            </Button>,
          ]}
        >
          <Table
            size="small"
            rowKey="key"
            dataSource={resultRows}
            columns={resultColumns}
            pagination={{ defaultPageSize: 10, showSizeChanger: true }}
          />
        </Result>
      ) : null}
    </Modal>
  );
};

export default ProjectVersionImportModal;
