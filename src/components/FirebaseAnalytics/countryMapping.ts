import type { FilterOption, RegionQualityItem } from '@/services/firebase-analytics/types';

export interface ResolvedRegionQualityItem extends RegionQualityItem {
  countryCode?: string;
  mapName?: string;
  displayName: string;
  rowKey: string;
}

const MAP_NAME_BY_COUNTRY_CODE: Record<string, string> = {
  AF: 'Afghanistan',
  AL: 'Albania',
  DZ: 'Algeria',
  AO: 'Angola',
  AR: 'Argentina',
  AM: 'Armenia',
  AU: 'Australia',
  AT: 'Austria',
  AZ: 'Azerbaijan',
  BH: 'Bahrain',
  BD: 'Bangladesh',
  BY: 'Belarus',
  BE: 'Belgium',
  BZ: 'Belize',
  BJ: 'Benin',
  BT: 'Bhutan',
  BO: 'Bolivia',
  BA: 'Bosnia and Herz.',
  BW: 'Botswana',
  BR: 'Brazil',
  BN: 'Brunei',
  BG: 'Bulgaria',
  BF: 'Burkina Faso',
  BI: 'Burundi',
  KH: 'Cambodia',
  CM: 'Cameroon',
  CA: 'Canada',
  CF: 'Central African Rep.',
  TD: 'Chad',
  CL: 'Chile',
  CN: 'China',
  CO: 'Colombia',
  KM: 'Comoros',
  CG: 'Congo',
  CD: 'Dem. Rep. Congo',
  CR: 'Costa Rica',
  CI: "Côte d'Ivoire",
  HR: 'Croatia',
  CU: 'Cuba',
  CY: 'Cyprus',
  CZ: 'Czech Rep.',
  DK: 'Denmark',
  DJ: 'Djibouti',
  DO: 'Dominican Rep.',
  EC: 'Ecuador',
  EG: 'Egypt',
  SV: 'El Salvador',
  GQ: 'Eq. Guinea',
  ER: 'Eritrea',
  EE: 'Estonia',
  ET: 'Ethiopia',
  FJ: 'Fiji',
  FI: 'Finland',
  FR: 'France',
  GA: 'Gabon',
  GM: 'Gambia',
  GE: 'Georgia',
  DE: 'Germany',
  GH: 'Ghana',
  GR: 'Greece',
  GL: 'Greenland',
  GT: 'Guatemala',
  GN: 'Guinea',
  GW: 'Guinea-Bissau',
  GY: 'Guyana',
  HT: 'Haiti',
  HN: 'Honduras',
  HK: 'Hong Kong',
  HU: 'Hungary',
  IS: 'Iceland',
  IN: 'India',
  ID: 'Indonesia',
  IR: 'Iran',
  IQ: 'Iraq',
  IE: 'Ireland',
  IL: 'Israel',
  IT: 'Italy',
  JM: 'Jamaica',
  JP: 'Japan',
  JO: 'Jordan',
  KZ: 'Kazakhstan',
  KE: 'Kenya',
  KP: 'Dem. Rep. Korea',
  KR: 'Korea',
  XK: 'Kosovo',
  KW: 'Kuwait',
  KG: 'Kyrgyzstan',
  LA: 'Lao PDR',
  LV: 'Latvia',
  LB: 'Lebanon',
  LS: 'Lesotho',
  LR: 'Liberia',
  LY: 'Libya',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  MO: 'Macao',
  MK: 'Macedonia',
  MG: 'Madagascar',
  MW: 'Malawi',
  MY: 'Malaysia',
  ML: 'Mali',
  MR: 'Mauritania',
  MX: 'Mexico',
  MD: 'Moldova',
  MN: 'Mongolia',
  ME: 'Montenegro',
  MA: 'Morocco',
  MZ: 'Mozambique',
  MM: 'Myanmar',
  NA: 'Namibia',
  NP: 'Nepal',
  NL: 'Netherlands',
  NZ: 'New Zealand',
  NI: 'Nicaragua',
  NE: 'Niger',
  NG: 'Nigeria',
  NO: 'Norway',
  OM: 'Oman',
  PK: 'Pakistan',
  PA: 'Panama',
  PG: 'Papua New Guinea',
  PY: 'Paraguay',
  PE: 'Peru',
  PH: 'Philippines',
  PL: 'Poland',
  PT: 'Portugal',
  PR: 'Puerto Rico',
  QA: 'Qatar',
  RO: 'Romania',
  RU: 'Russia',
  RW: 'Rwanda',
  SA: 'Saudi Arabia',
  SN: 'Senegal',
  RS: 'Serbia',
  SL: 'Sierra Leone',
  SG: 'Singapore',
  SK: 'Slovakia',
  SI: 'Slovenia',
  SB: 'Solomon Is.',
  SO: 'Somalia',
  ZA: 'South Africa',
  ES: 'Spain',
  LK: 'Sri Lanka',
  SD: 'Sudan',
  SR: 'Suriname',
  SZ: 'eSwatini',
  SE: 'Sweden',
  CH: 'Switzerland',
  SY: 'Syria',
  TW: 'Taiwan',
  TJ: 'Tajikistan',
  TZ: 'Tanzania',
  TH: 'Thailand',
  TL: 'Timor-Leste',
  TG: 'Togo',
  TT: 'Trinidad and Tobago',
  TN: 'Tunisia',
  TR: 'Turkey',
  TM: 'Turkmenistan',
  UG: 'Uganda',
  UA: 'Ukraine',
  AE: 'United Arab Emirates',
  GB: 'United Kingdom',
  UK: 'United Kingdom',
  US: 'United States',
  UY: 'Uruguay',
  UZ: 'Uzbekistan',
  VE: 'Venezuela',
  VN: 'Vietnam',
  YE: 'Yemen',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
};

const DISPLAY_NAME_OVERRIDES: Record<string, string> = {
  HK: 'Hong Kong',
  MO: 'Macao',
  MM: 'Myanmar',
  RU: 'Russia',
  DE: 'Germany',
  US: 'United States',
  GB: 'United Kingdom',
  KR: 'South Korea',
  KP: 'North Korea',
};

let displayNames: Intl.DisplayNames | null = null;

function getDisplayNames() {
  if (displayNames || typeof Intl === 'undefined' || typeof Intl.DisplayNames === 'undefined') {
    return displayNames;
  }

  displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
  return displayNames;
}

export function normalizeCountryCode(value?: string | null) {
  if (!value) return undefined;
  const normalized = `${value}`.trim().toUpperCase();
  if (!normalized || normalized === '-99' || normalized === 'UNKNOWN') return undefined;
  return normalized;
}

function buildCountryLabelMap(countryOptions?: FilterOption[]) {
  return (countryOptions ?? []).reduce<Map<string, string>>((acc, option) => {
    const code = normalizeCountryCode(option.value);
    if (!code || !option.label) return acc;

    const label = option.label.trim();
    if (!label || label.toUpperCase() === code || label === `${code} (${code})`) {
      return acc;
    }

    acc.set(code, label);
    return acc;
  }, new Map<string, string>());
}

function getFallbackCountryName(countryCode?: string) {
  if (!countryCode) return undefined;
  if (DISPLAY_NAME_OVERRIDES[countryCode]) return DISPLAY_NAME_OVERRIDES[countryCode];

  const names = getDisplayNames();
  return names?.of(countryCode) || undefined;
}

function getDisplayName(
  item: Pick<RegionQualityItem, 'user_country' | 'user_region'>,
  countryLabelMap: Map<string, string>,
  countryCode?: string,
) {
  if (countryCode && countryLabelMap.has(countryCode)) {
    return countryLabelMap.get(countryCode)!;
  }

  if (countryCode) {
    return getFallbackCountryName(countryCode) || MAP_NAME_BY_COUNTRY_CODE[countryCode] || countryCode;
  }

  return item.user_region || item.user_country || 'Unknown';
}

function buildRowKey(countryCode?: string, displayName?: string) {
  return [countryCode || 'unknown', displayName || 'unknown'].join(':');
}

export function aggregateRegionQualityItems(
  items: RegionQualityItem[],
  countryOptions?: FilterOption[],
): ResolvedRegionQualityItem[] {
  const countryLabelMap = buildCountryLabelMap(countryOptions);
  const aggregated = new Map<
    string,
    ResolvedRegionQualityItem & {
      totalEventCount: number;
      totalSessionCount: number;
      connectMsWeight: number;
      successRateWeight: number;
    }
  >();

  for (const item of items) {
    const countryCode = normalizeCountryCode(item.user_country);
    const displayName = getDisplayName(item, countryLabelMap, countryCode);
    const mapName = countryCode ? MAP_NAME_BY_COUNTRY_CODE[countryCode] : undefined;
    const key = countryCode || buildRowKey(undefined, displayName);

    const eventCount = Number(item.event_count || 0);
    const sessionCount = Number(item.vpn_session_count || 0);
    const connectMs = Number(item.avg_connect_ms || 0);
    const successRate = Number(item.vpn_success_rate || 0);

    const existing = aggregated.get(key);
    if (!existing) {
      aggregated.set(key, {
        ...item,
        countryCode,
        mapName,
        displayName,
        rowKey: buildRowKey(countryCode, displayName),
        totalEventCount: eventCount,
        totalSessionCount: sessionCount,
        connectMsWeight: connectMs * eventCount,
        successRateWeight: successRate * (sessionCount || eventCount),
      });
      continue;
    }

    const nextEventCount = existing.totalEventCount + eventCount;
    const nextSessionCount = existing.totalSessionCount + sessionCount;
    const successRateBase = nextSessionCount || nextEventCount;

    existing.event_count += eventCount;
    existing.active_devices += Number(item.active_devices || 0);
    existing.vpn_session_count += sessionCount;
    existing.api_error_count += Number(item.api_error_count || 0);
    existing.totalEventCount = nextEventCount;
    existing.totalSessionCount = nextSessionCount;
    existing.connectMsWeight += connectMs * eventCount;
    existing.successRateWeight += successRate * (sessionCount || eventCount);
    existing.avg_connect_ms = nextEventCount ? existing.connectMsWeight / nextEventCount : 0;
    existing.vpn_success_rate = successRateBase ? existing.successRateWeight / successRateBase : 0;
  }

  return Array.from(aggregated.values())
    .map(
      ({
        totalEventCount: _totalEventCount,
        totalSessionCount: _totalSessionCount,
        connectMsWeight: _connectMsWeight,
        successRateWeight: _successRateWeight,
        ...item
      }) => item,
    )
    .sort((a, b) => b.event_count - a.event_count);
}

export function getCountryDisplayNameFromCode(code: string | undefined, countryOptions?: FilterOption[]) {
  const countryCode = normalizeCountryCode(code);
  if (!countryCode) return code || 'Unknown';

  const labelMap = buildCountryLabelMap(countryOptions);
  return (
    labelMap.get(countryCode) ||
    getFallbackCountryName(countryCode) ||
    MAP_NAME_BY_COUNTRY_CODE[countryCode] ||
    countryCode
  );
}
