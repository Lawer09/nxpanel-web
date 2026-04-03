import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Checkbox,
  Divider,
  Empty,
  Input,
  Modal,
  message,
  Progress,
  Result,
  Space,
  Spin,
  Steps,
  Table,
  Upload,
} from 'antd';
import React, { useRef, useState } from 'react';
import { asnBatchImport } from '@/services/infra/api';
import { getIpInfo, ipPoolBatchImport } from '@/services/infra/api';
import { providerBatchImport } from '@/services/provider/api';

interface BatchImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedIpData {
  ip: string;
  [key: string]: any;
}

interface IpInfoWithParsing extends ParsedIpData {
  ipInfo?: any;
  asn?: string;
  provider_name?: string;
}

interface AsnItem {
  asn: string;
  name: string;
  country?: string;
  type?: string;
  is_datacenter?: boolean;
  reliability?: number;
}

interface ProviderItem {
  name: string;
  country?: string;
  type?: string;
  website?: string;
  reliability?: number;
  asn?: string;
}

const BatchImportModal: React.FC<BatchImportModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { message: messageApi } = App.useApp();
  const [currentStep, setCurrentStep] = useState(0);

  // Step 1 - Input
  const [ipText, setIpText] = useState('');
  const [ips, setIps] = useState<string[]>([]);

  // Step 2 - Fetch IP Info
  const [ipDataList, setIpDataList] = useState<IpInfoWithParsing[]>([]);
  const [fetchingProgress, setFetchingProgress] = useState(0);
  const [asnList, setAsnList] = useState<AsnItem[]>([]);
  const [providerList, setProviderList] = useState<ProviderItem[]>([]);

  // Step 3 - Select Import Options
  const [importIpData, setImportIpData] = useState(true);
  const [importAsn, setImportAsn] = useState(false);
  const [importProvider, setImportProvider] = useState(false);

  // Step 4 - Results
  const [importResult, setImportResult] = useState<any>(null);

  const ipv4Pattern =
    /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

  // Parse IPs from text
  const parseIps = (text: string): string[] => {
    const cleaned = text
      .split(/[\n,\s]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const validIps = cleaned.filter((ip) => ipv4Pattern.test(ip));
    const invalidIps = cleaned.filter((ip) => !ipv4Pattern.test(ip));

    if (invalidIps.length > 0) {
      messageApi.warning(`发现 ${invalidIps.length} 个无效 IP，已过滤`);
    }

    return Array.from(new Set(validIps)); // deduplicate
  };

  // Parse CSV file
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n');

      if (lines.length < 2) {
        messageApi.error('CSV 文件至少需要包含表头和一行数据');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const ipIndex = headers.findIndex((h) => h.toLowerCase() === 'ip');

      if (ipIndex === -1) {
        messageApi.error('CSV 文件必须包含 IP 列');
        return;
      }

      const parsedIps: ParsedIpData[] = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = lines[i].split(',').map((v) => v.trim());
        const ip = values[ipIndex];

        if (!ipv4Pattern.test(ip)) continue;

        const dataObj: ParsedIpData = { ip };
        headers.forEach((header, idx) => {
          if (idx < values.length && header.toLowerCase() !== 'ip') {
            dataObj[header.toLowerCase()] = values[idx];
          }
        });

        parsedIps.push(dataObj);
      }

      const uniqueIps = Array.from(new Set(parsedIps.map((p) => p.ip)));
      setIps(uniqueIps);
      setIpDataList(
        uniqueIps.map((ip) => ({
          ip,
          ...parsedIps.find((p) => p.ip === ip),
        })),
      );

      messageApi.success(`成功解析 ${uniqueIps.length} 个 IP`);
    };
    reader.readAsText(file);
    return false;
  };

  // Fetch IP info for all IPs
  const fetchAllIpInfo = async () => {
    if (ips.length === 0) {
      messageApi.warning('请先输入或上传 IP');
      return;
    }

    setFetchingProgress(0);
    const results: IpInfoWithParsing[] = [];
    const asnSet = new Set<string>();
    const providerSet = new Set<string>();

    for (let i = 0; i < ips.length; i++) {
      try {
        const res = await getIpInfo({ ip: ips[i] });
        const data: IpInfoWithParsing = {
          ip: ips[i],
          ...(ipDataList.find((d) => d.ip === ips[i]) || {}),
          ipInfo: res.data,
        };

        // Parse ASN from org field
        if (res.data?.org) {
          const orgText = res.data.org;
          const asnMatch = orgText.match(/^(AS\d+)\s+(.+)$/);
          if (asnMatch) {
            data.asn = asnMatch[1];
            data.provider_name = asnMatch[2];
            asnSet.add(JSON.stringify({ asn: asnMatch[1], name: asnMatch[2] }));
            providerSet.add(JSON.stringify({ name: asnMatch[2] }));
          }
        }

        results.push(data);
      } catch (error) {
        results.push({
          ip: ips[i],
          ...(ipDataList.find((d) => d.ip === ips[i]) || {}),
        });
      }

      setFetchingProgress(Math.round(((i + 1) / ips.length) * 100));
    }

    setIpDataList(results);

    // Parse ASN items
    const asnItems: AsnItem[] = Array.from(asnSet).map((item) => {
      const parsed = JSON.parse(item);
      return {
        asn: parsed.asn,
        name: parsed.name,
        country: results.find((r) => r.asn === parsed.asn)?.ipInfo?.country,
      };
    });
    setAsnList(asnItems);

    // Parse Provider items
    const providerItems: ProviderItem[] = Array.from(providerSet).map(
      (item) => {
        const parsed = JSON.parse(item);
        return {
          name: parsed.name,
          country: results.find((r) => r.provider_name === parsed.name)?.ipInfo
            ?.country,
        };
      },
    );
    setProviderList(providerItems);

    setCurrentStep(2);
    messageApi.success('IP 信息获取完成');
  };

  // Execute import
  const handleImport = async () => {
    try {
      const promises = [];

      // Import IP data
      if (importIpData && ipDataList.length > 0) {
        const ipItems = ipDataList.map((item) => ({
          ip: item.ip,
          hostname: item.ipInfo?.hostname || item.hostname,
          city: item.ipInfo?.city || item.city,
          region: item.ipInfo?.region || item.region,
          country: item.ipInfo?.country || item.country,
          loc: item.ipInfo?.loc || item.loc,
          org: item.ipInfo?.org || item.org,
          postal: item.ipInfo?.postal || item.postal,
          timezone: item.ipInfo?.timezone || item.timezone,
          score: item.score ? parseInt(item.score) : 90,
          max_load: item.max_load ? parseInt(item.max_load) : 100,
          status: item.status || 'active',
          risk_level: item.risk_level ? parseInt(item.risk_level) : 10,
        }));
        promises.push(ipPoolBatchImport({ items: ipItems }));
      }

      // Import ASN data
      if (importAsn && asnList.length > 0) {
        const asnItems = asnList.map((item) => ({
          asn: item.asn,
          name: item.name,
          country: item.country,
          type: 'ISP',
          is_datacenter: false,
          reliability: 90,
        }));
        promises.push(asnBatchImport({ items: asnItems }));
      }

      // Import Provider data
      if (importProvider && providerList.length > 0) {
        const providerItems = providerList.map((item) => ({
          name: item.name,
          country: item.country,
          type: 'ISP',
          website: '',
          reliability: 90,
        }));
        promises.push(providerBatchImport({ items: providerItems }));
      }

      if (promises.length === 0) {
        messageApi.warning('请至少选择一个导入选项');
        return;
      }

      const results = await Promise.all(promises);
      const firstResult = results[0];

      setImportResult(firstResult?.data);
      setCurrentStep(3);
      messageApi.success('导入完成');
      onSuccess();
    } catch (error: any) {
      messageApi.error(error?.message || '导入失败');
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIpText('');
    setIps([]);
    setIpDataList([]);
    setFetchingProgress(0);
    setAsnList([]);
    setProviderList([]);
    setImportIpData(true);
    setImportAsn(false);
    setImportProvider(false);
    setImportResult(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      title="批量导入 IP"
      open={open}
      onCancel={handleClose}
      width={1000}
      footer={null}
      destroyOnHidden
    >
      <Steps
        current={currentStep}
        items={[
          { title: '输入 IP' },
          { title: '获取信息' },
          { title: '选择导入' },
          { title: '导入结果' },
        ]}
        style={{ marginBottom: 24 }}
      />

      {/* Step 1 - Input */}
      {currentStep === 0 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
              方式一：上传 CSV 文件
            </div>
            <Upload
              beforeUpload={handleFileUpload}
              accept=".csv"
              maxCount={1}
              listType="text"
            >
              <Button icon={<UploadOutlined />}>选择 CSV 文件</Button>
            </Upload>
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              CSV 文件应包含表头行（包含 IP 列），后续为数据行
            </div>
          </div>

          <Divider>或</Divider>

          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
              方式二：直接粘贴 IP（用回车、逗号或空格分隔）
            </div>
            <Input.TextArea
              rows={6}
              placeholder="例如：1.2.3.4&#10;5.6.7.8, 9.10.11.12 13.14.15.16"
              value={ipText}
              onChange={(e) => setIpText(e.target.value)}
            />
          </div>

          <Space>
            <Button
              type="primary"
              onClick={() => {
                const parsed = parseIps(ipText);
                if (parsed.length === 0) {
                  messageApi.warning('未解析到有效 IP 地址');
                  return;
                }
                setIps(parsed);
                setIpDataList(parsed.map((ip) => ({ ip })));
                messageApi.success(`成功解析 ${parsed.length} 个 IP`);
              }}
              disabled={ipText.trim().length === 0 && ips.length === 0}
            >
              解析 IP
            </Button>
            {ips.length > 0 && (
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  setIps([]);
                  setIpDataList([]);
                  setIpText('');
                }}
              >
                清空
              </Button>
            )}
          </Space>

          {ips.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Table
                size="small"
                columns={[{ title: 'IP', dataIndex: 'ip', key: 'ip' }]}
                dataSource={ips.map((ip) => ({ ip, key: ip }))}
                pagination={false}
                bordered
                style={{ maxHeight: 200, overflow: 'auto' }}
              />
              <Button
                type="primary"
                style={{ marginTop: 16 }}
                onClick={() => setCurrentStep(1)}
              >
                下一步
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Step 2 - Fetch IP Info */}
      {currentStep === 1 && (
        <div>
          {fetchingProgress === 0 ? (
            <div>
              <p>准备获取 {ips.length} 个 IP 的详细信息...</p>
              <Button type="primary" onClick={fetchAllIpInfo}>
                开始获取
              </Button>
            </div>
          ) : (
            <div>
              <Progress
                percent={fetchingProgress}
                status={fetchingProgress === 100 ? 'success' : 'active'}
              />
              <p style={{ marginTop: 8 }}>
                正在获取 IP 信息... ({fetchingProgress}%)
              </p>
              <p style={{ fontSize: 12, color: '#666' }}>
                已识别 ASN 数量: {asnList.length} | 已识别 Provider 数量:{' '}
                {providerList.length}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Step 3 - Select Import Options */}
      {currentStep === 2 && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Checkbox
              checked={importIpData}
              onChange={(e) => setImportIpData(e.target.checked)}
            >
              自动补全信息多选 ({ipDataList.length} 条 IP)
            </Checkbox>
          </div>

          {asnList.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Checkbox
                checked={importAsn}
                onChange={(e) => setImportAsn(e.target.checked)}
              >
                自动导入 ASN 多选 ({asnList.length} 条)
              </Checkbox>
              {importAsn && (
                <Table
                  size="small"
                  columns={[
                    { title: 'ASN', dataIndex: 'asn', key: 'asn' },
                    { title: '名称', dataIndex: 'name', key: 'name' },
                    {
                      title: '国家',
                      dataIndex: 'country',
                      key: 'country',
                      width: 80,
                    },
                  ]}
                  dataSource={asnList.map((item, idx) => ({
                    ...item,
                    key: idx,
                  }))}
                  pagination={false}
                  bordered
                  style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}
                />
              )}
            </div>
          )}

          {providerList.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Checkbox
                checked={importProvider}
                onChange={(e) => setImportProvider(e.target.checked)}
              >
                自动导入 Provider 多选 ({providerList.length} 条)
              </Checkbox>
              {importProvider && (
                <Table
                  size="small"
                  columns={[
                    { title: '名称', dataIndex: 'name', key: 'name' },
                    {
                      title: '国家',
                      dataIndex: 'country',
                      key: 'country',
                      width: 80,
                    },
                  ]}
                  dataSource={providerList.map((item, idx) => ({
                    ...item,
                    key: idx,
                  }))}
                  pagination={false}
                  bordered
                  style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}
                />
              )}
            </div>
          )}

          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => setCurrentStep(1)}>上一步</Button>
            <Button type="primary" onClick={handleImport}>
              开始导入
            </Button>
          </Space>
        </div>
      )}

      {/* Step 4 - Results */}
      {currentStep === 3 && importResult && (
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
            subTitle={`成功创建: ${importResult.summary.created_count}, 更新: ${importResult.summary.updated_count}, 失败: ${importResult.summary.failed_count}`}
          />

          {importResult.created?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                ✓ 新建成功
              </div>
              <Table
                size="small"
                columns={[
                  { title: 'ID', dataIndex: 'id', key: 'id' },
                  { title: 'IP', dataIndex: 'ip', key: 'ip' },
                ]}
                dataSource={importResult.created.map(
                  (item: any, idx: number) => ({
                    ...item,
                    key: idx,
                  }),
                )}
                pagination={false}
                bordered
              />
            </div>
          )}

          {importResult.updated?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                ◈ 更新成功
              </div>
              <Table
                size="small"
                columns={[
                  { title: 'ID', dataIndex: 'id', key: 'id' },
                  { title: 'IP', dataIndex: 'ip', key: 'ip' },
                ]}
                dataSource={importResult.updated.map(
                  (item: any, idx: number) => ({
                    ...item,
                    key: idx,
                  }),
                )}
                pagination={false}
                bordered
              />
            </div>
          )}

          {importResult.failed?.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div
                style={{
                  fontWeight: 'bold',
                  marginBottom: 8,
                  color: '#ff4d4f',
                }}
              >
                ✗ 导入失败
              </div>
              <Table
                size="small"
                columns={[
                  { title: 'IP/字段', dataIndex: 'ip', key: 'ip' },
                  { title: '原因', dataIndex: 'reason', key: 'reason' },
                ]}
                dataSource={importResult.failed.map(
                  (item: any, idx: number) => ({
                    ...item,
                    key: idx,
                  }),
                )}
                pagination={false}
                bordered
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
