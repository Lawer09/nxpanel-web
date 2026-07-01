import type { ProjectBatchSaveItem } from '@/services/project/types';

export type ParsedProjectBlock = {
  rawLines: string[];
  projectCode: string;
  fields: Partial<ProjectBatchSaveItem>;
  warnings: string[];
  errors: PasteParseIssue[];
};

export type PasteParseResult = {
  records: ParsedProjectBlock[];
};

export type PasteParseIssue =
  | {
      type: 'conflict';
      field: keyof ProjectBatchSaveItem;
      existingValue: string;
      incomingValue: string;
    }
  | {
      type: 'unknown';
      message: string;
    };

const EMAIL_REGEX = /([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i;
const PACKAGE_REGEX = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+){2,}$/;
const PROJECT_CODE_REGEX = /^(?:Demumu|[A-Z]\d+[A-Z]?)$/;
const URL_REGEX = /https?:\/\/[^\s)]+/gi;
const ADMOB_APP_ID_REGEX = /^ca-app-pub-\d+~\d+$/i;
const ADMOB_AD_LINE_REGEX = /^[^：:\n]+[：:]\s*ca-app-pub-\d+\/\d+$/i;
const YANDEX_AD_LINE_REGEX = /^(?:Yandex\s*)?[^：:\n]*[：:]\s*R-M-\d+-\d+$/i;
const FB_APP_ID_REGEX = /^\d{8,}$/;
const ADS_TXT_REGEX = /pub-\d+,\s*DIRECT/i;
const JSON_START_REGEX = /^\s*\{/;
const PROJECT_STAGE_REGEX = /(在线|开发中|UI完毕|下架)/;
const MULTI_SPACE_SPLIT_REGEX = /\s{2,}/;

const toPlainText = (value: string) =>
  value
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const extractUrls = (value: string) => Array.from(value.matchAll(URL_REGEX)).map((match) => match[0]);

const extractEmail = (value: string) => {
  const plain = toPlainText(value);
  return plain.match(EMAIL_REGEX)?.[1] ?? value.match(EMAIL_REGEX)?.[1] ?? null;
};

const appendLine = (target: string | null | undefined, value: string) => {
  if (!value) return target ?? null;
  if (!target) return value;
  return target.split('\n').includes(value) ? target : `${target}\n${value}`;
};

const splitByMultiSpace = (value: string) =>
  value
    .split(MULTI_SPACE_SPLIT_REGEX)
    .map((item) => item.trim())
    .filter(Boolean);

const appendCellText = (target: string, value: string) => (target ? `${target}\n${value}` : value);

const isStorePageUrl = (url: string) => url.toLowerCase().includes('play.google.com/store/apps/details');

const isPrivacyPolicyUrl = (url: string) => {
  const normalized = url.toLowerCase();
  return normalized.includes('privacy_policy.html') || normalized.includes('/privacy.html') || normalized.includes('privacy');
};

const isTermsUrl = (url: string) => {
  const normalized = url.toLowerCase();
  return normalized.includes('terms_of_use.html') || normalized.includes('/terms.html') || normalized.includes('terms');
};

const looksLikeProjectCode = (line: string, nextLine?: string) => {
  const plain = toPlainText(line);
  if (!PROJECT_CODE_REGEX.test(plain)) return false;
  if (PACKAGE_REGEX.test(plain) || ADMOB_APP_ID_REGEX.test(plain)) return false;
  if (plain.startsWith('@') || plain.includes('http') || plain.includes('：') || plain.includes(':')) return false;
  if (extractEmail(plain) || /[\u4e00-\u9fa5]/.test(plain)) return false;
  if (!nextLine) return false;

  const nextPlain = toPlainText(nextLine);
  if (!nextPlain) return false;
  if (nextPlain.startsWith('@')) return true;
  if (PROJECT_STAGE_REGEX.test(nextPlain)) return true;
  if (PACKAGE_REGEX.test(nextPlain) || extractEmail(nextPlain) || extractUrls(nextLine).length > 0) return false;
  if (ADMOB_APP_ID_REGEX.test(nextPlain) || ADMOB_AD_LINE_REGEX.test(nextPlain) || YANDEX_AD_LINE_REGEX.test(nextPlain)) {
    return false;
  }
  return true;
};

const isOwnerLine = (plain: string) => plain.startsWith('@') && plain.length > 1;
const isStageLine = (plain: string) => PROJECT_STAGE_REGEX.test(plain);
const isAdspowerEnvLine = (plain: string) => /^\d{1,3}-/.test(plain) || plain === '未分配';
const isDomainStatusLine = (plain: string) => /域名/.test(plain) && /[✅❌]/.test(plain);
const isFacebookStatusLine = (plain: string) => /FB信息/.test(plain);
const isAdmobStatusLine = (plain: string) => /Admob/.test(plain) && /[✅❌]/.test(plain);
const isYandexAccountLine = (plain: string) => plain === '未分配账号';
const isYandexAdTextLine = (plain: string) => /^Yandex/i.test(plain);
const isHashLikeLine = (plain: string) =>
  /^[A-Za-z0-9+/=._-]{16,}$/.test(plain) && !PACKAGE_REGEX.test(plain) && !ADMOB_APP_ID_REGEX.test(plain);
const isProjectNameLine = (plain: string) =>
  /[A-Za-z]/.test(plain) &&
  !PACKAGE_REGEX.test(plain) &&
  !PROJECT_CODE_REGEX.test(plain) &&
  !ADMOB_APP_ID_REGEX.test(plain) &&
  !ADMOB_AD_LINE_REGEX.test(plain) &&
  !YANDEX_AD_LINE_REGEX.test(plain);

type JsonConsumeResult = {
  value: string;
  nextIndex: number;
  closed: boolean;
};

const consumeJsonBlock = (lines: string[], startIndex: number): JsonConsumeResult => {
  const collected: string[] = [];
  let balance = 0;
  let inString = false;
  let escaping = false;
  let started = false;

  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index];
    collected.push(line);

    for (const char of line) {
      if (escaping) {
        escaping = false;
        continue;
      }
      if (char === '\\') {
        escaping = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) {
        continue;
      }
      if (char === '{') {
        balance += 1;
        started = true;
      } else if (char === '}') {
        balance -= 1;
      }
    }

    if (started && balance === 0) {
      return {
        value: collected.join('\n').trim(),
        nextIndex: index,
        closed: true,
      };
    }
  }

  return {
    value: collected.join('\n').trim(),
    nextIndex: lines.length - 1,
    closed: false,
  };
};

const setFieldValue = (
  fields: Partial<ProjectBatchSaveItem>,
  errors: PasteParseIssue[],
  field: keyof ProjectBatchSaveItem,
  value: string | null | undefined,
) => {
  if (!value) return;
  const existing = fields[field];
  if (!existing) {
    fields[field] = value;
    return;
  }
  if (existing !== value) {
    errors.push({
      type: 'conflict',
      field,
      existingValue: existing,
      incomingValue: value,
    });
  }
};

const appendFieldValue = (
  fields: Partial<ProjectBatchSaveItem>,
  field: keyof ProjectBatchSaveItem,
  value: string | null | undefined,
) => {
  if (!value) return;
  fields[field] = appendLine(fields[field] ?? null, value) ?? undefined;
};

const chooseUrl = (line: string, matcher?: string | ((url: string) => boolean)) => {
  const urls = extractUrls(line);
  if (!urls.length) return null;
  if (!matcher) return urls[0];
  if (typeof matcher === 'string') {
    return urls.find((url) => url.toLowerCase().includes(matcher.toLowerCase())) ?? null;
  }
  return urls.find((url) => matcher(url)) ?? null;
};

const isLikelyFacebookClassName = (plain: string) =>
  /^[A-Za-z_][A-Za-z0-9_.]+$/.test(plain) && plain.includes('.') && /[A-Z]/.test(plain);

const setFieldFromCell = (
  fields: Partial<ProjectBatchSaveItem>,
  errors: PasteParseIssue[],
  field: keyof ProjectBatchSaveItem,
  value?: string | null,
  transform?: (cell: string) => string | null,
) => {
  const plain = typeof value === 'string' ? value.trim() : '';
  if (!plain) return;
  const nextValue = transform ? transform(plain) : toPlainText(plain);
  if (!nextValue) return;
  setFieldValue(fields, errors, field, nextValue);
};

const parseProjectTsvRows = (input: string): string[][] => {
  const lines = input.split(/\r?\n/).map((line) => line.replace(/\r/g, ''));
  const rows: string[][] = [];
  let currentRow: string[] | null = null;

  lines.forEach((line) => {
    if (!line.trim()) return;
    const cells = line.split('\t');
    const firstCell = toPlainText(cells[0] ?? '');
    const isRowStart = cells.length > 1 && PROJECT_CODE_REGEX.test(firstCell);

    if (isRowStart) {
      currentRow = [...cells];
      rows.push(currentRow);
      return;
    }

    if (!currentRow) {
      return;
    }

    currentRow[currentRow.length - 1] = appendCellText(currentRow[currentRow.length - 1] ?? '', cells[0] ?? '');
    cells.slice(1).forEach((cell) => {
      currentRow?.push(cell);
    });
  });

  return rows.filter((row) => row.some((cell) => cell.trim() !== ''));
};

const parseProjectTsvRow = (cells: string[]): ParsedProjectBlock => {
  const normalizedCells = cells.map((cell) => cell.trim());
  const projectCode = toPlainText(normalizedCells[0] ?? '');
  const fields: Partial<ProjectBatchSaveItem> = { projectCode };
  const warnings: string[] = [];
  const errors: PasteParseIssue[] = [];
  const remarkLines: string[] = [];
  const facebookExtras: string[] = [];

  setFieldFromCell(fields, errors, 'ownerName', normalizedCells[2], (value) => value.replace(/^@+/, '').trim() || null);
  setFieldFromCell(fields, errors, 'adspowerEnv', normalizedCells[3]);
  setFieldFromCell(fields, errors, 'developerGmail', normalizedCells[4], (value) => extractEmail(value) ?? toPlainText(value));
  setFieldFromCell(fields, errors, 'projectName', normalizedCells[5]);
  setFieldFromCell(fields, errors, 'packageName', normalizedCells[6]);
  setFieldFromCell(fields, errors, 'domainInfoStatus', normalizedCells[7]);
  setFieldFromCell(fields, errors, 'domainUrl', normalizedCells[8], (value) => chooseUrl(value) ?? toPlainText(value));
  setFieldFromCell(fields, errors, 'privacyPolicyUrl', normalizedCells[9], (value) => chooseUrl(value) ?? toPlainText(value));
  setFieldFromCell(fields, errors, 'termsUrl', normalizedCells[10], (value) => chooseUrl(value) ?? toPlainText(value));
  setFieldFromCell(fields, errors, 'facebookInfoStatus', normalizedCells[11]);
  setFieldFromCell(fields, errors, 'facebookAppId', normalizedCells[12]);

  const stage = toPlainText(normalizedCells[1] ?? '');
  if (stage) {
    remarkLines.push(stage);
    warnings.push(`阶段信息：${stage}`);
  }

  let cursor = 13;
  while (cursor < normalizedCells.length) {
    const plain = toPlainText(normalizedCells[cursor] ?? '');
    if (!plain) {
      cursor += 1;
      break;
    }
    if (isAdmobStatusLine(plain)) {
      break;
    }
    if (isLikelyFacebookClassName(plain)) {
      setFieldValue(fields, errors, 'facebookClassName', plain);
    } else {
      facebookExtras.push(plain);
    }
    cursor += 1;
  }

  finalizeFacebookFields(fields, facebookExtras, errors);

  setFieldFromCell(fields, errors, 'admobAccountStatus', normalizedCells[cursor]);
  setFieldFromCell(fields, errors, 'admobAppId', normalizedCells[cursor + 1]);
  setFieldFromCell(fields, errors, 'admobAdIds', normalizedCells[cursor + 2], (value) => value.trim() || null);
  setFieldFromCell(fields, errors, 'admobAppAdsTxt', normalizedCells[cursor + 3], (value) => value.trim() || null);
  setFieldFromCell(fields, errors, 'firebaseConfigNote', normalizedCells[cursor + 4], (value) => value.trim() || null);
  setFieldFromCell(fields, errors, 'yandexAccount', normalizedCells[cursor + 5]);
  setFieldFromCell(fields, errors, 'yandexAdIds', normalizedCells[cursor + 6], (value) => value.trim() || null);
  setFieldFromCell(fields, errors, 'storePageUrl', normalizedCells[cursor + 7], (value) => chooseUrl(value) ?? toPlainText(value));

  const extraCells = normalizedCells.slice(cursor + 8).map((item) => toPlainText(item)).filter(Boolean);
  if (extraCells.length > 0) {
    remarkLines.push(...extraCells);
    warnings.push(`存在 ${extraCells.length} 个未映射列，已并入备注`);
  }

  if (remarkLines.length > 0) {
    setFieldValue(fields, errors, 'remark', remarkLines.join('\n'));
  }

  if (!fields.projectName && projectCode) {
    fields.projectName = projectCode;
    warnings.push('缺少项目名称，已默认使用项目代号');
  }

  if (!projectCode) {
    errors.push({ type: 'unknown', message: '缺少项目代号' });
  }

  if (!fields.ownerName) {
    warnings.push('缺少负责人');
  }

  if (!fields.packageName) {
    warnings.push('缺少包名');
  }

  return {
    rawLines: cells,
    projectCode,
    fields,
    warnings,
    errors,
  };
};

const finalizeFacebookFields = (
  fields: Partial<ProjectBatchSaveItem>,
  extras: string[],
  errors: PasteParseIssue[],
) => {
  if (!extras.length) return;
  if (extras.length === 1) {
    if (/[=+/]/.test(extras[0])) {
      setFieldValue(fields, errors, 'facebookKeyHash', extras[0]);
    } else {
      setFieldValue(fields, errors, 'facebookAppToken', extras[0]);
    }
    return;
  }

  setFieldValue(fields, errors, 'facebookAppToken', extras[0]);
  setFieldValue(fields, errors, 'facebookKeyHash', extras[1]);
  if (extras.length > 2) {
    errors.push({ type: 'unknown', message: '存在未识别内容：Facebook 区域文本过多' });
  }
};

const parseProjectBlock = (rawLines: string[]): ParsedProjectBlock => {
  const normalizedLines = rawLines.map((line) => line.trim()).filter(Boolean);
  const projectCode = toPlainText(normalizedLines[0] ?? '');
  const fields: Partial<ProjectBatchSaveItem> = { projectCode };
  const warnings: string[] = [];
  const errors: PasteParseIssue[] = [];
  const remarkLines: string[] = [];
  const facebookExtras: string[] = [];

  let seenFacebookStatus = false;
  let seenAdmobStatus = false;

  for (let index = 1; index < normalizedLines.length; index += 1) {
    const rawLine = normalizedLines[index];
    const plainLine = toPlainText(rawLine);
    if (!plainLine) continue;

    const segments = splitByMultiSpace(rawLine);
    if (segments.length > 1 && !extractUrls(rawLine).length && !JSON_START_REGEX.test(rawLine)) {
      normalizedLines.splice(index, 1, ...segments);
      index -= 1;
      continue;
    }

    if (index === 1 && isStageLine(plainLine)) {
      remarkLines.push(plainLine);
      warnings.push(`阶段信息：${plainLine}`);
      continue;
    }

    if (JSON_START_REGEX.test(rawLine)) {
      const consumed = consumeJsonBlock(normalizedLines, index);
      setFieldValue(fields, errors, 'firebaseConfigNote', consumed.value);
      if (!consumed.closed) {
        errors.push({ type: 'unknown', message: '存在未识别内容：Firebase 配置 JSON 未闭合' });
      }
      index = consumed.nextIndex;
      continue;
    }

    if (isOwnerLine(plainLine) && !fields.ownerName) {
      setFieldValue(fields, errors, 'ownerName', plainLine.replace(/^@+/, '').trim());
      continue;
    }

    if (isAdspowerEnvLine(plainLine) && !fields.adspowerEnv && !fields.domainInfoStatus) {
      setFieldValue(fields, errors, 'adspowerEnv', plainLine);
      continue;
    }

    const email = extractEmail(rawLine);
    if (email) {
      if (/yandex/i.test(email) || (seenAdmobStatus && !fields.yandexAccount)) {
        setFieldValue(fields, errors, 'yandexAccount', email);
      } else if (!fields.developerGmail) {
        setFieldValue(fields, errors, 'developerGmail', email);
      } else {
        errors.push({ type: 'unknown', message: `存在未识别内容：${plainLine}` });
      }
      continue;
    }

    if (isDomainStatusLine(plainLine)) {
      setFieldValue(fields, errors, 'domainInfoStatus', plainLine);
      continue;
    }

    if (isFacebookStatusLine(plainLine)) {
      seenFacebookStatus = true;
      setFieldValue(fields, errors, 'facebookInfoStatus', plainLine);
      continue;
    }

    if (isAdmobStatusLine(plainLine)) {
      seenAdmobStatus = true;
      setFieldValue(fields, errors, 'admobAccountStatus', plainLine);
      continue;
    }

    if (FB_APP_ID_REGEX.test(plainLine) && seenFacebookStatus && !fields.facebookAppId && !seenAdmobStatus) {
      setFieldValue(fields, errors, 'facebookAppId', plainLine);
      continue;
    }

    if (ADMOB_APP_ID_REGEX.test(plainLine)) {
      setFieldValue(fields, errors, 'admobAppId', plainLine);
      continue;
    }

    if (ADMOB_AD_LINE_REGEX.test(plainLine)) {
      appendFieldValue(fields, 'admobAdIds', plainLine);
      continue;
    }

    if (ADS_TXT_REGEX.test(plainLine)) {
      setFieldValue(fields, errors, 'admobAppAdsTxt', plainLine);
      continue;
    }

    if (YANDEX_AD_LINE_REGEX.test(plainLine) || isYandexAdTextLine(plainLine)) {
      appendFieldValue(fields, 'yandexAdIds', plainLine);
      continue;
    }

    if (isYandexAccountLine(plainLine)) {
      setFieldValue(fields, errors, 'yandexAccount', plainLine);
      continue;
    }

    const playStoreUrl = chooseUrl(rawLine, isStorePageUrl);
    if (playStoreUrl) {
      setFieldValue(fields, errors, 'storePageUrl', playStoreUrl);
      continue;
    }

    const privacyUrl = chooseUrl(rawLine, isPrivacyPolicyUrl);
    if (privacyUrl) {
      setFieldValue(fields, errors, 'privacyPolicyUrl', privacyUrl);
      continue;
    }

    const termsUrl = chooseUrl(rawLine, isTermsUrl);
    if (termsUrl) {
      setFieldValue(fields, errors, 'termsUrl', termsUrl);
      continue;
    }

    if (extractUrls(rawLine).length > 0) {
      if (!fields.domainUrl) {
        setFieldValue(fields, errors, 'domainUrl', chooseUrl(rawLine) ?? plainLine);
      } else {
        errors.push({ type: 'unknown', message: `存在未识别内容：${plainLine}` });
      }
      continue;
    }

    if (PACKAGE_REGEX.test(plainLine) && !fields.packageName) {
      setFieldValue(fields, errors, 'packageName', plainLine);
      continue;
    }

    if (!fields.projectName && isProjectNameLine(plainLine) && !fields.packageName) {
      setFieldValue(fields, errors, 'projectName', plainLine);
      continue;
    }

    if (seenFacebookStatus && !seenAdmobStatus && isHashLikeLine(plainLine)) {
      facebookExtras.push(plainLine);
      continue;
    }

    if (plainLine === '未分配') {
      remarkLines.push(plainLine);
      continue;
    }

    if (isStageLine(plainLine)) {
      remarkLines.push(plainLine);
      continue;
    }

    errors.push({ type: 'unknown', message: `存在未识别内容：${plainLine}` });
  }

  finalizeFacebookFields(fields, facebookExtras, errors);

  if (remarkLines.length > 0) {
    setFieldValue(fields, errors, 'remark', remarkLines.join('\n'));
  }

  if (!fields.projectName && projectCode) {
    fields.projectName = projectCode;
    warnings.push('缺少项目名称，已默认使用项目代号');
  }

  if (!projectCode) {
    errors.push({ type: 'unknown', message: '缺少项目代号' });
  }

  if (!fields.ownerName) {
    warnings.push('缺少负责人');
  }

  if (!fields.packageName) {
    warnings.push('缺少包名');
  }

  return {
    rawLines: normalizedLines,
    projectCode,
    fields,
    warnings,
    errors,
  };
};

export const parseProjectPasteText = (input: string): PasteParseResult => {
  if (input.includes('\t')) {
    const tsvRows = parseProjectTsvRows(input);
    if (tsvRows.length > 0) {
      return {
        records: tsvRows.map((row) => parseProjectTsvRow(row)),
      };
    }
  }

  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const startIndexes: number[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (looksLikeProjectCode(lines[index], lines[index + 1])) {
      startIndexes.push(index);
    }
  }

  if (!startIndexes.length) {
    return { records: [] };
  }

  const records = startIndexes.map((startIndex, idx) => {
    const endIndex = startIndexes[idx + 1] ?? lines.length;
    return parseProjectBlock(lines.slice(startIndex, endIndex));
  });

  return { records };
};
