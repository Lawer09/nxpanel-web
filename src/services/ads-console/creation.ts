import { request } from '@umijs/max';

export type CampaignCreatePayload = {
  accountId: string;
  name: string;
  objective: string;
  buyingType?: string;
  bidStrategy?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  spendCap?: number;
  startTime?: string;
  stopTime?: string;
  specialAdCategories: string[];
  specialAdCategoryCountry?: string[];
};

export type AdsetCreatePayload = {
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
  startTime?: string;
  endTime?: string;
  countries?: string[];
  ageMin?: number;
  ageMax?: number;
  genders?: number[];
  publisherPlatforms?: string[];
  facebookPositions?: string[];
  instagramPositions?: string[];
  targetingJson?: string;
  promotedObjectJson?: string;
};

export type CreativeCreatePayload = {
  name: string;
  pageId: string;
  instagramUserId?: string;
  title: string;
  body: string;
  linkUrl: string;
  description?: string;
  imageUrl?: string;
  imageHash?: string;
  videoId?: string;
  thumbnailUrl?: string;
  callToAction?: string;
};

export type AdCreatePayload = {
  name: string;
};

export type CreationFlowPayload = {
  campaign: CampaignCreatePayload;
  adsets?: {
    adset: AdsetCreatePayload;
    ads: {
      ad: AdCreatePayload;
      creative: CreativeCreatePayload;
    }[];
  }[];
  adset?: AdsetCreatePayload;
  creative?: CreativeCreatePayload;
  ad?: AdCreatePayload;
};

export type CreationFlowResult = {
  campaignLocalId: string;
  adsetLocalId: string;
  creativeLocalId: string;
  adLocalId: string;
  campaignId: string;
  adsetId: string;
  creativeId: string;
  adId: string;
  adsets?: {
    adsetLocalId: string;
    adsetId: string;
    ads: {
      creativeLocalId: string;
      adLocalId: string;
      creativeId: string;
      adId: string;
    }[];
  }[];
};

export async function createMetaAdFlow(body: CreationFlowPayload) {
  return request<AdsConsole.Result<CreationFlowResult>>('/ads-api/fb/creation/flow', {
    method: 'POST',
    data: body,
  });
}

