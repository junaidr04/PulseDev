export const buildCacheKey = (namespace: string, identifier: string): string => {
  return `pulsedev:v2:${namespace}:${identifier}`;
};
