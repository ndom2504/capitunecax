type PublicConfig = {
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  paymentCurrency: string;
};

type PublicEnvKey =
  | 'PUBLIC_CONTACT_EMAIL'
  | 'PUBLIC_CONTACT_PHONE'
  | 'PUBLIC_CONTACT_ADDRESS'
  | 'PUBLIC_PAYMENT_CURRENCY'
  | 'PAYMENT_CURRENCY';

const getEnv = (key: PublicEnvKey): string | undefined => {
  const env = import.meta.env;

  const value =
    key === 'PUBLIC_CONTACT_EMAIL'
      ? env.PUBLIC_CONTACT_EMAIL
      : key === 'PUBLIC_CONTACT_PHONE'
        ? env.PUBLIC_CONTACT_PHONE
        : key === 'PUBLIC_CONTACT_ADDRESS'
          ? env.PUBLIC_CONTACT_ADDRESS
          : key === 'PUBLIC_PAYMENT_CURRENCY'
            ? env.PUBLIC_PAYMENT_CURRENCY
            : key === 'PAYMENT_CURRENCY'
              ? env.PAYMENT_CURRENCY
              : undefined;

  if (typeof value === 'string' && value.trim()) return value;
  return undefined;
};

export const publicConfig: PublicConfig = {
  contactEmail: getEnv('PUBLIC_CONTACT_EMAIL') ?? 'contact@capitune.com',
  contactPhone: getEnv('PUBLIC_CONTACT_PHONE') ?? '+1 581 443 9464',
  contactAddress:
    getEnv('PUBLIC_CONTACT_ADDRESS') ??
    '93 Rue des Castels, Lévis, QC G6V 2B8\nCAPITUNE – Export Monde Prestige Inc.\nMontréal, Québec, Canada.',
  paymentCurrency: getEnv('PUBLIC_PAYMENT_CURRENCY') ?? getEnv('PAYMENT_CURRENCY') ?? 'CAD',
};

export function getContactAddressLines(): string[] {
  return publicConfig.contactAddress
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function formatMoney(amount: number, options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }): string {
  const { minimumFractionDigits = 0, maximumFractionDigits = 0 } = options ?? {};

  return new Intl.NumberFormat('fr-CA', {
    style: 'currency',
    currency: publicConfig.paymentCurrency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}
