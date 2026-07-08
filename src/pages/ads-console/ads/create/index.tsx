import {
  BranchesOutlined,
  CopyOutlined,
  EditOutlined,
  FileImageOutlined,
  FlagOutlined,
  GlobalOutlined,
  MoreOutlined,
  PlusOutlined,
  RocketOutlined,
  SendOutlined,
} from '@ant-design/icons';
import {
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-components';
import { history, useSearchParams } from '@umijs/max';
import {
  App,
  Button,
  Descriptions,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Segmented,
  Space,
  Tag,
  Tree,
  Typography,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import {
  getPageOptions,
  getPixelOptions,
} from '@/services/ads-console/adsOptions';
import { createMetaAdFlow, type CreationFlowPayload, type CreationFlowResult } from '@/services/ads-console/creation';
import { updateCampaign as updateCampaignEntity } from '@/services/ads-console/campaign';
import { updateAdset as updateAdsetEntity } from '@/services/ads-console/adset';
import { updateAd as updateAdEntity } from '@/services/ads-console/ad';
import { getCreativePage, updateCreative as updateCreativeEntity } from '@/services/ads-console/creative';
import './index.less';

const { Text } = Typography;

type BudgetMode = 'ABO' | 'CBO';
type AssetType = 'image_url' | 'image_hash' | 'video';
type ObjectiveValue =
  | 'OUTCOME_SALES'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_APP_PROMOTION'
  | 'OUTCOME_AWARENESS';

type CampaignDraft = {
  accountId?: string;
  accountName?: string;
  currency?: string;
  name: string;
  objective: string;
  budgetMode: BudgetMode;
  specialAdCategories: string[];
  specialAdCategoryCountry?: string[];
  bidStrategy?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  spendCap?: number;
  startTime?: unknown;
  stopTime?: unknown;
};

type AdsetDraft = {
  id: string;
  name: string;
  optimizationGoal: string;
  billingEvent: string;
  destinationType: string;
  pixelId?: string;
  customEventType?: string;
  bidStrategy?: string;
  bidAmount?: number;
  dailyBudget?: number;
  lifetimeBudget?: number;
  startTime?: unknown;
  endTime?: unknown;
  countries: string[];
  locationTypes?: string[];
  ageMin?: number;
  ageMax?: number;
  genders?: number[];
  advantageAudience?: boolean;
  individualSettingAge?: number;
  individualSettingGender?: number;
  brandSafetyContentFilterLevels?: string[];
  publisherPlatforms?: string[];
  facebookPositions?: string[];
  instagramPositions?: string[];
  targetingJson?: string;
  promotedObjectJson?: string;
  ads: AdDraft[];
};

type AdDraft = {
  id: string;
  name: string;
  creativeName: string;
  pageId?: string;
  title: string;
  body: string;
  linkUrl?: string;
  description?: string;
  callToAction: string;
  assetType: AssetType;
  imageUrl?: string;
  imageHash?: string;
  videoId?: string;
  thumbnailUrl?: string;
};

type SelectedNode =
  | { type: 'campaign'; key: 'campaign' }
  | { type: 'adset'; key: string; adsetId: string }
  | { type: 'ad'; key: string; adsetId: string; adId: string };

type EditContext = {
  scope: 'campaign' | 'adset' | 'ad';
  localId?: string;
  creativeLocalId?: string;
};

type ValidationTarget =
  | { type: 'campaign'; key: 'campaign'; fieldName?: string }
  | { type: 'adset'; key: string; adsetId: string; fieldName?: string }
  | { type: 'ad'; key: string; adsetId: string; adId: string; fieldName?: string };

const campaignObjectives = [
  { label: '销量', value: 'OUTCOME_SALES' },
  { label: '潜在客户', value: 'OUTCOME_LEADS' },
  { label: '流量', value: 'OUTCOME_TRAFFIC' },
  { label: '互动', value: 'OUTCOME_ENGAGEMENT' },
  { label: '应用推广', value: 'OUTCOME_APP_PROMOTION' },
  { label: '认知', value: 'OUTCOME_AWARENESS' },
];

const bidStrategies = [
  { label: 'Lowest cost', value: 'LOWEST_COST_WITHOUT_CAP' },
  { label: 'Bid cap', value: 'LOWEST_COST_WITH_BID_CAP' },
  { label: 'Cost cap', value: 'COST_CAP' },
  { label: 'Min ROAS', value: 'LOWEST_COST_WITH_MIN_ROAS' },
];

const optimizationGoals = [
  { label: '站外转化', value: 'OFFSITE_CONVERSIONS' },
  { label: '落地页浏览', value: 'LANDING_PAGE_VIEWS' },
  { label: '链接点击', value: 'LINK_CLICKS' },
  { label: '曝光', value: 'IMPRESSIONS' },
  { label: '覆盖', value: 'REACH' },
  { label: '应用安装', value: 'APP_INSTALLS' },
  { label: '潜在客户', value: 'LEAD_GENERATION' },
  { label: '价值', value: 'VALUE' },
];

const billingEvents = [
  { label: '展示', value: 'IMPRESSIONS' },
  { label: '链接点击', value: 'LINK_CLICKS' },
  { label: '点击', value: 'CLICKS' },
  { label: '应用安装', value: 'APP_INSTALLS' },
  { label: '购买', value: 'PURCHASE' },
  { label: 'ThruPlay', value: 'THRUPLAY' },
];

const destinationTypes = [
  { label: '网站', value: 'WEBSITE' },
  { label: '应用', value: 'APP' },
  { label: 'Facebook Page', value: 'FACEBOOK_PAGE' },
  { label: 'Messenger', value: 'MESSENGER' },
  { label: 'WhatsApp', value: 'WHATSAPP' },
];

const pixelEventOptions = [
  { label: 'Purchase', value: 'PURCHASE' },
  { label: 'Lead', value: 'LEAD' },
  { label: 'Complete Registration', value: 'COMPLETE_REGISTRATION' },
  { label: 'Add To Cart', value: 'ADD_TO_CART' },
  { label: 'Initiate Checkout', value: 'INITIATED_CHECKOUT' },
  { label: 'View Content', value: 'VIEW_CONTENT' },
  { label: 'Subscribe', value: 'SUBSCRIBE' },
  { label: 'Search', value: 'SEARCH' },
];

const locationTypeOptions = [
  { label: 'Home', value: 'home' },
  { label: 'Recent', value: 'recent' },
  { label: 'Travel In', value: 'travel_in' },
];

const brandSafetyOptions = [
  { label: 'Facebook Relaxed', value: 'FACEBOOK_RELAXED' },
  { label: 'Audience Network Relaxed', value: 'AN_RELAXED' },
  { label: 'Facebook Standard', value: 'FACEBOOK_STANDARD' },
  { label: 'Audience Network Standard', value: 'AN_STANDARD' },
  { label: 'Facebook Limited', value: 'FACEBOOK_LIMITED' },
  { label: 'Audience Network Limited', value: 'AN_LIMITED' },
];

const ctaOptions = [
  { label: 'Learn More', value: 'LEARN_MORE' },
  { label: 'Shop Now', value: 'SHOP_NOW' },
  { label: 'Sign Up', value: 'SIGN_UP' },
  { label: 'Download', value: 'DOWNLOAD' },
  { label: 'Contact Us', value: 'CONTACT_US' },
  { label: 'Subscribe', value: 'SUBSCRIBE' },
  { label: 'Apply Now', value: 'APPLY_NOW' },
  { label: 'Book Now', value: 'BOOK_NOW' },
];

const platformOptions = [
  { label: 'Facebook', value: 'facebook' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Audience Network', value: 'audience_network' },
  { label: 'Messenger', value: 'messenger' },
];

const facebookPositionOptions = [
  { label: 'Feed', value: 'feed' },
  { label: 'Story', value: 'story' },
  { label: 'Marketplace', value: 'marketplace' },
  { label: 'Video Feeds', value: 'video_feeds' },
  { label: 'Right Hand Column', value: 'right_hand_column' },
];

const instagramPositionOptions = [
  { label: 'Stream', value: 'stream' },
  { label: 'Story', value: 'story' },
  { label: 'Explore', value: 'explore' },
  { label: 'Reels', value: 'reels' },
];

const countryOptions = [
  { label: 'United States', value: 'US' },
  { label: 'Canada', value: 'CA' },
  { label: 'United Kingdom', value: 'GB' },
  { label: 'Australia', value: 'AU' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Japan', value: 'JP' },
  { label: 'Singapore', value: 'SG' },
  { label: 'Malaysia', value: 'MY' },
  { label: 'Thailand', value: 'TH' },
  { label: 'Philippines', value: 'PH' },
  { label: 'Indonesia', value: 'ID' },
];

const makeId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;

const createAd = (index: number): AdDraft => ({
  id: makeId('ad'),
  name: `New Ad ${index}`,
  creativeName: `Creative ${index}`,
  title: '',
  body: '',
  callToAction: 'LEARN_MORE',
  assetType: 'image_url',
});

const createAdset = (index: number): AdsetDraft => ({
  id: makeId('adset'),
  name: `New Ad Set ${index}`,
  optimizationGoal: 'OFFSITE_CONVERSIONS',
  billingEvent: 'IMPRESSIONS',
  destinationType: 'WEBSITE',
  dailyBudget: 20,
  countries: ['US'],
  locationTypes: ['home', 'recent'],
  ageMin: 18,
  ageMax: 65,
  advantageAudience: true,
  individualSettingAge: 1,
  individualSettingGender: 1,
  brandSafetyContentFilterLevels: ['FACEBOOK_RELAXED', 'AN_RELAXED'],
  publisherPlatforms: ['facebook', 'instagram'],
  facebookPositions: ['feed'],
  instagramPositions: ['stream', 'story'],
  ads: [createAd(1)],
});

const requiresBidAmount = (bidStrategy?: string) =>
  bidStrategy === 'LOWEST_COST_WITH_BID_CAP' || bidStrategy === 'COST_CAP';

const isWebsiteLinkRequired = (optimizationGoal?: string, destinationType?: string) =>
  destinationType === 'WEBSITE'
  || optimizationGoal === 'OFFSITE_CONVERSIONS'
  || optimizationGoal === 'LINK_CLICKS'
  || optimizationGoal === 'LANDING_PAGE_VIEWS';

const resolveAllowedOptimizationGoals = (objective?: ObjectiveValue, destinationType?: string) => {
  if (objective === 'OUTCOME_APP_PROMOTION' || destinationType === 'APP') {
    return ['APP_INSTALLS'];
  }
  if (objective === 'OUTCOME_AWARENESS') {
    return ['IMPRESSIONS', 'REACH'];
  }
  if (objective === 'OUTCOME_TRAFFIC') {
    return ['LINK_CLICKS', 'LANDING_PAGE_VIEWS', 'IMPRESSIONS'];
  }
  return optimizationGoals.map((item) => item.value);
};

const resolveAllowedDestinations = (objective?: ObjectiveValue) => {
  if (objective === 'OUTCOME_APP_PROMOTION') {
    return ['APP'];
  }
  return destinationTypes.map((item) => item.value);
};

const initialCampaign: CampaignDraft = {
  name: 'New Sales Campaign',
  objective: 'OUTCOME_SALES',
  budgetMode: 'ABO',
  specialAdCategories: ['NONE'],
};

const normalizeDateTime = (value?: unknown) => {
  if (!value) return undefined;
  if (dayjs.isDayjs(value)) return value.format('YYYY-MM-DDTHH:mm:ssZZ');
  return String(value);
};

const toNumber = (value?: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const fromMinorMoney = (value?: string | null) => {
  const n = toNumber(value);
  return n === undefined ? undefined : n / 100;
};

const prune = <T extends Record<string, any>>(value: T): T => {
  Object.keys(value).forEach((key) => {
    const item = value[key];
    if (item === undefined || item === null || item === '' || (Array.isArray(item) && item.length === 0)) {
      delete value[key];
    }
  });
  return value;
};

const parseJsonObject = (value?: string) => {
  if (!value?.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error('高级定向 JSON 必须是对象');
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('高级定向 JSON 解析失败');
  }
};

const hasPromotedObjectField = (value: string | undefined, field: string) => {
  const parsed = parseJsonObject(value);
  const fieldValue = parsed?.[field];
  return fieldValue !== undefined && fieldValue !== null && String(fieldValue).trim() !== '';
};

const findValidationTarget = (messageText: string, adsetList: AdsetDraft[]): ValidationTarget | undefined => {
  if (messageText.startsWith('Campaign')) {
    if (messageText.includes('预算方式')) return { type: 'campaign', key: 'campaign', fieldName: 'budgetMode' };
    if (messageText.includes('日预算')) return { type: 'campaign', key: 'campaign', fieldName: 'dailyBudget' };
    if (messageText.includes('总预算')) return { type: 'campaign', key: 'campaign', fieldName: 'lifetimeBudget' };
    if (messageText.includes('结束时间')) return { type: 'campaign', key: 'campaign', fieldName: 'stopTime' };
    return { type: 'campaign', key: 'campaign' };
  }

  const adMatch = messageText.match(/^Ad Set (\d+) \/ Ad (\d+)/);
  if (adMatch) {
    const adsetIndex = Number(adMatch[1]) - 1;
    const adIndex = Number(adMatch[2]) - 1;
    const adset = adsetList[adsetIndex];
    const ad = adset?.ads?.[adIndex];
    if (adset && ad) {
      let fieldName: string | undefined;
      if (messageText.includes('Facebook Page')) fieldName = 'pageId';
      else if (messageText.includes('标题')) fieldName = 'title';
      else if (messageText.includes('正文')) fieldName = 'body';
      else if (messageText.includes('落地页 URL')) fieldName = 'linkUrl';
      else if (messageText.includes('Image URL')) fieldName = 'imageUrl';
      else if (messageText.includes('Image Hash')) fieldName = 'imageHash';
      else if (messageText.includes('Video ID')) fieldName = 'videoId';
      else if (messageText.includes('Creative 名称')) fieldName = 'creativeName';
      return { type: 'ad', key: `ad:${adset.id}:${ad.id}`, adsetId: adset.id, adId: ad.id, fieldName };
    }
  }

  const adsetMatch = messageText.match(/^Ad Set (\d+)/);
  if (adsetMatch) {
    const adsetIndex = Number(adsetMatch[1]) - 1;
    const adset = adsetList[adsetIndex];
    if (adset) {
      let fieldName: string | undefined;
      if (messageText.includes('预算')) fieldName = 'dailyBudget';
      else if (messageText.includes('结束时间')) fieldName = 'endTime';
      else if (messageText.includes('名称')) fieldName = 'name';
      else if (messageText.includes('优化目标')) fieldName = 'optimizationGoal';
      else if (messageText.includes('转化位置')) fieldName = 'destinationType';
      else if (messageText.includes('Pixel')) fieldName = 'pixelId';
      else if (messageText.includes('promoted_object')) fieldName = 'promotedObjectJson';
      else if (messageText.includes('国家')) fieldName = 'countries';
      else if (messageText.includes('出价')) fieldName = 'bidAmount';
      return { type: 'adset', key: `adset:${adset.id}`, adsetId: adset.id, fieldName };
    }
  }

  return undefined;
};

const buildTargetingJson = (adset: AdsetDraft) => {
  const targeting = prune({
    geo_locations:
      adset.countries?.length || adset.locationTypes?.length
        ? prune({
            countries: adset.countries,
            location_types: adset.locationTypes,
          })
        : undefined,
    age_min: toNumber(adset.ageMin),
    age_max: toNumber(adset.ageMax),
    age_range:
      toNumber(adset.ageMin) !== undefined && toNumber(adset.ageMax) !== undefined
        ? [toNumber(adset.ageMin), toNumber(adset.ageMax)]
        : undefined,
    genders: adset.genders,
    targeting_automation:
      adset.advantageAudience || toNumber(adset.individualSettingAge) !== undefined || toNumber(adset.individualSettingGender) !== undefined
        ? prune({
            advantage_audience: adset.advantageAudience ? 1 : undefined,
            individual_setting:
              toNumber(adset.individualSettingAge) !== undefined || toNumber(adset.individualSettingGender) !== undefined
                ? prune({
                    age: toNumber(adset.individualSettingAge),
                    gender: toNumber(adset.individualSettingGender),
                  })
                : undefined,
          })
        : undefined,
    brand_safety_content_filter_levels: adset.brandSafetyContentFilterLevels,
    publisher_platforms: adset.publisherPlatforms,
    facebook_positions: adset.facebookPositions,
    instagram_positions: adset.instagramPositions,
  });
  const merged = {
    ...targeting,
    ...parseJsonObject(adset.targetingJson),
  };
  return Object.keys(prune(merged)).length ? JSON.stringify(prune(merged)) : undefined;
};

const buildPromotedObjectJson = (adset: AdsetDraft) => {
  if (adset.promotedObjectJson) return adset.promotedObjectJson;
  if (!adset.pixelId?.trim()) return undefined;
  return JSON.stringify(
    prune({
      pixel_id: adset.pixelId.trim(),
      custom_event_type: adset.customEventType || 'PURCHASE',
    }),
  );
};

const findAdset = (adsets: AdsetDraft[], adsetId?: string) => adsets.find((item) => item.id === adsetId);

const findAd = (adsets: AdsetDraft[], adsetId?: string, adId?: string) =>
  findAdset(adsets, adsetId)?.ads.find((item) => item.id === adId);

const buildExpandedKeys = (items: AdsetDraft[]) => [
  'campaign',
  ...items.map((adset) => `adset:${adset.id}`),
];

const buildTreeData = (campaign: CampaignDraft, adsets: AdsetDraft[]): DataNode[] => [
  {
    key: 'campaign',
    title: (
      <span className={'meta-create-tree-title'}>
        <FlagOutlined />
        <span>{campaign.name || 'Campaign'}</span>
      </span>
    ),
    children: adsets.map((adset) => ({
      key: `adset:${adset.id}`,
      title: (
        <span className={'meta-create-tree-title'}>
          <BranchesOutlined />
          <span>{adset.name || 'Ad Set'}</span>
        </span>
      ),
      children: adset.ads.map((ad) => ({
        key: `ad:${adset.id}:${ad.id}`,
        title: (
          <span className={'meta-create-tree-title'}>
            <RocketOutlined />
            <span>{ad.name || 'Ad'}</span>
          </span>
        ),
      })),
    })),
  },
];

const parseSelectedKey = (key: string): SelectedNode => {
  if (key === 'campaign') return { type: 'campaign', key: 'campaign' };
  const [type, adsetId, adId] = key.split(':');
  if (type === 'ad') return { type: 'ad', key, adsetId, adId };
  return { type: 'adset', key, adsetId };
};

const MetaCreatePage: React.FC = () => {
  const { message, modal } = App.useApp();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const initialAdsets = useMemo(() => [createAdset(1)], []);
  const [pageOptions, setPageOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [pixelOptions, setPixelOptions] = useState<AdsConsole.SelectOption[]>([]);
  const [campaign, setCampaign] = useState<CampaignDraft>(initialCampaign);
  const [adsets, setAdsets] = useState<AdsetDraft[]>(initialAdsets);
  const [selected, setSelected] = useState<SelectedNode>({ type: 'campaign', key: 'campaign' });
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(buildExpandedKeys(initialAdsets));
  const [sidebarWidth, setSidebarWidth] = useState(340);
  const [resizeStart, setResizeStart] = useState<{ x: number; width: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreationFlowResult | null>(null);
  const isEditMode = searchParams.get('mode') === 'edit';
  const editQuery = searchParams.toString();
  const returnTo = searchParams.get('returnTo') || '/ads-console/ads/summary';
  const [editContext, setEditContext] = useState<EditContext | null>(null);

  useEffect(() => {
    if (!campaign.accountId) {
      setPageOptions([]);
      setPixelOptions([]);
      return;
    }
    getPageOptions(campaign.accountId).then((res) => {
      if (res?.success) setPageOptions(res.data || []);
    });
    getPixelOptions(campaign.accountId).then((res) => {
      if (res?.success) setPixelOptions(res.data || []);
    });
  }, [campaign.accountId]);

  useEffect(() => {
    const accountId = searchParams.get('accountId');
    if (accountId) return;
    message.warning('请从广告账户页或广告汇总页进入广告创建页面');
    history.replace(returnTo);
  }, [message, returnTo, searchParams]);

  useEffect(() => {
    if (!resizeStart) return;
    const handleMouseMove = (event: MouseEvent) => {
      const nextWidth = resizeStart.width + event.clientX - resizeStart.x;
      setSidebarWidth(Math.max(280, Math.min(520, nextWidth)));
    };
    const stopResize = () => setResizeStart(null);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopResize);
    document.body.classList.add('meta-create-resizing');
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopResize);
      document.body.classList.remove('meta-create-resizing');
    };
  }, [resizeStart]);

  useEffect(() => {
    if (isEditMode) return;
    const accountId = searchParams.get('accountId') || undefined;
    if (!accountId) return;
    const accountName = searchParams.get('accountName') || undefined;
    const currency = searchParams.get('currency') || undefined;
    setCampaign((prev) => ({
      ...prev,
      accountId,
      accountName,
      currency,
    }));
  }, [isEditMode, searchParams]);

  useEffect(() => {
    if (!isEditMode) return;

    const scope = searchParams.get('scope') || 'campaign';
    const accountId = searchParams.get('accountId') || undefined;
    const campaignId = searchParams.get('campaignId') || undefined;
    const adsetId = searchParams.get('adsetId') || undefined;
    const adId = searchParams.get('adId') || undefined;
    const localId = searchParams.get('localId') || undefined;
    const name = searchParams.get('name') || undefined;
    const budgetMode = (searchParams.get('budgetMode') as BudgetMode | null) || 'ABO';
    const budgetValue = searchParams.get('budgetValue');
    const budgetValueType = searchParams.get('budgetValueType') || 'daily';
    const budgetSource = searchParams.get('budgetSource');
    const bidStrategy = searchParams.get('bidStrategy') || undefined;
    const creativeId = searchParams.get('creativeId') || undefined;
    const status = searchParams.get('status') || undefined;

    const nextCampaign: CampaignDraft = {
      ...initialCampaign,
      accountId,
      accountName: searchParams.get('accountName') || undefined,
      currency: searchParams.get('currency') || undefined,
      budgetMode: budgetMode === 'CBO' ? 'CBO' : 'ABO',
      bidStrategy,
      dailyBudget: budgetMode === 'CBO' && budgetValueType === 'daily' ? fromMinorMoney(budgetValue) : undefined,
      lifetimeBudget: budgetMode === 'CBO' && budgetValueType === 'lifetime' ? fromMinorMoney(budgetValue) : undefined,
      name: scope === 'campaign' && name ? name : campaignId ? `Campaign ${campaignId}` : initialCampaign.name,
    };
    const nextAdset = {
      ...createAdset(1),
      id: adsetId || makeId('adset'),
      bidStrategy,
      dailyBudget: budgetMode === 'ABO' && budgetSource !== 'campaign' && budgetValueType === 'daily' ? fromMinorMoney(budgetValue) : undefined,
      lifetimeBudget: budgetMode === 'ABO' && budgetSource !== 'campaign' && budgetValueType === 'lifetime' ? fromMinorMoney(budgetValue) : undefined,
      name: scope === 'adset' && name ? name : adsetId ? `Ad Set ${adsetId}` : 'Ad Set',
    };
    const nextAd = {
      ...createAd(1),
      id: adId || makeId('ad'),
      name: scope === 'ad' && name ? name : adId ? `Ad ${adId}` : 'Ad',
      creativeName: creativeId || (scope === 'ad' && name ? `${name} Creative` : 'Creative 1'),
    };

    nextAdset.ads = [nextAd];
    setCampaign(nextCampaign);
    setAdsets([nextAdset]);
    setExpandedKeys(buildExpandedKeys([nextAdset]));

    if (scope === 'ad' && adId) {
      setSelected({ type: 'ad', key: `ad:${nextAdset.id}:${nextAd.id}`, adsetId: nextAdset.id, adId: nextAd.id });
      setEditContext({ scope: 'ad', localId });
      getCreativePage({ current: 1, size: 1, adId }).then((res) => {
        const creative = res?.data?.records?.[0];
        if (!creative) return;
        setEditContext((prev) => ({ ...(prev || { scope: 'ad', localId }), creativeLocalId: creative.id }));
        setAdsets((prev) =>
          prev.map((adset) =>
            adset.id === nextAdset.id
              ? {
                  ...adset,
                  ads: adset.ads.map((ad) =>
                    ad.id === nextAd.id
                      ? {
                          ...ad,
                          creativeName: creative.name || ad.creativeName,
                          title: creative.title || ad.title,
                          body: creative.body || ad.body,
                          linkUrl: creative.linkUrl || creative.landingUrl || ad.linkUrl,
                          description: ad.description,
                          imageUrl: creative.imageUrl || ad.imageUrl,
                          videoId: creative.videoUrl || ad.videoId,
                          thumbnailUrl: creative.thumbnailUrl || ad.thumbnailUrl,
                          callToAction: creative.callToAction || creative.cta || ad.callToAction,
                          assetType: creative.videoUrl ? 'video' : 'image_url',
                        }
                      : ad,
                  ),
                }
              : adset,
          ),
        );
      });
    } else if (scope === 'adset' && adsetId) {
      setSelected({ type: 'adset', key: `adset:${nextAdset.id}`, adsetId: nextAdset.id });
      setEditContext({ scope: 'adset', localId });
    } else {
      setSelected({ type: 'campaign', key: 'campaign' });
      setEditContext({ scope: 'campaign', localId });
    }
    if (status) {
      setResult(null);
    }
  }, [isEditMode, editQuery, searchParams]);

  const selectedAdset = useMemo(
    () => (selected.type === 'campaign' ? undefined : findAdset(adsets, selected.adsetId)),
    [adsets, selected],
  );

  const selectedAd = useMemo(
    () => (selected.type === 'ad' ? findAd(adsets, selected.adsetId, selected.adId) : undefined),
    [adsets, selected],
  );

  const selectedAdsetBidStrategy = selectedAdset?.bidStrategy;
  const effectiveBidStrategy = campaign.budgetMode === 'CBO' ? campaign.bidStrategy : selectedAdsetBidStrategy;
  const allowedOptimizationGoals = useMemo(
    () => resolveAllowedOptimizationGoals(campaign.objective as ObjectiveValue | undefined, selectedAdset?.destinationType),
    [campaign.objective, selectedAdset?.destinationType],
  );
  const allowedDestinationTypes = useMemo(
    () => resolveAllowedDestinations(campaign.objective as ObjectiveValue | undefined),
    [campaign.objective],
  );

  const selectedValues = useMemo(() => {
    if (selected.type === 'campaign') return campaign;
    if (selected.type === 'adset') return selectedAdset;
    return selectedAd;
  }, [campaign, selected.type, selectedAd, selectedAdset]);

  useEffect(() => {
    form.setFieldsValue(selectedValues || {});
  }, [form, selectedValues]);

  const treeData = useMemo(() => buildTreeData(campaign, adsets), [campaign, adsets]);

  const handleValuesChange = (_changedValues: Record<string, any>, allValues: Record<string, any>) => {
    if (selected.type === 'campaign') {
      setCampaign((prev) => {
        const next = { ...prev, ...allValues };
        if (next.budgetMode === 'ABO') {
          next.dailyBudget = undefined;
          next.lifetimeBudget = undefined;
          next.bidStrategy = undefined;
        }
        return next;
      });
      setAdsets((prev) =>
        prev.map((item) => {
          const nextBudgetMode = (allValues.budgetMode ?? campaign.budgetMode) as BudgetMode;
          const nextObjective = (allValues.objective ?? campaign.objective) as ObjectiveValue | undefined;
          const next = { ...item };
          if (nextBudgetMode === 'CBO') {
            next.dailyBudget = undefined;
            next.lifetimeBudget = undefined;
            next.bidStrategy = undefined;
          }
          if (nextObjective === 'OUTCOME_APP_PROMOTION') {
            next.destinationType = 'APP';
            next.optimizationGoal = 'APP_INSTALLS';
          } else if (nextObjective === 'OUTCOME_AWARENESS' && !['IMPRESSIONS', 'REACH'].includes(next.optimizationGoal)) {
            next.optimizationGoal = 'IMPRESSIONS';
          } else if (nextObjective === 'OUTCOME_TRAFFIC' && !['LINK_CLICKS', 'LANDING_PAGE_VIEWS', 'IMPRESSIONS'].includes(next.optimizationGoal)) {
            next.optimizationGoal = 'LINK_CLICKS';
          }
          if (!requiresBidAmount(nextBudgetMode === 'CBO' ? allValues.bidStrategy ?? campaign.bidStrategy : next.bidStrategy)) {
            next.bidAmount = undefined;
          }
          return next;
        }),
      );
      return;
    }
    if (selected.type === 'adset') {
      setAdsets((prev) =>
        prev.map((item) => {
          if (item.id !== selected.adsetId) return item;
          const next = { ...item, ...allValues };
          if (campaign.budgetMode === 'CBO') {
            next.dailyBudget = undefined;
            next.lifetimeBudget = undefined;
            next.bidStrategy = undefined;
          }
          if (campaign.objective === 'OUTCOME_APP_PROMOTION') {
            next.destinationType = 'APP';
            next.optimizationGoal = 'APP_INSTALLS';
          }
          if (campaign.objective === 'OUTCOME_AWARENESS' && !['IMPRESSIONS', 'REACH'].includes(next.optimizationGoal)) {
            next.optimizationGoal = 'IMPRESSIONS';
          }
          if (campaign.objective === 'OUTCOME_TRAFFIC' && !['LINK_CLICKS', 'LANDING_PAGE_VIEWS', 'IMPRESSIONS'].includes(next.optimizationGoal)) {
            next.optimizationGoal = 'LINK_CLICKS';
          }
          if (next.destinationType === 'APP') {
            next.optimizationGoal = 'APP_INSTALLS';
          }
          if (!requiresBidAmount(campaign.budgetMode === 'CBO' ? campaign.bidStrategy : next.bidStrategy)) {
            next.bidAmount = undefined;
          }
          return next;
        }),
      );
      return;
    }
    setAdsets((prev) =>
      prev.map((adset) =>
        adset.id === selected.adsetId
          ? {
              ...adset,
              ads: adset.ads.map((ad) => (ad.id === selected.adId ? { ...ad, ...allValues } : ad)),
            }
          : adset,
      ),
    );
  };

  const syncCurrentForm = async (validate = false) => {
    const values = validate ? await form.validateFields() : form.getFieldsValue();
    if (selected.type === 'campaign') {
      setCampaign((prev) => ({ ...prev, ...values }));
      return { ...campaign, ...values } as CampaignDraft;
    }
    if (selected.type === 'adset') {
      setAdsets((prev) =>
        prev.map((item) => (item.id === selected.adsetId ? { ...item, ...values } : item)),
      );
      return values;
    }
    setAdsets((prev) =>
      prev.map((adset) =>
        adset.id === selected.adsetId
          ? {
              ...adset,
              ads: adset.ads.map((ad) => (ad.id === selected.adId ? { ...ad, ...values } : ad)),
            }
          : adset,
      ),
    );
    return values;
  };

  const selectNode = async (key: string) => {
    try {
      await syncCurrentForm(false);
      setSelected(parseSelectedKey(key));
    } catch {
      message.warning('请先补全当前配置');
    }
  };

  const focusValidationTarget = (target: ValidationTarget | undefined) => {
    if (!target) return;
    if (target.type === 'campaign') {
      setSelected({ type: 'campaign', key: 'campaign' });
    } else if (target.type === 'adset') {
      setExpandedKeys((prev) => Array.from(new Set([...prev, 'campaign', target.key])));
      setSelected({ type: 'adset', key: target.key, adsetId: target.adsetId });
    } else {
      setExpandedKeys((prev) => Array.from(new Set([...prev, 'campaign', `adset:${target.adsetId}`])));
      setSelected({ type: 'ad', key: target.key, adsetId: target.adsetId, adId: target.adId });
    }
    if (target.fieldName) {
      window.setTimeout(() => {
        form.scrollToField(target.fieldName);
      }, 0);
    }
  };

  const addAdset = async () => {
    await syncCurrentForm(false);
    const next = createAdset(adsets.length + 1);
    setAdsets((prev) => [...prev, next]);
    setExpandedKeys((prev) => Array.from(new Set([...prev, 'campaign', `adset:${next.id}`])));
    setSelected({ type: 'adset', key: `adset:${next.id}`, adsetId: next.id });
  };

  const addAd = async (adsetId: string) => {
    await syncCurrentForm(false);
    const parent = findAdset(adsets, adsetId);
    const next = createAd((parent?.ads.length || 0) + 1);
    setAdsets((prev) =>
      prev.map((item) => (item.id === adsetId ? { ...item, ads: [...item.ads, next] } : item)),
    );
    setExpandedKeys((prev) => Array.from(new Set([...prev, 'campaign', `adset:${adsetId}`])));
    setSelected({ type: 'ad', key: `ad:${adsetId}:${next.id}`, adsetId, adId: next.id });
  };

  const renameNode = (key: string) => {
    const node = parseSelectedKey(key);
    const currentName =
      node.type === 'campaign'
        ? campaign.name
        : node.type === 'adset'
          ? findAdset(adsets, node.adsetId)?.name
          : findAd(adsets, node.adsetId, node.adId)?.name;
    let nextName = currentName || '';
    modal.confirm({
      title: '重命名',
      icon: <EditOutlined />,
      content: <Input defaultValue={currentName} autoFocus onChange={(event) => { nextName = event.target.value; }} />,
      okText: '保存',
      onOk: () => {
        if (!nextName.trim()) return;
        if (node.type === 'campaign') {
          setCampaign((prev) => ({ ...prev, name: nextName.trim() }));
        } else if (node.type === 'adset') {
          setAdsets((prev) => prev.map((item) => (item.id === node.adsetId ? { ...item, name: nextName.trim() } : item)));
        } else {
          setAdsets((prev) =>
            prev.map((adset) =>
              adset.id === node.adsetId
                ? { ...adset, ads: adset.ads.map((ad) => (ad.id === node.adId ? { ...ad, name: nextName.trim() } : ad)) }
                : adset,
            ),
          );
        }
      },
    });
  };

  const copyNode = async (key: string) => {
    await syncCurrentForm(false);
    const node = parseSelectedKey(key);
    if (node.type === 'campaign') {
      const clones = adsets.map((adset, index) => ({
        ...adset,
        id: makeId('adset'),
        name: `${adset.name} Copy`,
        ads: adset.ads.map((ad, adIndex) => ({ ...ad, id: makeId('ad'), name: `${ad.name || `Ad ${adIndex + 1}`} Copy` })),
      }));
      setCampaign((prev) => ({ ...prev, name: `${prev.name} Copy` }));
      setAdsets(clones);
      return;
    }
    if (node.type === 'adset') {
      const source = findAdset(adsets, node.adsetId);
      if (!source) return;
      const clone = {
        ...source,
        id: makeId('adset'),
        name: `${source.name} Copy`,
        ads: source.ads.map((ad) => ({ ...ad, id: makeId('ad') })),
      };
      setAdsets((prev) => [...prev, clone]);
      setSelected({ type: 'adset', key: `adset:${clone.id}`, adsetId: clone.id });
      return;
    }
    const sourceAd = findAd(adsets, node.adsetId, node.adId);
    if (!sourceAd) return;
    const clone = { ...sourceAd, id: makeId('ad'), name: `${sourceAd.name} Copy`, creativeName: `${sourceAd.creativeName} Copy` };
    setAdsets((prev) =>
      prev.map((adset) => (adset.id === node.adsetId ? { ...adset, ads: [...adset.ads, clone] } : adset)),
    );
    setSelected({ type: 'ad', key: `ad:${node.adsetId}:${clone.id}`, adsetId: node.adsetId, adId: clone.id });
  };

  const nodeMenu = (key: string) => {
    const node = parseSelectedKey(key);
    return {
      items: [
        ...(node.type !== 'ad' ? [{ key: 'add', icon: <PlusOutlined />, label: node.type === 'campaign' ? '新增 Ad Set' : '新增 Ad' }] : []),
        { key: 'rename', icon: <EditOutlined />, label: '重命名' },
        { key: 'copy', icon: <CopyOutlined />, label: '复制' },
      ],
      onClick: async ({ key: action }: { key: string }) => {
        if (action === 'add') {
          if (node.type === 'campaign') await addAdset();
          if (node.type === 'adset') await addAd(node.adsetId);
        }
        if (action === 'rename') renameNode(key);
        if (action === 'copy') await copyNode(key);
      },
    };
  };

  const titleRender = (node: DataNode) => (
    <Dropdown menu={nodeMenu(String(node.key))} trigger={['contextMenu']}>
      <span className={'meta-create-tree-node'}>
        {node.title as React.ReactNode}
        <Dropdown menu={nodeMenu(String(node.key))} trigger={['click']}>
          <Button type="text" size="small" icon={<MoreOutlined />} className={'meta-create-node-more'} />
        </Dropdown>
      </span>
    </Dropdown>
  );

  const validateAll = (snapshotCampaign: CampaignDraft, snapshotAdsets: AdsetDraft[]) => {
    if (!snapshotCampaign.accountId) throw new Error('请选择广告账户');
    if (!snapshotCampaign.name?.trim()) throw new Error('请输入 Campaign 名称');
    if (snapshotCampaign.budgetMode === 'ABO' && snapshotCampaign.bidStrategy) {
      throw new Error('ABO 模式下 Campaign 不应配置竞价策略，请改到 Ad Set 配置');
    }
    if (snapshotCampaign.budgetMode === 'CBO' && !toNumber(snapshotCampaign.dailyBudget) && !toNumber(snapshotCampaign.lifetimeBudget)) {
      throw new Error('CBO 模式需要填写 Campaign 日预算或总预算');
    }
    if (snapshotCampaign.budgetMode === 'CBO' && toNumber(snapshotCampaign.dailyBudget) && toNumber(snapshotCampaign.lifetimeBudget)) {
      throw new Error('Campaign 日预算和总预算只能填一个');
    }
    if (snapshotCampaign.budgetMode === 'CBO' && snapshotCampaign.lifetimeBudget && !snapshotCampaign.stopTime) {
      throw new Error('Campaign 使用总预算时必须填写结束时间');
    }
    if (snapshotAdsets.length === 0) throw new Error('至少需要一个 Ad Set');

    snapshotAdsets.forEach((adset, index) => {
      const label = `Ad Set ${index + 1}`;
      if (!adset.name?.trim()) throw new Error(`${label} 需要名称`);
      if (snapshotCampaign.budgetMode === 'CBO' && adset.bidStrategy) {
        throw new Error(`${label} 在 CBO 模式下不应再配置竞价策略`);
      }
      if (snapshotCampaign.budgetMode === 'ABO' && !toNumber(adset.dailyBudget) && !toNumber(adset.lifetimeBudget)) {
        throw new Error(`${label} 在 ABO 模式下需要填写预算`);
      }
      if (toNumber(adset.dailyBudget) && toNumber(adset.lifetimeBudget)) {
        throw new Error(`${label} 日预算和总预算只能填一个`);
      }
      if (adset.lifetimeBudget && !adset.endTime) {
        throw new Error(`${label} 使用总预算时必须填写结束时间`);
      }
      if (toNumber(adset.ageMin) !== undefined && toNumber(adset.ageMax) !== undefined && Number(adset.ageMin) > Number(adset.ageMax)) {
        throw new Error(`${label} 最小年龄不能大于最大年龄`);
      }
      if (snapshotCampaign.objective === 'OUTCOME_APP_PROMOTION' && adset.destinationType !== 'APP') {
        throw new Error(`${label} 在应用推广 Campaign 下必须使用 APP 作为转化位置`);
      }
      if (adset.destinationType === 'APP' && adset.optimizationGoal !== 'APP_INSTALLS') {
        throw new Error(`${label} 的 APP 转化位置当前仅支持 APP_INSTALLS 优化目标`);
      }
      if (snapshotCampaign.objective === 'OUTCOME_AWARENESS' && !['IMPRESSIONS', 'REACH'].includes(adset.optimizationGoal)) {
        throw new Error(`${label} 在认知 Campaign 下仅支持 IMPRESSIONS 或 REACH`);
      }
      if (snapshotCampaign.objective === 'OUTCOME_TRAFFIC' && !['LINK_CLICKS', 'LANDING_PAGE_VIEWS', 'IMPRESSIONS'].includes(adset.optimizationGoal)) {
        throw new Error(`${label} 在流量 Campaign 下仅支持 LINK_CLICKS / LANDING_PAGE_VIEWS / IMPRESSIONS`);
      }
      const bidStrategy = snapshotCampaign.budgetMode === 'CBO' ? snapshotCampaign.bidStrategy : adset.bidStrategy;
      if (requiresBidAmount(bidStrategy) && !toNumber(adset.bidAmount)) {
        throw new Error(`${label} 使用 Bid cap / Cost cap 时必须填写出价`);
      }
      if (!requiresBidAmount(bidStrategy) && toNumber(adset.bidAmount)) {
        throw new Error(`${label} 当前竞价策略不需要填写出价`);
      }
      if (adset.optimizationGoal === 'OFFSITE_CONVERSIONS' && adset.destinationType === 'WEBSITE' && !buildPromotedObjectJson(adset)) {
        throw new Error(`${label} 站外转化投放需要配置 Pixel 和转化事件`);
      }
      const promotedObjectJson = buildPromotedObjectJson(adset);
      if (adset.destinationType === 'APP') {
        if (!promotedObjectJson) {
          throw new Error(`${label} APP 投放需要配置 promoted_object`);
        }
        if (!hasPromotedObjectField(promotedObjectJson, 'application_id') || !hasPromotedObjectField(promotedObjectJson, 'object_store_url')) {
          throw new Error(`${label} APP 投放的 promoted_object 必须包含 application_id 和 object_store_url`);
        }
      }
      if (adset.optimizationGoal === 'LEAD_GENERATION' && !hasPromotedObjectField(promotedObjectJson, 'page_id')) {
        throw new Error(`${label} Lead Generation 需要在 promoted_object 中提供 page_id`);
      }
      if (['MESSENGER', 'WHATSAPP'].includes(adset.destinationType) && !hasPromotedObjectField(promotedObjectJson, 'page_id')) {
        throw new Error(`${label} Messenger / WhatsApp 投放需要在 promoted_object 中提供 page_id`);
      }
      if (!adset.ads?.length) throw new Error(`${label} 至少需要一个 Ad`);
      adset.ads.forEach((ad, adIndex) => {
        const adLabel = `${label} / Ad ${adIndex + 1}`;
        if (!ad.name?.trim()) throw new Error(`${adLabel} 需要名称`);
        if (!ad.pageId?.trim()) throw new Error(`${adLabel} 需要 Facebook Page ID`);
        if (!ad.title?.trim()) throw new Error(`${adLabel} 需要标题`);
        if (!ad.body?.trim()) throw new Error(`${adLabel} 需要正文`);
        if (isWebsiteLinkRequired(adset.optimizationGoal, adset.destinationType) && !ad.linkUrl?.trim()) {
          throw new Error(`${adLabel} 当前投放目标需要落地页 URL`);
        }
        if (ad.assetType === 'image_url' && !ad.imageUrl?.trim()) throw new Error(`${adLabel} 需要 Image URL`);
        if (ad.assetType === 'image_hash' && !ad.imageHash?.trim()) throw new Error(`${adLabel} 需要 Image Hash`);
        if (ad.assetType === 'video' && !ad.videoId?.trim()) throw new Error(`${adLabel} 需要 Video ID`);
      });
    });
  };

  const buildPayload = (snapshotCampaign: CampaignDraft, snapshotAdsets: AdsetDraft[]): CreationFlowPayload => ({
    campaign: prune({
      accountId: snapshotCampaign.accountId || '',
      name: snapshotCampaign.name,
      objective: snapshotCampaign.objective,
      buyingType: 'AUCTION',
      bidStrategy: snapshotCampaign.budgetMode === 'CBO' ? snapshotCampaign.bidStrategy : undefined,
      dailyBudget: snapshotCampaign.budgetMode === 'CBO' ? toNumber(snapshotCampaign.dailyBudget) : undefined,
      lifetimeBudget: snapshotCampaign.budgetMode === 'CBO' ? toNumber(snapshotCampaign.lifetimeBudget) : undefined,
      spendCap: toNumber(snapshotCampaign.spendCap),
      startTime: normalizeDateTime(snapshotCampaign.startTime),
      stopTime: normalizeDateTime(snapshotCampaign.stopTime),
      specialAdCategories: snapshotCampaign.specialAdCategories || ['NONE'],
      specialAdCategoryCountry: snapshotCampaign.specialAdCategoryCountry,
    }),
    adsets: snapshotAdsets.map((adset) => ({
      adset: prune({
        name: adset.name,
        optimizationGoal: adset.optimizationGoal,
        billingEvent: adset.billingEvent,
        destinationType: adset.destinationType,
        bidStrategy: adset.bidStrategy,
        bidAmount: toNumber(adset.bidAmount),
        dailyBudget: snapshotCampaign.budgetMode === 'ABO' ? toNumber(adset.dailyBudget) : undefined,
        lifetimeBudget: snapshotCampaign.budgetMode === 'ABO' ? toNumber(adset.lifetimeBudget) : undefined,
        startTime: normalizeDateTime(adset.startTime),
        endTime: normalizeDateTime(adset.endTime),
        countries: adset.countries,
        ageMin: toNumber(adset.ageMin),
        ageMax: toNumber(adset.ageMax),
        genders: adset.genders,
        publisherPlatforms: adset.publisherPlatforms,
        facebookPositions: adset.facebookPositions,
        instagramPositions: adset.instagramPositions,
        targetingJson: buildTargetingJson(adset),
        promotedObjectJson: buildPromotedObjectJson(adset),
      }),
      ads: adset.ads.map((ad) => ({
        ad: { name: ad.name },
        creative: prune({
          name: ad.creativeName || `${ad.name} Creative`,
          pageId: ad.pageId || '',
          title: ad.title,
          body: ad.body,
          linkUrl: ad.linkUrl || '',
          description: ad.description,
          imageUrl: ad.assetType === 'image_url' ? ad.imageUrl : undefined,
          imageHash: ad.assetType === 'image_hash' ? ad.imageHash : undefined,
          videoId: ad.assetType === 'video' ? ad.videoId : undefined,
          thumbnailUrl: ad.assetType === 'video' ? ad.thumbnailUrl : undefined,
          callToAction: ad.callToAction,
        }),
      })),
    })),
  });

  const handleEditSave = async (currentValues: Record<string, any>) => {
    if (!editContext?.localId) {
      message.error('缺少编辑对象 ID');
      return;
    }

    if (editContext.scope === 'campaign') {
      const snapshot = { ...campaign, ...currentValues };
      const res = await updateCampaignEntity({
        id: editContext.localId,
        name: snapshot.name,
        objective: snapshot.objective,
        bidStrategy: snapshot.bidStrategy,
        buyingType: 'AUCTION',
        spendCap: snapshot.spendCap ? String(toNumber(snapshot.spendCap) || '') : undefined,
        dailyBudget: snapshot.budgetMode === 'CBO' && snapshot.dailyBudget ? String(toNumber(snapshot.dailyBudget) || '') : undefined,
        lifetimeBudget: snapshot.budgetMode === 'CBO' && snapshot.lifetimeBudget ? String(toNumber(snapshot.lifetimeBudget) || '') : undefined,
        startTime: normalizeDateTime(snapshot.startTime),
      } as any);
      if (!res?.success) throw new Error(res?.errorMessage || '保存 Campaign 失败');
      message.success('Campaign 已保存');
      history.push(returnTo);
      return;
    }

    if (editContext.scope === 'adset') {
      const target = selectedAdset ? { ...selectedAdset, ...currentValues } : currentValues;
      const res = await updateAdsetEntity({
        id: editContext.localId,
        name: target.name,
        destinationType: target.destinationType,
        optimizationGoal: target.optimizationGoal,
        billingEvent: target.billingEvent,
        bidStrategy: target.bidStrategy,
        bidAmount: target.bidAmount,
        dailyBudget: campaign.budgetMode === 'ABO' && target.dailyBudget ? String(toNumber(target.dailyBudget) || '') : undefined,
        lifetimeBudget: campaign.budgetMode === 'ABO' && target.lifetimeBudget ? String(toNumber(target.lifetimeBudget) || '') : undefined,
        targeting: buildTargetingJson(target as AdsetDraft),
        targetingJson: buildTargetingJson(target as AdsetDraft),
        promotedObjectJson: buildPromotedObjectJson(target as AdsetDraft),
        startTime: normalizeDateTime(target.startTime),
        endTime: normalizeDateTime(target.endTime),
      } as any);
      if (!res?.success) throw new Error(res?.errorMessage || '保存 Ad Set 失败');
      message.success('Ad Set 已保存');
      history.push(returnTo);
      return;
    }

    const targetAd = selectedAd ? { ...selectedAd, ...currentValues } : currentValues;
    const adRes = await updateAdEntity({
      id: editContext.localId,
      name: targetAd.name,
    } as any);
    if (!adRes?.success) throw new Error(adRes?.errorMessage || '保存 Ad 失败');

    if (editContext.creativeLocalId) {
      const creativeRes = await updateCreativeEntity({
        id: editContext.creativeLocalId,
        name: targetAd.creativeName,
        title: targetAd.title,
        body: targetAd.body,
        linkUrl: targetAd.linkUrl,
        landingUrl: targetAd.linkUrl,
        imageUrl: targetAd.assetType === 'image_url' ? targetAd.imageUrl : undefined,
        videoUrl: targetAd.assetType === 'video' ? targetAd.videoId : undefined,
        thumbnailUrl: targetAd.thumbnailUrl,
        callToAction: targetAd.callToAction,
        status: 'PAUSED',
      } as any);
      if (!creativeRes?.success) throw new Error(creativeRes?.errorMessage || '保存 Creative 失败');
    }
    message.success('Ad 已保存');
    history.push(returnTo);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    let snapshotCampaign: CampaignDraft = campaign;
    let snapshotAdsets: AdsetDraft[] = adsets;
    try {
      await syncCurrentForm(true);
      const currentValues = form.getFieldsValue();
      if (isEditMode) {
        await handleEditSave(currentValues);
        return;
      }

      snapshotCampaign = selected.type === 'campaign' ? { ...campaign, ...currentValues } : campaign;
      snapshotAdsets =
        selected.type === 'campaign'
          ? adsets
          : adsets.map((adset) => {
              if (selected.type === 'adset' && adset.id === selected.adsetId) {
                return { ...adset, ...currentValues };
              }
              if (selected.type === 'ad' && adset.id === selected.adsetId) {
                return {
                  ...adset,
                  ads: adset.ads.map((ad) => (ad.id === selected.adId ? { ...ad, ...currentValues } : ad)),
                };
              }
              return adset;
            });

      validateAll(snapshotCampaign, snapshotAdsets);
      const res = await createMetaAdFlow(buildPayload(snapshotCampaign, snapshotAdsets));
      if (res?.success && res.data) {
        setResult(res.data);
        modal.success({
          title: 'Meta 广告创建成功',
          content: (
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Campaign">{res.data.campaignId}</Descriptions.Item>
              <Descriptions.Item label="Ad Set 数量">{res.data.adsets?.length || 1}</Descriptions.Item>
              <Descriptions.Item label="状态">PAUSED</Descriptions.Item>
            </Descriptions>
          ),
          okText: '查看 Campaign',
          onOk: () => history.push(`/ads-console/ads/campaign?campaignId=${res.data?.campaignId || ''}&accountId=${snapshotCampaign.accountId || ''}`),
        });
      } else {
        const errorMessage = res?.errorMessage || '创建失败，请检查当前配置后重试';
        focusValidationTarget(findValidationTarget(errorMessage, snapshotAdsets));
        modal.error({
          title: '创建失败',
          content: (
            <div>
              <div>{errorMessage}</div>
              <div style={{ marginTop: 8, color: '#8c8c8c' }}>系统已停止后续创建，请根据提示修正当前环节后重试。</div>
            </div>
          ),
        });
      }
    } catch (error: any) {
      if (error?.message) {
        const errorMessage = String(error.message);
        focusValidationTarget(findValidationTarget(errorMessage, snapshotAdsets));
        modal.error({
          title: '创建失败',
          content: (
            <div>
              <div>{errorMessage}</div>
              <div style={{ marginTop: 8, color: '#8c8c8c' }}>请先修正当前步骤的必填项或参数组合，再重新创建。</div>
            </div>
          ),
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderCampaignForm = () => (
    <>
      <div className="meta-create-form-grid">
        <ConfigSection title="基础信息" description={isEditMode ? '当前正在编辑 Campaign。' : '本次创建会固定使用顶部广告账户。'}>
          {isEditMode ? (
            <div className="meta-create-entity-meta">
              <div>
                <Text type="secondary">Campaign ID</Text>
                <strong>{searchParams.get('campaignId') || '-'}</strong>
              </div>
              <div>
                <Text type="secondary">Campaign 名称</Text>
                <strong>{campaign.name || '-'}</strong>
              </div>
            </div>
          ) : null}
          <ProFormText name="name" label="Campaign 名称" rules={[{ required: true, message: '请输入 Campaign 名称' }]} />
          <ProFormSelect name="objective" label="营销目标" options={campaignObjectives} rules={[{ required: true, message: '请选择营销目标' }]} />
        </ConfigSection>

        <ConfigSection title="预算">
          <Form.Item name="budgetMode" label="预算方式" rules={[{ required: true, message: '请选择预算方式' }]}>
            <Segmented
              block
              options={[
                { label: 'ABO · Ad Set 预算', value: 'ABO' },
                { label: 'CBO · Campaign 预算', value: 'CBO' },
              ]}
            />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.budgetMode !== next.budgetMode}>
            {({ getFieldValue }) =>
              getFieldValue('budgetMode') === 'CBO' ? (
                <>
                  <ProFormDigit
                    name="dailyBudget"
                    label="Campaign 日预算"
                    min={0.01}
                    fieldProps={{ precision: 2 }}
                    formItemProps={{
                      required: true,
                      rules: [{
                        validator: async () => {
                          const dailyBudget = toNumber(form.getFieldValue('dailyBudget'));
                          const lifetimeBudget = toNumber(form.getFieldValue('lifetimeBudget'));
                          if (!dailyBudget && !lifetimeBudget) {
                            throw new Error('请填写 Campaign 日预算或 Campaign 总预算');
                          }
                        },
                      }],
                    }}
                  />
                  <ProFormDigit
                    name="lifetimeBudget"
                    label="Campaign 总预算"
                    min={0.01}
                    fieldProps={{ precision: 2 }}
                    formItemProps={{
                      required: true,
                      rules: [{
                        validator: async () => {
                          const dailyBudget = toNumber(form.getFieldValue('dailyBudget'));
                          const lifetimeBudget = toNumber(form.getFieldValue('lifetimeBudget'));
                          if (!dailyBudget && !lifetimeBudget) {
                            throw new Error('请填写 Campaign 日预算或 Campaign 总预算');
                          }
                        },
                      }],
                    }}
                  />
                  <ProFormSelect name="bidStrategy" label="竞价策略" options={bidStrategies} />
                  <ProFormText
                    name="stopTime"
                    label="Campaign 结束时间"
                    rules={toNumber(campaign.lifetimeBudget) ? [{ required: true, message: 'Campaign 总预算模式下必须填写结束时间' }] : undefined}
                  />
                </>
              ) : (
                <div className={'meta-create-info-box'}>ABO 模式下预算和竞价策略都在每个 Ad Set 中设置，Campaign 不设置预算/竞价。</div>
              )
            }
          </Form.Item>
          <ProFormDigit name="spendCap" label="支出上限" min={0.01} fieldProps={{ precision: 2 }} />
        </ConfigSection>

      </div>
    </>
  );

  const renderAdsetForm = () => (
    <>
      <div className="meta-create-form-grid">
        <ConfigSection title="投放设置" description="先确定优化方向和转化位置，预算与受众放在独立区域。">
          <ProFormText name="name" label="Ad Set 名称" rules={[{ required: true, message: '请输入 Ad Set 名称' }]} />
          <ProFormSelect
            name="optimizationGoal"
            label="优化目标"
            options={optimizationGoals.filter((item) => allowedOptimizationGoals.includes(item.value))}
            rules={[{ required: true, message: '请选择优化目标' }]}
          />
          <ProFormSelect name="billingEvent" label="计费事件" options={billingEvents} rules={[{ required: true, message: '请选择计费事件' }]} />
          <ProFormSelect
            name="destinationType"
            label="转化位置"
            options={destinationTypes.filter((item) => allowedDestinationTypes.includes(item.value))}
            rules={[{ required: true, message: '请选择转化位置' }]}
          />
        </ConfigSection>

        <ConfigSection title="Pixel">
          <ProFormSelect
            name="pixelId"
            label="Pixel"
            options={pixelOptions}
            showSearch
            allowClear
            rules={selectedAdset?.optimizationGoal === 'OFFSITE_CONVERSIONS' && selectedAdset?.destinationType === 'WEBSITE' && !selectedAdset?.promotedObjectJson
              ? [{ required: true, message: '站外转化投放请先选择 Pixel' }]
              : undefined}
            placeholder={campaign.accountId ? '请选择 Pixel' : '请先选择广告账户'}
          />
          <ProFormSelect
            name="customEventType"
            label="转化事件"
            options={pixelEventOptions}
            rules={selectedAdset?.optimizationGoal === 'OFFSITE_CONVERSIONS' && selectedAdset?.destinationType === 'WEBSITE' && !selectedAdset?.promotedObjectJson
              ? [{ required: true, message: '站外转化投放请选择转化事件' }]
              : undefined}
            placeholder="默认 Purchase"
          />
          <ProFormTextArea
            name="promotedObjectJson"
            label="Promoted Object JSON"
            fieldProps={{ rows: 4 }}
            rules={
              selectedAdset?.destinationType === 'APP'
                || selectedAdset?.optimizationGoal === 'LEAD_GENERATION'
                || ['MESSENGER', 'WHATSAPP'].includes(selectedAdset?.destinationType || '')
                ? [{ required: true, message: '当前投放场景必须填写 Promoted Object JSON' }]
                : undefined
            }
            extra="网站转化可只选 Pixel + 转化事件自动生成；APP、Lead、Messenger、WhatsApp 等场景请在这里补充 application_id、object_store_url、page_id 等字段。"
          />
        </ConfigSection>

        <ConfigSection title="预算">
          {campaign.budgetMode === 'ABO' ? (
            <>
              <ProFormDigit
                name="dailyBudget"
                label="Ad Set 日预算"
                min={0.01}
                fieldProps={{ precision: 2 }}
                formItemProps={{
                  required: true,
                  rules: [{
                    validator: async () => {
                      const dailyBudget = toNumber(form.getFieldValue('dailyBudget'));
                      const lifetimeBudget = toNumber(form.getFieldValue('lifetimeBudget'));
                      if (!dailyBudget && !lifetimeBudget) {
                        throw new Error('请填写 Ad Set 日预算或 Ad Set 总预算');
                      }
                    },
                  }],
                }}
              />
              <ProFormDigit
                name="lifetimeBudget"
                label="Ad Set 总预算"
                min={0.01}
                fieldProps={{ precision: 2 }}
                formItemProps={{
                  required: true,
                  rules: [{
                    validator: async () => {
                      const dailyBudget = toNumber(form.getFieldValue('dailyBudget'));
                      const lifetimeBudget = toNumber(form.getFieldValue('lifetimeBudget'));
                      if (!dailyBudget && !lifetimeBudget) {
                        throw new Error('请填写 Ad Set 日预算或 Ad Set 总预算');
                      }
                    },
                  }],
                }}
              />
              <ProFormSelect name="bidStrategy" label="竞价策略" options={bidStrategies} />
              <ProFormText
                name="endTime"
                label="Ad Set 结束时间"
                rules={toNumber(selectedAdset?.lifetimeBudget) ? [{ required: true, message: 'Ad Set 总预算模式下必须填写结束时间' }] : undefined}
              />
            </>
          ) : (
            <div className={'meta-create-info-box'}>当前是 CBO，预算和竞价策略由 Campaign 控制，这里不再填写 Ad Set 预算/竞价策略。</div>
          )}
          {requiresBidAmount(effectiveBidStrategy) ? (
            <ProFormDigit
              name="bidAmount"
              label="出价"
              min={0.01}
              fieldProps={{ precision: 2 }}
              rules={[{ required: true, message: '当前竞价策略必须填写出价' }]}
            />
          ) : (
            <div className={'meta-create-info-box'}>当前竞价策略不要求填写出价；只有 Bid cap / Cost cap 需要在 Ad Set 填 `bid_amount`。</div>
          )}
        </ConfigSection>

        <ConfigSection title="受众">
          <ProFormSelect name="countries" label="国家" mode="multiple" options={countryOptions} rules={[{ required: true, message: '请选择至少一个国家' }]} />
          <ProFormSelect name="locationTypes" label="位置类型" mode="multiple" options={locationTypeOptions} />
          <div className="meta-create-inline-fields">
            <ProFormDigit name="ageMin" label="最小年龄" min={13} max={65} />
            <ProFormDigit name="ageMax" label="最大年龄" min={13} max={65} />
          </div>
          <ProFormSelect
            name="genders"
            label="性别"
            mode="multiple"
            options={[
              { label: '男性', value: 1 },
              { label: '女性', value: 2 },
            ]}
            placeholder="不选表示不限"
          />
          <div className="meta-create-inline-fields">
            <ProFormSwitch name="advantageAudience" label="Advantage Audience" />
            <div />
          </div>
          <div className="meta-create-inline-fields">
            <ProFormDigit
              name="individualSettingAge"
              label="年龄自动化权重"
              min={0}
              max={1}
              fieldProps={{ precision: 2, step: 0.1 }}
            />
            <ProFormDigit
              name="individualSettingGender"
              label="性别自动化权重"
              min={0}
              max={1}
              fieldProps={{ precision: 2, step: 0.1 }}
            />
          </div>
          <ProFormSelect
            name="brandSafetyContentFilterLevels"
            label="内容安全过滤"
            mode="multiple"
            options={brandSafetyOptions}
          />
        </ConfigSection>

        <ConfigSection title="版位">
          <ProFormSelect name="publisherPlatforms" label="平台" mode="multiple" options={platformOptions} />
          <ProFormSelect name="facebookPositions" label="Facebook 版位" mode="multiple" options={facebookPositionOptions} />
          <ProFormSelect name="instagramPositions" label="Instagram 版位" mode="multiple" options={instagramPositionOptions} />
          <ProFormTextArea name="targetingJson" label="高级定向 JSON" fieldProps={{ rows: 4 }} />
        </ConfigSection>
      </div>
    </>
  );

  const renderAdForm = () => (
    <>
      <div className="meta-create-form-stack">
        <ConfigSection title="广告信息">
          <ProFormText name="name" label="Ad 名称" rules={[{ required: true, message: '请输入 Ad 名称' }]} />
          <ProFormText name="creativeName" label="Creative 名称" rules={[{ required: !isEditMode, message: '请输入 Creative 名称' }]} />
          <ProFormSelect
            name="pageId"
            label="Facebook Page"
            options={pageOptions}
            showSearch
            rules={[{ required: !isEditMode, message: '请选择 Facebook Page' }]}
            placeholder={campaign.accountId ? '请选择 Facebook Page' : '请先选择广告账户'}
          />
        </ConfigSection>

        <ConfigSection title="文案">
          <ProFormText name="title" label="标题" rules={[{ required: !isEditMode, message: '请输入广告标题' }]} />
          <ProFormTextArea name="body" label="正文" rules={[{ required: !isEditMode, message: '请输入广告正文' }]} fieldProps={{ rows: 4, maxLength: 500, showCount: true }} />
          <ProFormText name="description" label="描述" />
          <div className="meta-create-inline-fields meta-create-inline-fields-wide">
            <ProFormText
              name="linkUrl"
              label="落地页 URL"
              rules={isWebsiteLinkRequired(selectedAdset?.optimizationGoal, selectedAdset?.destinationType)
                ? [{ required: !isEditMode, message: '请输入落地页 URL' }, { type: 'url', message: '请输入合法 URL' }]
                : [{ type: 'url', message: '请输入合法 URL' }]}
            />
            <ProFormSelect name="callToAction" label="CTA" options={ctaOptions} rules={[{ required: true, message: '请选择 CTA' }]} />
          </div>
        </ConfigSection>

        <ConfigSection title="素材">
          <ProFormRadio.Group
            name="assetType"
            label="素材类型"
            rules={[{ required: true, message: '请选择素材类型' }]}
            options={[
              { label: 'Image URL', value: 'image_url' },
              { label: 'Image Hash', value: 'image_hash' },
              { label: 'Video ID', value: 'video' },
            ]}
          />
          <Form.Item noStyle shouldUpdate={(prev, next) => prev.assetType !== next.assetType}>
            {({ getFieldValue }) => {
              const type = getFieldValue('assetType');
              if (type === 'image_hash') {
                return <ProFormText name="imageHash" label="Image Hash" rules={[{ required: !isEditMode, message: '请输入 Image Hash' }]} />;
              }
              if (type === 'video') {
                return (
                  <div className="meta-create-inline-fields">
                    <ProFormText name="videoId" label="Video ID" rules={[{ required: !isEditMode, message: '请输入 Video ID' }]} />
                    <ProFormText name="thumbnailUrl" label="视频缩略图 URL" />
                  </div>
                );
              }
              return <ProFormText name="imageUrl" label="Image URL" rules={[{ required: !isEditMode, message: '请输入 Image URL' }, { type: 'url', message: '请输入合法 URL' }]} />;
            }}
          </Form.Item>
        </ConfigSection>
      </div>
    </>
  );

  return (
    <div className={'meta-create-page'}>
      <div
        className={'meta-create-shell'}
        style={{ gridTemplateColumns: `${sidebarWidth}px 4px minmax(0, 1fr)` }}
      >
        <aside className={'meta-create-sidebar'}>
          <Tree
            blockNode
            showLine
            selectedKeys={[selected.key]}
            expandedKeys={expandedKeys}
            onExpand={(keys) => setExpandedKeys(keys)}
            onSelect={(keys) => keys[0] && selectNode(String(keys[0]))}
            treeData={treeData}
            titleRender={titleRender}
          />
        </aside>
        <div
          className={'meta-create-resize-handle'}
          onMouseDown={(event) => {
            event.preventDefault();
            setResizeStart({ x: event.clientX, width: sidebarWidth });
          }}
        />

        <main className={'meta-create-editor'}>
          <div className={'meta-create-toolbar'}>
            <AccountContextBar campaign={campaign} />
            <Button type="primary" icon={<SendOutlined />} loading={submitting} onClick={handleSubmit}>
              {isEditMode ? '保存编辑' : '创建全部'}
            </Button>
          </div>

          <div className={'meta-create-workspace'}>
            <Form form={form} layout="vertical" requiredMark className={'meta-create-form'} onValuesChange={handleValuesChange}>
              <div className={'meta-create-panel'}>
                {selected.type === 'campaign' ? renderCampaignForm() : null}
                {selected.type === 'adset' ? renderAdsetForm() : null}
                {selected.type === 'ad' ? renderAdForm() : null}
              </div>
            </Form>
            {selected.type === 'ad' ? (
              <aside className={'meta-create-preview-rail'}>
                <AdPreview ad={selectedAd} />
              </aside>
            ) : null}
          </div>

          {result ? (
            <div className={'meta-create-result'}>
              <Descriptions size="small" column={4}>
                <Descriptions.Item label="Campaign">{result.campaignId}</Descriptions.Item>
                <Descriptions.Item label="Ad Set">{result.adsets?.length || 1}</Descriptions.Item>
                <Descriptions.Item label="首个 Ad">{result.adId}</Descriptions.Item>
                <Descriptions.Item label="状态">PAUSED</Descriptions.Item>
              </Descriptions>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
};

const ConfigSection: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <section className="meta-create-config-section">
    <div className="meta-create-config-head">
      <h3>{title}</h3>
      {description ? <Text type="secondary">{description}</Text> : null}
    </div>
    <div className="meta-create-config-body">{children}</div>
  </section>
);

const AccountContextBar: React.FC<{ campaign: CampaignDraft }> = ({ campaign }) => {
  if (!campaign.accountId) return <div />;
  const accountTitle = campaign.accountName || '-';
  return (
    <div className="meta-create-account-bar">
      <div className="meta-create-account-icon"><GlobalOutlined /></div>
      <div className="meta-create-account-main">
        <span>{accountTitle}</span>
        <Text type="secondary">{campaign.accountId}</Text>
      </div>
    </div>
  );
};

const AdPreview: React.FC<{ ad?: AdDraft }> = ({ ad }) => {
  if (!ad) {
    return (
      <div className={'meta-create-preview'}>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="选择一个 Ad 查看预览" />
      </div>
    );
  }

  const image = ad.assetType === 'video' ? ad.thumbnailUrl : ad.imageUrl;
  const ctaLabel = ctaOptions.find((item) => item.value === ad.callToAction)?.label || 'Learn More';
  const displayUrl = ad.linkUrl ? ad.linkUrl.replace(/^https?:\/\//, '').split('/')[0] : 'example.com';

  return (
    <div className={'meta-create-preview'}>
      <div className="meta-create-preview-label">
        <span>Feed preview</span>
        <Text type="secondary">Facebook mobile</Text>
      </div>
      <div className="meta-create-preview-frame">
        <div className="meta-create-preview-top">
          <div className="meta-create-page-avatar">f</div>
          <div className="meta-create-page-meta">
            <div className="meta-create-page-name">Facebook Page</div>
            <div className="meta-create-sponsored">Sponsored · <GlobalOutlined /></div>
          </div>
          <button className="meta-create-preview-more" type="button">...</button>
        </div>
        <div className="meta-create-preview-body">{ad.body || '广告正文会显示在这里。'}</div>
        <div className="meta-create-preview-media">
          {image ? (
            <img src={image} alt="Ad preview" />
          ) : (
            <div className={'meta-create-media-placeholder'}>
              <FileImageOutlined />
              <span>{ad.assetType === 'image_hash' ? 'Image Hash' : ad.assetType === 'video' ? 'Video Creative' : 'Image URL'}</span>
            </div>
          )}
        </div>
        <div className="meta-create-preview-link">
          <div>
            <Text className="meta-create-domain">{displayUrl}</Text>
            <strong>{ad.title || '广告标题'}</strong>
            <span>{ad.description || '广告描述会显示在这里。'}</span>
          </div>
          <button className="meta-create-fb-cta" type="button">{ctaLabel}</button>
        </div>
        <div className="meta-create-preview-social">
          <span>Like</span>
          <span>Comment</span>
          <span>Share</span>
        </div>
      </div>
    </div>
  );
};

export default MetaCreatePage;




