export { useProfileQuery, PROFILE_QUERY_KEY } from './queries/useProfileQuery';
export { useSecurityDevicesQuery, useRevokeDeviceMutation, useRevokeAllOtherDevicesMutation } from './queries/useSecurityDevices';
export type { SecurityDevice } from './queries/useSecurityDevices';
export { authAPI } from './api';
export type { UserProfile } from './types/profile.types';

// Views
export { default as LoginView } from './components/LoginView';
export { default as RegisterView } from './components/RegisterView';
