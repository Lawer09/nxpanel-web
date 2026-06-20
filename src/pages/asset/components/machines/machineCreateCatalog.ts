type MachineCreateCatalogMap = Partial<
  Record<API.AssetMachineCreateCatalogCategory, API.AssetMachineCreateCatalog>
>;

export type MachineCreateCatalogOption = {
  id: string;
  value: string | number | boolean;
  label: string;
  selectable: boolean;
  reason?: string;
  cached?: boolean;
  stale?: boolean;
  raw?: Record<string, any> | null;
  extra?: Record<string, any>;
};

export type MachineCreateCatalogFieldGroup = {
  field: string;
  dependsOn: string[];
  options: MachineCreateCatalogOption[];
  categories: API.AssetMachineCreateCatalogCategory[];
  catalogTypes: string[];
  cached: boolean;
  stale: boolean;
  extra?: Record<string, any> | null;
};

const asPlainObject = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : undefined;

const asString = (value: unknown) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return undefined;
};

const mergeUnique = (left: string[], right: string[]) =>
  Array.from(new Set([...left, ...right]));

const mergeOptions = (
  left: MachineCreateCatalogOption[],
  right: MachineCreateCatalogOption[],
) => {
  const optionMap = new Map<string, MachineCreateCatalogOption>();

  [...left, ...right].forEach((item) => {
    const key = `${item.id}::${String(item.value)}`;
    if (!optionMap.has(key)) {
      optionMap.set(key, item);
    }
  });

  return Array.from(optionMap.values());
};

const normalizeOption = (
  option: API.AssetMachineCreateCatalogOption,
): MachineCreateCatalogOption => {
  const extra = asPlainObject(option.extra) || {};
  return {
    id: option.id,
    value: option.value,
    label: asString(extra.label) || String(option.value),
    selectable: extra.selectable !== false,
    reason: asString(extra.reason),
    cached: extra.cached === true,
    stale: extra.stale === true,
    raw: asPlainObject(extra.raw) || null,
    extra,
  };
};

const normalizeFieldGroup = (
  group: API.AssetMachineCreateCatalogOptionGroup,
  category: API.AssetMachineCreateCatalogCategory,
): MachineCreateCatalogFieldGroup => {
  const extra = asPlainObject(group.extra) || {};
  const catalogTypes = Array.isArray(extra.catalog_types)
    ? extra.catalog_types
        .map((item) => asString(item))
        .filter(Boolean) as string[]
    : [];

  return {
    field: group.field,
    dependsOn: Array.isArray(group.depends_on)
      ? group.depends_on.filter((item): item is string => typeof item === 'string')
      : [],
    options: (group.options || []).map(normalizeOption),
    categories: [category],
    catalogTypes,
    cached: extra.cached === true,
    stale: extra.stale === true,
    extra,
  };
};

export const buildMachineCreateFieldMap = (
  catalogs: MachineCreateCatalogMap,
) => {
  const fieldMap: Record<string, MachineCreateCatalogFieldGroup> = {};

  Object.values(catalogs).forEach((catalog) => {
    (catalog?.option_groups || []).forEach((group) => {
      const normalized = normalizeFieldGroup(group, catalog.category);
      const current = fieldMap[normalized.field];

      if (!current) {
        fieldMap[normalized.field] = normalized;
        return;
      }

      fieldMap[normalized.field] = {
        field: normalized.field,
        dependsOn: mergeUnique(current.dependsOn, normalized.dependsOn),
        options: mergeOptions(current.options, normalized.options),
        categories: Array.from(
          new Set([...current.categories, ...normalized.categories]),
        ),
        catalogTypes: mergeUnique(current.catalogTypes, normalized.catalogTypes),
        cached: current.cached || normalized.cached,
        stale: current.stale || normalized.stale,
        extra: { ...(current.extra || {}), ...(normalized.extra || {}) },
      };
    });
  });

  return fieldMap;
};

export const getMachineCreateFieldGroup = (
  fieldMap: Record<string, MachineCreateCatalogFieldGroup>,
  field: string,
) => fieldMap[field];

export const getMachineCreateFieldOptions = (
  fieldMap: Record<string, MachineCreateCatalogFieldGroup>,
  field: string,
) => getMachineCreateFieldGroup(fieldMap, field)?.options || [];

export const collectMachineCreateCatalogMessages = (
  catalogs: MachineCreateCatalogMap,
) => {
  const staleMessages: string[] = [];

  Object.values(catalogs).forEach((catalog) => {
    (catalog?.option_groups || []).forEach((group) => {
      const extra = asPlainObject(group.extra) || {};
      if (extra.stale === true) {
        staleMessages.push(`${group.field} options are using stale cache.`);
      }
    });
  });

  return {
    staleMessages: Array.from(new Set(staleMessages)),
  };
};
