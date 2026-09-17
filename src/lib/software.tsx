import type { ReactNode } from "react";

export type Software = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  headquarters_country: string | null;
  website_url: string | null;
};

export type Source = {
  id: string;
  software_id: string;
  source_name: string;
  source_type: string;
  source_url: string;
  verified_at: string | null;
  notes: string | null;
};

export type Pricing = {
  id: string;
  software_id: string;
  pricing_model: string | null;
  starting_price: number | null;
  currency: string | null;
  billing_period: string | null;
  setup_fee: number | null;
  minimum_contract_months: number | null;
  pricing_public: boolean | null;
  pricing_notes: string | null;
  verified_at: string | null;
  source_id: string | null;
};

export type Feature = {
  id: string;
  software_id: string;
  feature: string;
  supported: boolean | null;
  notes: string | null;
  source_id: string | null;
  verified_at: string | null;
};

export type CareSetting = {
  id: string;
  software_id: string;
  setting: string;
  supported: boolean | null;
  notes: string | null;
  source_id: string | null;
  verified_at: string | null;
};

export type Integration = {
  id: string;
  software_id: string;
  integration_name: string;
  integration_type: string | null;
  notes: string | null;
  source_id: string | null;
  verified_at: string | null;
};

export type RegulatoryStatus = {
  id: string;
  software_id: string;
  authority: string | null;
  scheme: string | null;
  status: string | null;
  reference: string | null;
  verified_at: string | null;
  source_id: string | null;
};

export function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatSupported(value: boolean | null | undefined) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Not verified";
}

export function formatPrice(amount: number, currency: string | null) {
  if (!currency) {
    return amount.toLocaleString("en-GB");
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function SupportedBadge({ value }: { value: boolean | null | undefined }) {
  const label = formatSupported(value);

  const styles =
    value === true
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
      : value === false
        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return null;
  }

  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
      {status}
    </span>
  );
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="mt-2 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

export function SourceLink({
  sourceId,
  sourceMap,
}: {
  sourceId: string | null;
  sourceMap: Map<string, Source>;
}) {
  if (!sourceId) {
    return null;
  }

  const source = sourceMap.get(sourceId);

  if (!source) {
    return null;
  }

  return (
    <a
      href={source.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-block text-sm text-gray-500 underline hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    >
      Source: {source.source_name}
    </a>
  );
}
