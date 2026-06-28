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
    'name',
    ['zone', 'country_code'],
    ['zone', 'zone_id'],
    ['spec', 'type'],
    ['os', 'image_id'],
    'count',
  ],
  [
    ['billing', 'mode'],
    ['disk', 'system_size_gb'],
  ],
  [
    ['vpc', 'vpc_id'],
    ['internet', 'bandwidth_mbps'],
  ],
  [['login', 'auth_type'], 'time_zone'],
  [],
];

const buildDefaultValues = (): Partial<MachineCreateFormValues> => ({
  count: 1,
  login: {
    auth_type: 'provider_key',
    username: 'root',
  },
  tags: [],
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
    const result: Record<string, unknown> = {
      ...(base as Record<string, unknown>),
    };

    Object.entries(override as Record<string, unknown>).forEach(
      ([key, value]) => {
        result[key] = deepMerge(
          (result[key] as never) ?? (value as never),
          value as never,
        );
      },
    );

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
  const watchedCountryCode = Form.useWatch(['zone', 'country_code'], {
    form,
    preserve: true,
  });
  const watchedCity = Form.useWatch(['zone', 'city'], {
    form,
    preserve: true,
  });
  const watchedZoneId = Form.useWatch(['zone', 'zone_id'], {
    form,
    preserve: true,
  });
  const watchedVpcId = Form.useWatch(['vpc', 'vpc_id'], {
    form,
    preserve: true,
  });
  const watchedValues = Form.useWatch([], form) as
    | MachineCreateFormValues
    | undefined;

  const effectiveAccountId =
    mode === 'retry'
      ? retrying?.account_id || watchedAccountId
      : watchedAccountId;

  const catalog = useMachineCreateCatalogs({
    open,
    accountId: effectiveAccountId || undefined,
    countryCode: watchedCountryCode,
    city: watchedCity,
    zoneId: watchedZoneId,
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
      requestPreview.payload?.name &&
      requestPreview.payload?.zone?.country_code &&
      requestPreview.payload?.zone?.zone_id &&
      requestPreview.payload?.spec?.type &&
      requestPreview.payload?.os?.image_id &&
      requestPreview.payload?.disk?.system_size_gb &&
      requestPreview.payload?.vpc?.vpc_id &&
      requestPreview.payload?.internet?.bandwidth_mbps &&
      requestPreview.payload?.login?.auth_type &&
      requestPreview.payload?.time_zone &&
      requestPreview.payload?.billing?.mode,
  );

  const previewPayload = useMemo<
    Partial<API.AssetMachineCreateFromProviderParams> | undefined
  >(() => {
    if (!requestPreview.payload) {
      return undefined;
    }

    return {
      ...requestPreview.payload,
      login: requestPreview.payload.login
        ? {
            ...requestPreview.payload.login,
            password: requestPreview.payload.login.password
              ? '******'
              : undefined,
          }
        : undefined,
    };
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
    const nextZone = { ...(form.getFieldValue('zone') || {}) };
    const nextSpec = { ...(form.getFieldValue('spec') || {}) };
    const nextOs = { ...(form.getFieldValue('os') || {}) };
    const nextVpc = { ...(form.getFieldValue('vpc') || {}) };
    const nextInternet = { ...(form.getFieldValue('internet') || {}) };
    const nextBilling = { ...(form.getFieldValue('billing') || {}) };
    const nextLogin = { ...(form.getFieldValue('login') || {}) };

    let zoneChanged = false;
    let specChanged = false;
    let osChanged = false;
    let vpcChanged = false;
    let internetChanged = false;
    let billingChanged = false;
    let loginChanged = false;

    if (
      nextZone.zone_id &&
      !isOptionAvailable(
        nextZone.zone_id,
        catalog.getFieldOptions('zone.zone_id'),
      )
    ) {
      nextZone.zone_id = undefined;
      nextSpec.type = undefined;
      nextOs.image_id = undefined;
      nextVpc.vpc_id = undefined;
      nextVpc.vswitch_id = undefined;
      nextInternet.charge_type = undefined;
      nextInternet.bandwidth_mbps = undefined;
      nextInternet.traffic_package_size = undefined;
      nextInternet.eip_v4_type = undefined;
      zoneChanged = true;
      specChanged = true;
      osChanged = true;
      vpcChanged = true;
      internetChanged = true;
    }

    if (
      nextSpec.type &&
      !isOptionAvailable(nextSpec.type, catalog.getFieldOptions('spec.type'))
    ) {
      nextSpec.type = undefined;
      specChanged = true;
    }

    if (
      nextOs.image_id &&
      !isOptionAvailable(
        nextOs.image_id,
        catalog.getFieldOptions('os.image_id'),
      )
    ) {
      nextOs.image_id = undefined;
      osChanged = true;
    }

    if (
      nextVpc.vpc_id &&
      !isOptionAvailable(nextVpc.vpc_id, catalog.getFieldOptions('vpc.vpc_id'))
    ) {
      nextVpc.vpc_id = undefined;
      nextVpc.vswitch_id = undefined;
      vpcChanged = true;
    }

    if (
      nextVpc.vswitch_id &&
      !isOptionAvailable(
        nextVpc.vswitch_id,
        catalog.getFieldOptions('vpc.vswitch_id'),
      )
    ) {
      nextVpc.vswitch_id = undefined;
      vpcChanged = true;
    }

    if (
      nextInternet.charge_type &&
      !isOptionAvailable(
        nextInternet.charge_type,
        catalog.getFieldOptions('internet.charge_type'),
      )
    ) {
      nextInternet.charge_type = undefined;
      internetChanged = true;
    }

    if (
      nextInternet.bandwidth_mbps &&
      !isOptionAvailable(
        nextInternet.bandwidth_mbps,
        catalog.getFieldOptions('internet.bandwidth_mbps'),
      )
    ) {
      nextInternet.bandwidth_mbps = undefined;
      internetChanged = true;
    }

    if (
      nextInternet.traffic_package_size &&
      !isOptionAvailable(
        nextInternet.traffic_package_size,
        catalog.getFieldOptions('internet.traffic_package_size'),
      )
    ) {
      nextInternet.traffic_package_size = undefined;
      internetChanged = true;
    }

    if (
      nextInternet.eip_v4_type &&
      !isOptionAvailable(
        nextInternet.eip_v4_type,
        catalog.getFieldOptions('internet.eip_v4_type'),
      )
    ) {
      nextInternet.eip_v4_type = undefined;
      internetChanged = true;
    }

    if (
      nextBilling.mode &&
      !isOptionAvailable(
        nextBilling.mode,
        catalog.getFieldOptions('billing.mode'),
      )
    ) {
      nextBilling.mode = undefined;
      billingChanged = true;
    }

    if (
      nextBilling.period_unit &&
      !isOptionAvailable(
        nextBilling.period_unit,
        catalog.getFieldOptions('billing.period_unit'),
      )
    ) {
      nextBilling.period_unit = undefined;
      billingChanged = true;
    }

    if (
      nextLogin.provider_key_id &&
      !isOptionAvailable(
        nextLogin.provider_key_id,
        catalog.getFieldOptions('login.provider_key_id'),
      )
    ) {
      nextLogin.provider_key_id = undefined;
      loginChanged = true;
    }

    if (
      form.getFieldValue('time_zone') &&
      !isOptionAvailable(
        form.getFieldValue('time_zone'),
        catalog.getFieldOptions('time_zone'),
      )
    ) {
      nextValues.time_zone = undefined;
    }

    if (zoneChanged) {
      nextValues.zone = nextZone;
    }
    if (specChanged) {
      nextValues.spec = nextSpec;
    }
    if (osChanged) {
      nextValues.os = nextOs;
    }
    if (vpcChanged) {
      nextValues.vpc = nextVpc;
    }
    if (internetChanged) {
      nextValues.internet = nextInternet;
    }
    if (billingChanged) {
      nextValues.billing = nextBilling;
    }
    if (loginChanged) {
      nextValues.login = nextLogin;
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
    { key: 'billing', title: 'Billing & Disk' },
    { key: 'network', title: 'VPC & Internet' },
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
            onClick={() =>
              setCurrentStep((current) => Math.max(current - 1, 0))
            }
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
            zoneReady={Boolean(watchedZoneId)}
          />
        ) : null}
        {currentStep === 2 ? (
          <MachineCreateNetworkStep
            catalog={catalog}
            zoneReady={Boolean(watchedZoneId)}
          />
        ) : null}
        {currentStep === 3 ? (
          <MachineCreateAccessStep catalog={catalog} />
        ) : null}
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
