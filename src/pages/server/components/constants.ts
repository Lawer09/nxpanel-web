export const protocolOptions: { label: string; value: API.ServerProtocolType }[] = [
  { label: 'hysteria', value: 'hysteria' },
  { label: 'vless', value: 'vless' },
  { label: 'trojan', value: 'trojan' },
  { label: 'vmess', value: 'vmess' },
  { label: 'tuic', value: 'tuic' },
  { label: 'shadowsocks', value: 'shadowsocks' },
  { label: 'anytls', value: 'anytls' },
  { label: 'socks', value: 'socks' },
  { label: 'naive', value: 'naive' },
  { label: 'http', value: 'http' },
  { label: 'mieru', value: 'mieru' },
];

export type SelectOption = {
  label: string;
  value: number;
};
