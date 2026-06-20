import { DollarOutlined } from '@ant-design/icons';
import { Alert, Button, Descriptions, Space, Typography } from 'antd';
import React from 'react';
import JsonBlock from '../../../dev/components/JsonBlock';
import type { MachineCreateWizardMode } from '../../types';

const { Text } = Typography;

type Props = {
  mode: MachineCreateWizardMode;
  requestPayload?: API.AssetMachineCreateFromProviderParams;
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
}) => (
  <Space direction="vertical" size={16} style={{ width: '100%' }}>
    <Descriptions bordered column={2} size="small">
      <Descriptions.Item label="Mode">
        {mode === 'retry' ? 'Retry Create' : 'Create From Provider'}
      </Descriptions.Item>
      <Descriptions.Item label="Quote Status">
        {quote ? (
          <Text type="success">Quoted</Text>
        ) : quoteUnsupported ? (
          <Text type="warning">Provider does not support quote</Text>
        ) : quoteError ? (
          <Text type="danger">Quote failed</Text>
        ) : (
          <Text type="secondary">Not quoted</Text>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Region">
        {requestPayload?.region || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="Zone">
        {requestPayload?.zone || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="Instance Type">
        {requestPayload?.instance_type || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="Image">
        {requestPayload?.image_id || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="Subnet">
        {requestPayload?.network?.subnet_id || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="Count">
        {requestPayload?.count || 1}
      </Descriptions.Item>
    </Descriptions>

    {requestError ? (
      <Alert
        type="error"
        showIcon
        message="Request preview is invalid"
        description={requestError}
      />
    ) : null}

    {staleMessages.length ? (
      <Alert
        type="warning"
        showIcon
        message="Some catalogs are using stale cache"
        description={staleMessages.join(' ')}
      />
    ) : null}

    {catalogErrors.length ? (
      <Alert
        type="warning"
        showIcon
        message="Some catalogs failed to load"
        description={catalogErrors.join(' ')}
      />
    ) : null}

    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Button
        type="primary"
        ghost
        icon={<DollarOutlined />}
        loading={quoteLoading}
        onClick={onQuote}
        disabled={!canQuote || !!requestError}
      >
        Quote Price
      </Button>
      {!canQuote ? (
        <Text type="secondary">
          Complete required create fields before requesting a quote.
        </Text>
      ) : null}
    </Space>

    {quote ? (
      <>
        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Currency">
            {quote.currency || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Total Price">
            {quote.total_price ?? '-'}
          </Descriptions.Item>
        </Descriptions>
        <JsonBlock title="price.breakdown" value={quote.breakdown} />
      </>
    ) : quoteUnsupported ? (
      <Alert
        type="info"
        showIcon
        message="Price quote is not supported by the current provider capability"
        description="The create request can still be submitted after review."
      />
    ) : quoteError ? (
      <Alert
        type="warning"
        showIcon
        message="Price quote failed"
        description={quoteError}
      />
    ) : (
      <Alert
        type="info"
        showIcon
        message="Price quote has not been requested"
        description="Quote is an explicit action in this workflow. Submit remains available after review."
      />
    )}

    <JsonBlock title="create_request" value={requestPayload} />
  </Space>
);

export default MachineCreateReviewStep;
