import { App, Button, Form, Modal, Steps } from 'antd';
import type { NamePath } from 'antd/es/form/interface';
import React, { useEffect, useMemo, useState } from 'react';
import {
  createAssetMachineFromProvider,
  quoteAssetMachineCreatePrice,
  retryAssetMachineProviderCreate,
} from '@/services/asset-service/api';
import type {
  MachineCreateFormValues,
  MachineCreateWizardMode,
} from '../../types';
import {
  isCapabilityNotSupportedError,
  normalizeDevErrorMessage,
} from '../../utils';
import MachineCreateAccessStep from './MachineCreateAccessStep';
import MachineCreateBasicStep from './MachineCreateBasicStep';
import MachineCreateBillingStep from './MachineCreateBillingStep';
import MachineCreateNetworkStep from './MachineCreateNetworkStep';
import MachineCreateReviewStep from './MachineCreateReviewStep';
import { MachineCreateCatalogStatus } from './MachineCreateShared';
import {
  buildMachineCreateRequest,
  buildMachineRetryRequest,
  normalizeCreateRequestToFormValues,
} from './machinePayload';
import { useMachineCreateCatalogs } from './useMachineCreateCatalogs';

type Props = {
  open: boolean;
  mode: MachineCreateWizardMode;
  accounts: API.AssetProviderAccount[];
  initialValues?: Partial<MachineCreateFormValues>;
  retrying?: API.AssetMachine | null;
  onCancel: () => void;
  onSuccess: (ack: API.AssetTaskAck, title: string) => void;
};

const STEP_FIELDS: NamePath[][] = [
  [
    'account_id',
    'region',
    'zone',
    'instance_type',
    'image_id',
    'count',
    'machine_id_template',
    'name_template',
    'client_request_id',
  ],
  [['billing', 'type'], ['storage', 'system_disk', 'size_gb']],
  [['network', 'subnet_id'], ['ip_assignment', 'ip_ids']],
  [],
  [],
];

const buildDefaultValues = (): Partial<MachineCreateFormValues> => ({
  count: 1,
  ip_assignment: {
    mode: 'provider_auto',
  },
  storage: {
    data_disks: [],
  },
});

const deepMerge = <T,>(base: T, override?: Partial<T>): T => {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return (override ?? base) as T;
  }

  if (
    base &&
    typeof base === 'object' &&
    override &&
    typeof override === 'object'
  ) {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };

    Object.entries(override as Record<string, unknown>).forEach(([key, value]) => {
      result[key] = deepMerge(
        (result[key] as never) ?? (value as never),
        value as never,
      );
    });

    return result as T;
  }

  return (override ?? base) as T;
};

const isOptionAvailable = (
  value: unknown,
  options: Array<{ value: string | number | boolean }>,
) =>
  value === undefined ||
  value === null ||
  value === '' ||
  options.length === 0 ||
  options.some((item) => item.value === value);

const MachineCreateWizardModal: React.FC<Props> = ({
  open,
  mode,
  accounts,
  initialValues,
  retrying,
  onCancel,
  onSuccess,
}) => {
  const { message } = App.useApp();
  const [form] = Form.useForm<MachineCreateFormValues>();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quote, setQuote] = useState<API.AssetMachineCreatePriceQuote | null>(
    null,
  );
  const [quoteError, setQuoteError] = useState<string>();
  const [quoteUnsupported, setQuoteUnsupported] = useState(false);
  const [quotedSignature, setQuotedSignature] = useState<string>();

  const watchedAccountId = Form.useWatch('account_id', {
    form,
    preserve: true,
  });
  const watchedRegion = Form.useWatch('region', { form, preserve: true });
  const watchedZone = Form.useWatch('zone', { form, preserve: true });
  const watchedVpcId = Form.useWatch(['network', 'vpc_id'], {
    form,
    preserve: true,
  });
  const watchedValues = Form.useWatch([], form) as
    | MachineCreateFormValues
    | undefined;

  const effectiveAccountId =
    mode === 'retry' ? retrying?.account_id || watchedAccountId : watchedAccountId;

  const catalog = useMachineCreateCatalogs({
    open,
    accountId: effectiveAccountId || undefined,
    region: watchedRegion,
    zone: watchedZone,
    vpcId: watchedVpcId,
  });

  const requestPreview = useMemo(() => {
    try {
      return {
        payload: buildMachineCreateRequest(watchedValues || {}),
      };
    } catch (error: any) {
      return {
        error: normalizeDevErrorMessage(error),
      };
    }
  }, [watchedValues]);

  const requestSignature = useMemo(
    () => JSON.stringify(requestPreview.payload || null),
    [requestPreview.payload],
  );

  const canQuote = Boolean(
    requestPreview.payload?.account_id &&
      requestPreview.payload.region &&
      requestPreview.payload.zone &&
      requestPreview.payload.instance_type &&
      requestPreview.payload.image_id &&
      requestPreview.payload.billing?.type &&
      requestPreview.payload.storage?.system_disk?.size_gb &&
      requestPreview.payload.network?.subnet_id,
  );

  const previewPayload = useMemo(() => {
    if (!requestPreview.payload) {
      return undefined;
    }

    return {
      ...requestPreview.payload,
      ssh_key: requestPreview.payload.ssh_key
        ? {
            ...requestPreview.payload.ssh_key,
            password: requestPreview.payload.ssh_key.password
              ? '******'
              : undefined,
          }
        : undefined,
    } satisfies API.AssetMachineCreateFromProviderParams;
  }, [requestPreview.payload]);

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setCurrentStep(0);
      setSubmitting(false);
      setQuote(null);
      setQuoteError(undefined);
      setQuoteUnsupported(false);
      setQuotedSignature(undefined);
      return;
    }

    const defaults = buildDefaultValues();
    const retryValues =
      mode === 'retry' && retrying
        ? normalizeCreateRequestToFormValues(
            retrying.create_request_json,
            retrying,
          )
        : {};
    const mergedValues = deepMerge(
      deepMerge(defaults, initialValues),
      retryValues as Partial<MachineCreateFormValues>,
    );

    form.resetFields();
    form.setFieldsValue(mergedValues);
    setCurrentStep(0);
    setQuote(null);
    setQuoteError(undefined);
    setQuoteUnsupported(false);
    setQuotedSignature(undefined);
  }, [form, initialValues, mode, open, retrying]);

  useEffect(() => {
    if (quotedSignature && quotedSignature !== requestSignature) {
      setQuote(null);
      setQuoteError(undefined);
      setQuoteUnsupported(false);
      setQuotedSignature(undefined);
    }
  }, [quotedSignature, requestSignature]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const nextValues: Partial<MachineCreateFormValues> = {};
    const nextNetwork = { ...(form.getFieldValue('network') || {}) };
    let hasNetworkChange = false;

    const zoneValue = form.getFieldValue('zone');
    if (
      zoneValue &&
      !isOptionAvailable(zoneValue, catalog.getFieldStatus('zone').options)
    ) {
      nextValues.zone = undefined;
      nextValues.instance_type = undefined;
      nextValues.image_id = undefined;
      nextNetwork.subnet_id = undefined;
      nextNetwork.security_group_id = undefined;
      hasNetworkChange = true;
    }

    const instanceTypeValue = form.getFieldValue('instance_type');
    if (
      instanceTypeValue &&
      !isOptionAvailable(
        instanceTypeValue,
        catalog.getFieldOptions('instance_type'),
      )
    ) {
      nextValues.instance_type = undefined;
    }

    const imageValue = form.getFieldValue('image_id');
    if (
      imageValue &&
      !isOptionAvailable(imageValue, catalog.getFieldOptions('image_id'))
    ) {
      nextValues.image_id = undefined;
    }

    const subnetValue = nextNetwork.subnet_id;
    if (
      subnetValue &&
      !isOptionAvailable(subnetValue, catalog.getFieldOptions('network.subnet_id'))
    ) {
      nextNetwork.subnet_id = undefined;
      hasNetworkChange = true;
    }

    const securityGroupValue = nextNetwork.security_group_id;
    if (
      securityGroupValue &&
      !isOptionAvailable(
        securityGroupValue,
        catalog.getFieldOptions('network.security_group_id'),
      )
    ) {
      nextNetwork.security_group_id = undefined;
      hasNetworkChange = true;
    }

    if (hasNetworkChange) {
      nextValues.network = nextNetwork;
    }

    if (Object.keys(nextValues).length) {
      form.setFieldsValue(nextValues);
    }
  }, [catalog.fieldMap, form, open]);

  const validateCurrentStep = async () => {
    const fields = STEP_FIELDS[currentStep];
    if (!fields.length) {
      return;
    }
    await form.validateFields(fields);
  };

  const handleNext = async () => {
    try {
      await validateCurrentStep();
      setCurrentStep((current) => Math.min(current + 1, 4));
    } catch {
      return;
    }
  };

  const handleQuote = async () => {
    const accountId = effectiveAccountId;
    if (!accountId) {
      message.error('Provider account is required before quoting.');
      return;
    }

    try {
      await form.validateFields();
      const payload = buildMachineCreateRequest(form.getFieldsValue(true));
      setQuoteLoading(true);
      setQuoteError(undefined);
      setQuoteUnsupported(false);

      const response = await quoteAssetMachineCreatePrice(accountId, payload);
      setQuote(response.data);
      setQuotedSignature(JSON.stringify(payload));
      message.success('Price quote loaded.');
    } catch (error: any) {
      if (isCapabilityNotSupportedError(error)) {
        setQuote(null);
        setQuoteError(undefined);
        setQuoteUnsupported(true);
        return;
      }

      const messageText = normalizeDevErrorMessage(error);
      setQuote(null);
      setQuoteUnsupported(false);
      setQuoteError(messageText);
      if (error?.errorFields) {
        return;
      }
      message.error(messageText);
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true);
      setSubmitting(true);

      if (mode === 'retry' && retrying) {
        const response = await retryAssetMachineProviderCreate(
          retrying.id,
          buildMachineRetryRequest(values),
        );
        onSuccess(
          response.data,
          `Provider-side retry for machine #${retrying.id} submitted.`,
        );
      } else {
        const response = await createAssetMachineFromProvider(
          buildMachineCreateRequest(values),
        );
        onSuccess(response.data, 'Provider-side machine create submitted.');
      }
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(normalizeDevErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const stepItems = [
    { key: 'basic', title: 'Basic' },
    { key: 'billing', title: 'Billing & Storage' },
    { key: 'network', title: 'Network & IP' },
    { key: 'access', title: 'Access' },
    { key: 'review', title: 'Review & Quote' },
  ];

  return (
    <Modal
      title={
        mode === 'retry' && retrying
          ? `Retry Provider Create #${retrying.id}`
          : 'Create Machine From Provider'
      }
      open={open}
      destroyOnHidden
      width={1200}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        currentStep > 0 ? (
          <Button
            key="back"
            onClick={() => setCurrentStep((current) => Math.max(current - 1, 0))}
          >
            Back
          </Button>
        ) : null,
        currentStep < stepItems.length - 1 ? (
          <Button key="next" type="primary" onClick={() => void handleNext()}>
            Next
          </Button>
        ) : (
          <Button
            key="submit"
            type="primary"
            loading={submitting}
            onClick={() => void handleSubmit()}
          >
            {mode === 'retry' ? 'Submit Retry' : 'Submit Create'}
          </Button>
        ),
      ]}
      styles={{
        body: {
          maxHeight: '72vh',
          overflow: 'auto',
          paddingTop: 12,
        },
      }}
    >
      <Steps
        current={currentStep}
        items={stepItems}
        style={{ marginBottom: 24 }}
        onChange={(nextStep) => {
          if (nextStep <= currentStep) {
            setCurrentStep(nextStep);
          }
        }}
      />

      <MachineCreateCatalogStatus
        available={catalog.available}
        loading={catalog.loading}
        refreshing={catalog.refreshing}
        errors={catalog.errors}
        staleMessages={catalog.staleMessages}
        onRefresh={() => {
          void catalog.reload();
        }}
      />

      <Form<MachineCreateFormValues> form={form} layout="vertical">
        {currentStep === 0 ? (
          <MachineCreateBasicStep
            mode={mode}
            accounts={accounts}
            catalog={catalog}
            retrying={retrying}
          />
        ) : null}
        {currentStep === 1 ? (
          <MachineCreateBillingStep
            catalog={catalog}
            zoneReady={Boolean(watchedZone)}
          />
        ) : null}
        {currentStep === 2 ? (
          <MachineCreateNetworkStep
            catalog={catalog}
            zoneReady={Boolean(watchedZone)}
          />
        ) : null}
        {currentStep === 3 ? <MachineCreateAccessStep catalog={catalog} /> : null}
        {currentStep === 4 ? (
          <MachineCreateReviewStep
            mode={mode}
            requestPayload={previewPayload}
            requestError={requestPreview.error}
            quote={quote}
            quoteLoading={quoteLoading}
            quoteError={quoteError}
            quoteUnsupported={quoteUnsupported}
            staleMessages={catalog.staleMessages}
            catalogErrors={catalog.errors}
            onQuote={() => void handleQuote()}
            canQuote={canQuote}
          />
        ) : null}
      </Form>
    </Modal>
  );
};

export default MachineCreateWizardModal;
