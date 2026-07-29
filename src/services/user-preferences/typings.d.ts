declare namespace API {
  type UserPreferenceValue = Record<string, any> | any[];

  interface UserPreferenceItem {
    preferenceKey: string;
    preferenceValue: UserPreferenceValue;
    valueHash: string;
    updatedAt?: string | number | null;
  }

  interface UserPreferenceSaveItem {
    preferenceKey: string;
    preferenceValue: UserPreferenceValue;
  }
}
