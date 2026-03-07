export default ({ config }: any) => {
  const envUrl = String(process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim();
  const fallback = String((config.extra as any)?.apiBaseUrl ?? '').trim();

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      apiBaseUrl: envUrl || fallback || 'https://www.capitune.com',
    },
  } as any;
};
