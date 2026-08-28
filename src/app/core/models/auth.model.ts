export type TenantRole = 'SUPER_ADMIN' | 'TENANT';

export interface LoginCommand {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tenantId: number;
  companyName: string;
  role: TenantRole;
  publicFormToken: string | null;
}

export interface Tenant {
  id: number;
  companyName: string;
  email: string;
  role: TenantRole;
  active: boolean;
  createdDate: string;
  publicFormToken: string | null;
}

export interface TenantCreateCommand {
  companyName: string;
  email: string;
  password: string;
}

export interface ChangePasswordCommand {
  currentPassword: string;
  newPassword: string;
}

export interface TenantEmailSettings {
  emailMessage: string | null;
}

export interface TenantEmailSettingsUpdateCommand {
  emailMessage: string;
}

export type MailConnectionState = 'ACTIVE' | 'REAUTH_REQUIRED' | 'DISCONNECTED';

export interface MailConnectionStatus {
  connected: boolean;
  provider: 'GOOGLE' | null;
  email: string | null;
  status: MailConnectionState;
  connectedAt: string | null;
}
