import { getEnv } from './env';

export const getSslcommerzConfig = () => {
  const env = getEnv();

  return {
    storeId: env.SSLCOMMERZ_STORE_ID,
    storePassword: env.SSLCOMMERZ_STORE_PASSWD,
    isLive: env.SSLCOMMERZ_IS_LIVE,
    baseUrl: env.SSLCOMMERZ_IS_LIVE
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com',
    sessionUrl: env.SSLCOMMERZ_IS_LIVE
      ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
      : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php',
    validationUrl: env.SSLCOMMERZ_IS_LIVE
      ? 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php'
      : 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php',
    successUrl: env.SSLCOMMERZ_SUCCESS_URL,
    failUrl: env.SSLCOMMERZ_FAIL_URL,
    cancelUrl: env.SSLCOMMERZ_CANCEL_URL,
    ipnUrl: env.SSLCOMMERZ_IPN_URL,
  };
};

export const sslcommerzConfig = getSslcommerzConfig();

export default sslcommerzConfig;
