import { DollarOutlined } from '@ant-design/icons';
import { Alert, Button, Descriptions, Space, Tag, Typography } from 'antd';
import React from 'react';
import JsonBlock from '../../../dev/components/JsonBlock';
import type { MachineCreateWizardMode } from '../../types';
import {
  MachineCreateSection,
  MachineCreateSummaryStrip,
} from './MachineCreateShared';

const { Text } = Typography;

type Props = {
  mode: MachineCreateWizardMode;
  requestPayload?: Partial<API.AssetMachineCreateFromProviderParams>;
  requestError?: string;
  quote?: API.AssetMachineCreatePriceQuote | null;
  quoteLoading: boolean;
  quoteError?: string;
  quoteUnsupported?: boolean;
  staleMessages: string[];
  catalogErrors: string[];
  onQuote: () => void;
  canQuote: boolean;
};

const MachineCreateReviewStep: React.FC<Props> = ({
  mode,
  requestPayload,
  requestError,
  quote,
  quoteLoading,
  quoteError,
  quoteUnsupported = false,
  staleMessages,
  catalogErrors,
  onQuote,
  canQuote,
}) => {
  const quoteState = quote
    ? { text: '已询价', color: 'success' as const }
    : quoteUnsupported
      ? { text: '不支持询价', color: 'warning' as const }
      : quoteError
        ? { text: '询价失败', color: 'error' as const }
        : { text: '未询价', color: 'default' as const };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <MachineCreateSummaryStrip
        items={[
          {
            label: '模式',
            value: mode === 'retry' ? '重试创建' : '供应商创建',
          },
          { label: '名称', value: requestPayload?.name },
          { label: '数量', value: requestPayload?.count || 1 },
          { label: '可用区', value: requestPayload?.zone?.zone_id },
          { label: '规格', value: requestPayload?.spec?.type },
          { label: '登录方式', value: requestPayload?.login?.auth_type },
        ]}
      />

      {requestError ? (
        <Alert
          type="error"
          showIcon
          message="当前请求预览无效"
          description={requestError}
        />
      ) : null}

      {staleMessages.length ? (
        <Alert
          type="warning"
          showIcon
          message="部分候选使用缓存结果"
          description={staleMessages.join(' ')}
        />
      ) : null}

      {catalogErrors.length ? (
        <Alert
          type="warning"
          showIcon
          message="部分候选加载失败"
          description={catalogErrors.join(' ')}
        />
      ) : null}

      <MachineCreateSection
        title="最终检查"
        description="先看关键资源摘要，再决定是否询价。"
        extra={
          <Tag color={quoteState.color}>
            {quoteState.text}
          </Tag>
        }
      >
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="国家">
            {requestPayload?.zone?.country_code || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="镜像">
            {requestPayload?.os?.image_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="系统盘">
            {requestPayload?.disk?.system_size_gb || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="VPC">
            {requestPayload?.vpc?.vpc_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="带宽">
            {requestPayload?.internet?.bandwidth_mbps || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="时区">
            {requestPayload?.time_zone || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 16 }}>
          <Button
            type="primary"
            ghost
            icon={<DollarOutlined />}
            loading={quoteLoading}
            onClick={onQuote}
            disabled={!canQuote || !!requestError}
          >
            获取报价
          </Button>
          {!canQuote ? (
            <Text type="secondary">
              先补齐创建必填项，再发起询价。
            </Text>
          ) : (
            <Text type="secondary">
              询价不是必经步骤，确认无误后也可以直接提交创建。
            </Text>
          )}
        </Space>
      </MachineCreateSection>

      {quote ? (
        <MachineCreateSection
          title="报价结果"
          description="这里保留金额和拆分明细，避免和请求预览混在一起。"
        >
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="币种">
              {quote.currency || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="总价">
              {quote.total_price ?? '-'}
            </Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            <JsonBlock title="price.breakdown" value={quote.breakdown} />
          </div>
        </MachineCreateSection>
      ) : quoteUnsupported ? (
        <Alert
          type="info"
          showIcon
          message="当前供应商暂不支持询价"
          description="完成检查后仍可直接提交创建请求。"
        />
      ) : quoteError ? (
        <Alert
          type="warning"
          showIcon
          message="询价失败"
          description={quoteError}
        />
      ) : null}

      <MachineCreateSection
        title="请求预览"
        description="这里只保留最终会发给后端的结构化请求。"
      >
        <JsonBlock title="create_request" value={requestPayload} />
      </MachineCreateSection>
    </Space>
  );
};

export default MachineCreateReviewStep;
