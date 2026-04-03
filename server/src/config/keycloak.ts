import { getEnv } from './env';

export const getKeycloakConfig = () => {
  const env = getEnv();
  return {
    realmUrl: env.KEYCLOAK_REALM_URL,
    clientId: env.KEYCLOAK_CLIENT_ID,
    clientSecret: env.KEYCLOAK_CLIENT_SECRET,
    jwksUrl: `${env.KEYCLOAK_REALM_URL}/protocol/openid-connect/certs`,
    tokenEndpoint: `${env.KEYCLOAK_REALM_URL}/protocol/openid-connect/token`,
  };
};

export const keycloakConfig = getKeycloakConfig();

export default keycloakConfig;
