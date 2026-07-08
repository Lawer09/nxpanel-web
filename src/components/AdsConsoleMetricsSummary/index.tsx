import MoneyText from "@/components/AdsConsoleMoneyText";
import { Table } from "antd";
import React from "react";

type SummaryColumn = {
  dataIndex?: unknown;
  hideInTable?: boolean;
  align?: string;
  fixed?: boolean | "left" | "right";
};

type MetricRow = {
  currency?: string;
  spend?: number;
  impressions?: number;
  clicks?: number;
  reach?: number;
  roas?: number;
  targetEventCost?: number;
  targetEventCount?: number;
  targetCountrySpend?: number;
};

type SummaryRenderer<T> = (rows: T[]) => React.ReactNode;

type RenderSummaryOptions<T extends MetricRow> = {
  columns: SummaryColumn[];
  rows: T[];
  summaryLabel?: string;
  hasSelectionColumn?: boolean;
  renderers?: Partial<Record<string, SummaryRenderer<T>>>;
};

type CurrencyState = {
  mixed: boolean;
  code?: string;
};

function getColumnKey(dataIndex?: unknown): string | undefined {
  if (Array.isArray(dataIndex)) {
    const first = dataIndex[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof dataIndex === "string" ? dataIndex : undefined;
}

function toNumber(value: unknown): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumBy<T>(rows: T[], selector: (row: T) => unknown): number {
  return rows.reduce((total, row) => total + toNumber(selector(row)), 0);
}

function formatDecimal(value: number, decimal = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  });
}

function getCurrencyState<T extends MetricRow>(rows: T[]): CurrencyState {
  const currencies = Array.from(
    new Set(
      rows
        .map((row) => String(row.currency ?? "").trim().toUpperCase())
        .filter(Boolean),
    ),
  );
  if (currencies.length > 1) {
    return { mixed: true };
  }
  return {
    mixed: false,
    code: currencies[0],
  };
}

function renderMoney(value: number, currencyState: CurrencyState, decimal = 2): React.ReactNode {
  if (!Number.isFinite(value)) {
    return "-";
  }
  if (currencyState.mixed) {
    return <span style={{ color: "#8c8c8c" }}>多币种</span>;
  }
  if (currencyState.code) {
    return <MoneyText value={value} currency={currencyState.code} decimal={decimal} />;
  }
  return <span>{formatDecimal(value, decimal)}</span>;
}

function renderTargetEventSummary<T extends MetricRow>(
  rows: T[],
  currencyState: CurrencyState,
): React.ReactNode {
  const totalCount = sumBy(rows, (row) => row.targetEventCount);
  if (totalCount <= 0) {
    return "-";
  }
  const weightedCost =
    rows.reduce((total, row) => {
      const count = toNumber(row.targetEventCount);
      if (count <= 0) {
        return total;
      }
      return total + toNumber(row.targetEventCost) * count;
    }, 0) / totalCount;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span>{renderMoney(weightedCost, currencyState, 2)}</span>
      <span style={{ color: "#8c8c8c", fontSize: 12 }}>数量 {Math.round(totalCount).toLocaleString()}</span>
    </div>
  );
}

export function renderAdsMetricsSummary<T extends MetricRow>({
  columns,
  rows,
  summaryLabel = "汇总",
  hasSelectionColumn = false,
  renderers,
}: RenderSummaryOptions<T>): React.ReactNode {
  if (!rows.length) {
    return null;
  }

  const visibleColumns = columns.filter((column) => !column.hideInTable);
  const metricKeys = ["spend", "impressions", "clicks", "reach", "ctr", "cpc", "cpm", "frequency", "roas"];
  const labelColumnIndex = visibleColumns.findIndex((column) =>
    ["accountId", "campaignId", "adsetId", "adId", "creativeId", "name"].includes(
      getColumnKey(column.dataIndex) ?? "",
    ),
  );
  const metricColumnSet = new Set(metricKeys);
  if (!visibleColumns.some((column) => metricColumnSet.has(getColumnKey(column.dataIndex) ?? ""))) {
    return null;
  }
  const currencyState = getCurrencyState(rows);
  const totalSpend = sumBy(rows, (row) => row.spend);
  const totalImpressions = sumBy(rows, (row) => row.impressions);
  const totalClicks = sumBy(rows, (row) => row.clicks);
  const totalReach = sumBy(rows, (row) => row.reach);
  const roasWeightedSpend = rows.reduce((total, row) => {
    const spend = toNumber(row.spend);
    if (spend <= 0 || row.roas == null) {
      return total;
    }
    return total + toNumber(row.roas) * spend;
  }, 0);

  const defaultRenderers: Record<string, SummaryRenderer<T>> = {
    spend: () => renderMoney(totalSpend, currencyState, 2),
    impressions: () => Math.round(totalImpressions).toLocaleString(),
    clicks: () => Math.round(totalClicks).toLocaleString(),
    reach: () => Math.round(totalReach).toLocaleString(),
    ctr: () => (totalImpressions > 0 ? `${formatDecimal((totalClicks / totalImpressions) * 100, 2)}%` : "-"),
    cpc: () => (totalClicks > 0 ? renderMoney(totalSpend / totalClicks, currencyState, 2) : "-"),
    cpm: () =>
      totalImpressions > 0 ? renderMoney((totalSpend / totalImpressions) * 1000, currencyState, 2) : "-",
    frequency: () => (totalReach > 0 ? formatDecimal(totalImpressions / totalReach, 2) : "-"),
    roas: () => (totalSpend > 0 ? formatDecimal(roasWeightedSpend / totalSpend, 2) : "-"),
  };

  const mergedRenderers = { ...defaultRenderers, ...renderers };
  let cellIndex = 0;

  return (
    <Table.Summary fixed>
      <Table.Summary.Row>
        {hasSelectionColumn ? <Table.Summary.Cell key="selection" index={cellIndex++} /> : null}
        {visibleColumns.map((column, index) => {
          const columnKey = getColumnKey(column.dataIndex);
          let content: React.ReactNode = "";
          if (columnKey && metricColumnSet.has(columnKey)) {
            content = mergedRenderers[columnKey]?.(rows) ?? "-";
          } else if (index === (labelColumnIndex >= 0 ? labelColumnIndex : 0)) {
            content = summaryLabel;
          }
          return (
            <Table.Summary.Cell
              key={columnKey ?? index}
              index={cellIndex++}
              align={
                column.align === "left" ||
                column.align === "right" ||
                column.align === "center"
                  ? column.align
                  : undefined
              }
            >
              {content}
            </Table.Summary.Cell>
          );
        })}
      </Table.Summary.Row>
    </Table.Summary>
  );
}

