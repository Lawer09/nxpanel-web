import type { IncludeExcludeValue } from '@/components/report/IncludeExcludeSelect';

export type ProjectExcludeFilters = {
  projectCodes?: string[];
  countries?: string[];
};

type QueryStateBase = {
  projectCodes?: string[];
  countries?: string[];
  exclude?: ProjectExcludeFilters;
};

export const toIncludeExcludeValue = (
  include?: string[],
  exclude?: string[],
): IncludeExcludeValue => ({
  include,
  exclude,
});

export const applyIncludeExcludeField = <T extends QueryStateBase>(
  prev: T,
  field: keyof ProjectExcludeFilters,
  value: IncludeExcludeValue,
): T => {
  const nextExclude: ProjectExcludeFilters = {
    ...prev.exclude,
    [field]: value.exclude,
  };
  const compactExclude =
    nextExclude.projectCodes || nextExclude.countries
      ? nextExclude
      : undefined;

  return {
    ...prev,
    [field]: value.include,
    exclude: compactExclude,
  };
};
