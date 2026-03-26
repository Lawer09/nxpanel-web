declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'numeral';
declare module 'mockjs';
declare module 'react-fittext';

declare const REACT_APP_ENV: 'test' | 'dev' | 'pre' | false;

declare namespace API {
  interface Machine {
    id?: number;
    name: string;
    hostname: string;
    ip_address: string;
    port: number;
    username: string;
    password?: string;
    private_key?: string;
    status?: 'online' | 'offline' | 'error' | 'maintenance';
    os_type?: string;
    cpu_cores?: string;
    memory?: string;
    disk?: string;
    gpu_info?: string;
    bandwidth?: number;
    provider?: string;
    price?: number;
    pay_mode?: 'hourly' | 'daily' | 'monthly' | 'quarterly' | 'yearly' | 'once';
    tags?: string;
    description?: string;
    is_active?: 0 | 1;
    last_check_at?: string;
    created_at?: string;
    updated_at?: string;
  }
}