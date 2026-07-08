import { request } from "@umijs/max";

export type AdsInsightObjectType = "account" | "campaign" | "adset" | "ad" | "creative";

export async function getEventInsights(params: {
  objectId: string;
  objectType: AdsInsightObjectType;
  startDate?: string;
  endDate?: string;
}) {
  return request<AdsConsole.Result<AdsConsole.AdsAccountEventInsight[]>>(
    "/ads-api/fb/report/events",
    {
      method: "GET",
      params,
    }
  );
}

export async function getCountryInsights(params: {
  objectId: string;
  objectType: AdsInsightObjectType;
  startDate?: string;
  endDate?: string;
}) {
  return request<AdsConsole.Result<AdsConsole.AdsAccountCountryInsight[]>>(
    "/ads-api/fb/report/countries",
    {
      method: "GET",
      params,
    }
  );
}

