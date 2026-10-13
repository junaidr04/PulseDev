export const formatApiResponse = <T>(
  success: boolean,
  data: T,
  message = 'Success'
) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  data,
});
