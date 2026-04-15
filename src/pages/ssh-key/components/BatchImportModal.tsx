import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Divider,
  Input,
  Modal,
  Result,
  Space,
  Steps,
  Table,
  Upload,
} from 'antd';
import React, { useMemo, useState } from 'react';
import { batchImportSshKeys } from '@/services/ssh-key/api';

interface BatchImportModalProps {
  open: boolean;
  providerOptions: Array<{ label: string; value: number }>;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedKeyItem {
  name?: string;
  tags?: string;
  provider_id?: number;
  provider_key_id?: string;
  secret_key?: string;
  note?: string;
}

const normalizeKey = (value: string) => value.trim();

const BatchImportModal: React.FC<BatchImportModalProps> = ({
  open,
  providerOptions,
  onClose,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [rawText, setRawText] = useState('');
  const [items, setItems] = useState<ParsedKeyItem[]>([]);
  const [importResult, setImportResult] = useState<any>(null);

  const providerMap = useMemo(
    () =>
      new Map(
        providerOptions.map((item) => [String(item.label).toLowerCase(), item.value]),
      ),
    [providerOptions],
  );

  const parseCsv = (text: string) => {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length < 2) {
      messageApi.error('CSV 文件至少需要包含表头和一行数据');
      return [];
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIndex = headers.indexOf('name');
    const secretIndex = headers.indexOf('secret_key');

    if (nameIndex === -1 || secretIndex === -1) {
      messageApi.error('CSV 必须包含 name 和 secret_key 列');
      return [];
    }

    const parsed: ParsedKeyItem[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim());
      if (!values.length || !values[nameIndex]) continue;
      const item: ParsedKeyItem = {
        name: values[nameIndex],
        secret_key: values[secretIndex],
      };
      headers.forEach((header, idx) => {
        const value = values[idx];
        if (!value) return;
        switch (header) {
          case 'tags':
            item.tags = value;
            break;
          case 'provider_id':
            item.provider_id = Number(value) || undefined;
            break;
          case 'provider':
          case 'provider_name':
            item.provider_id = providerMap.get(value.toLowerCase());
            break;
          case 'provider_key_id':
            item.provider_key_id = value;
            break;
          case 'note':
            item.note = value;
            break;
          case 'secret_key':
            item.secret_key = value;
            break;
          default:
            break;
        }
      });
      parsed.push(item);
    }

    return parsed;
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsed = parseCsv(content);
      if (parsed.length > 0) {
        setItems(parsed);
        messageApi.success(`解析成功，共 ${parsed.length} 条`);
      }
    };
    reader.readAsText(file);
    return false;
  };

  const parseJson = () => {
    if (!rawText.trim()) {
      messageApi.warning('请粘贴 JSON 数组');
      return;
    }
    try {
      const parsed = JSON.parse(rawText);
      if (!Array.isArray(parsed)) {
        messageApi.error('JSON 必须是数组');
        return;
      }
      const mapped = parsed
        .filter((item) => item && typeof item === 'object')
        .map((item) => ({
          name: item.name ? String(item.name) : undefined,
          tags: item.tags ? String(item.tags) : undefined,
          provider_id: item.provider_id ? Number(item.provider_id) : undefined,
          provider_key_id: item.provider_key_id ? String(item.provider_key_id) : undefined,
          secret_key: item.secret_key ? String(item.secret_key) : undefined,
          note: item.note ? String(item.note) : undefined,
        })) as ParsedKeyItem[];

      setItems(mapped);
      messageApi.success(`解析成功，共 ${mapped.length} 条`);
    } catch (error: any) {
      messageApi.error(error?.message || 'JSON 解析失败');
    }
  };

  const handleImport = async () => {
    if (!items.length) {
      messageApi.warning('请先解析数据');
      return;
    }
    const payload = items
      .filter((item) => item.name && item.secret_key)
      .map((item) => ({
        name: normalizeKey(item.name || ''),
        tags: item.tags,
        provider_id: item.provider_id ?? null,
        provider_key_id: item.provider_key_id,
        secret_key: item.secret_key || '',
        note: item.note,
      }));

    if (!payload.length) {
      messageApi.warning('无有效数据');
      return;
    }

    try {
      const res = await batchImportSshKeys({ items: payload });
      if (res.code !== 0) {
        messageApi.error(res.msg || '批量导入失败');
        return;
      }
      setImportResult(res.data);
      setCurrentStep(2);
      messageApi.success('批量导入完成');
      onSuccess();
    } catch (error: any) {
      messageApi.error(error?.message || '批量导入失败');
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setRawText('');
    setItems([]);
    setImportResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      title="批量导入 SSH 密钥"
      open={open}
      onCancel={handleClose}
      width={900}
      footer={null}
      destroyOnHidden
    >
      <Steps
        current={currentStep}
        items={[{ title: '准备数据' }, { title: '确认导入' }, { title: '导入结果' }]}
        style={{ marginBottom: 24 }}
      />

      {currentStep === 0 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
              方式一：上传 CSV 文件
            </div>
            <Upload beforeUpload={handleFileUpload} accept=".csv" maxCount={1}>
              <Button icon={<UploadOutlined />}>选择 CSV 文件</Button>
            </Upload>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              CSV 必须包含 name 与 secret_key 列，可选 tags、provider_id、provider_name、provider_key_id、note
            </div>
          </div>

          <Divider>或</Divider>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
              方式二：粘贴 JSON 数组
            </div>
            <Input.TextArea
              rows={6}
              placeholder='例如：[{"name":"密钥1","secret_key":"...","tags":"prod"}]'
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <Space style={{ marginTop: 8 }}>
              <Button type="primary" onClick={parseJson}>
                解析 JSON
              </Button>
              {(rawText || items.length > 0) && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setRawText('');
                    setItems([]);
                  }}
                >
                  清空
                </Button>
              )}
            </Space>
          </div>

          {items.length > 0 && (
            <div>
              <Table
                size="small"
                pagination={false}
                bordered
                dataSource={items.map((item, idx) => ({ ...item, key: idx }))}
                columns={[
                  { title: '名称', dataIndex: 'name' },
                  { title: '标签', dataIndex: 'tags' },
                  { title: 'Provider', dataIndex: 'provider_id' },
                  { title: 'Provider Key', dataIndex: 'provider_key_id' },
                ]}
              />
              <Button type="primary" style={{ marginTop: 16 }} onClick={() => setCurrentStep(1)}>
                下一步
              </Button>
            </div>
          )}
        </div>
      )}

      {currentStep === 1 && (
        <div>
          <div style={{ marginBottom: 16 }}>确认导入 {items.length} 条记录</div>
          <Space>
            <Button onClick={() => setCurrentStep(0)}>上一步</Button>
            <Button type="primary" onClick={handleImport}>
              开始导入
            </Button>
          </Space>
        </div>
      )}

      {currentStep === 2 && importResult && (
        <div>
          <Result
            status={
              importResult.summary.failed_count === 0 ? 'success' : 'warning'
            }
            title={
              importResult.summary.failed_count === 0
                ? '导入成功'
                : '导入完成（含失败）'
            }
            subTitle={`创建成功: ${importResult.summary.created_count}, 失败: ${importResult.summary.failed_count}`}
          />

          {importResult.created?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>✓ 创建成功</div>
              <Table
                size="small"
                pagination={false}
                bordered
                dataSource={importResult.created.map((item: any, idx: number) => ({
                  ...item,
                  key: idx,
                }))}
                columns={[
                  { title: 'ID', dataIndex: 'id' },
                  { title: '名称', dataIndex: 'name' },
                ]}
              />
            </div>
          )}

          {importResult.failed?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8, color: '#ff4d4f' }}>
                ✗ 导入失败
              </div>
              <Table
                size="small"
                pagination={false}
                bordered
                dataSource={importResult.failed.map((item: any, idx: number) => ({
                  ...item,
                  key: idx,
                }))}
                columns={[
                  { title: '行号', dataIndex: 'index' },
                  { title: '原因', dataIndex: 'reason' },
                ]}
              />
            </div>
          )}

          <Space style={{ marginTop: 16 }}>
            <Button onClick={handleClose}>关闭</Button>
            <Button type="primary" onClick={handleReset}>
              继续导入
            </Button>
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default BatchImportModal;
