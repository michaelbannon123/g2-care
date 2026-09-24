"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type DirectoryItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  headquarters_country: string | null;
  website_url: string | null;
  careSettings: string[];
  nhsAssured: boolean;
  pricingStatus: "public" | "quote_required" | "not_verified";
  priceSummary: string | null;
};

const NHS_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "assured", label: "Assured" },
  { value: "not_verified", label: "Not verified" },
];

const PRICING_FILTER_OPTIONS = [
  { value: "", label: "All" },
  { value: "public", label: "Public pricing available" },
  { value: "quote_required", label: "Pricing not publicly listed" },
  { value: "not_verified", label: "Not verified" },
];

function NhsBadge({ assured }: { assured: boolean }) {
  return (
    <span
      className={
        assured
          ? "inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
          : "inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      }
    >
      {assured ? "NHS assured" : "Not verified"}
    </span>
  );
}

function PricingBadge({
  status,
}: {
  status: DirectoryItem["pricingStatus"];
}) {
  const label =
    status === "public"
      ? "Public pricing"
      : status === "quote_required"
        ? "Quote required"
        : "Pricing not verified";

  const styles =
    status === "public"
      ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
      : status === "quote_required"
        ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles}`}
    >
      {label}
    </span>
  );
}

export default function HomeDirectory({
  items,
  careSettingOptions,
}: {
  items: DirectoryItem[];
  careSettingOptions: string[];
}) {
  const [query, setQuery] = useState("");
  const [careSetting, setCareSetting] = useState("");
  const [nhsFilter, setNhsFilter] = useState("");
  const [pricingFilter, setPricingFilter] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchesQuery =
        q === "" ||
        item.name.toLowerCase().includes(q) ||
        (item.description ?? "").toLowerCase().includes(q);

      const matchesCareSetting =
        careSetting === "" || item.careSettings.includes(careSetting);

      const matchesNhs =
        nhsFilter === "" ||
        (nhsFilter === "assured" ? item.nhsAssured : !item.nhsAssured);

      const matchesPricing =
        pricingFilter === "" || item.pricingStatus === pricingFilter;

      return (
        matchesQuery && matchesCareSetting && matchesNhs && matchesPricing
      );
    });
  }, [items, query, careSetting, nhsFilter, pricingFilter]);

  return (
    <div className="mt-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search software..."
          className="rounded-lg border border-gray-200 bg-transparent p-2 text-sm sm:col-span-2 lg:col-span-1 dark:border-gray-800"
        />

        <label className="block text-sm">
          <span className="sr-only">Care setting</span>
          <select
            value={careSetting}
            onChange={(event) => setCareSetting(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-transparent p-2 text-sm dark:border-gray-800"
          >
            <option value="">All care settings</option>
            {careSettingOptions.map((setting) => (
              <option key={setting} value={setting}>
                {setting}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="sr-only">NHS assured</span>
          <select
            value={nhsFilter}
            onChange={(event) => setNhsFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-transparent p-2 text-sm dark:border-gray-800"
          >
            {NHS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                NHS assured: {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="sr-only">Public pricing</span>
          <select
            value={pricingFilter}
            onChange={(event) => setPricingFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-transparent p-2 text-sm dark:border-gray-800"
          >
            {PRICING_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Pricing: {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        Missing information is shown as not verified, not assumed to mean no.
      </p>

      <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
        {filtered.length} software product{filtered.length === 1 ? "" : "s"}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          No software matches these filters.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <article
              key={item.id}
              className="flex flex-col rounded-xl border border-gray-200 p-5 dark:border-gray-800"
            >
              <h2 className="text-lg font-semibold">
                <Link
                  href={`/software/${item.slug}`}
                  className="hover:underline"
                >
                  {item.name}
                </Link>
              </h2>

              {item.description && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              )}

              {item.headquarters_country && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Headquarters: {item.headquarters_country}
                </p>
              )}

              {item.careSettings.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.careSettings.map((setting) => (
                    <span
                      key={setting}
                      className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {setting}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <NhsBadge assured={item.nhsAssured} />
                <PricingBadge status={item.pricingStatus} />
              </div>

              {item.priceSummary && (
                <p className="mt-2 text-sm font-medium">
                  {item.priceSummary}
                </p>
              )}

              <div className="mt-4 flex items-center gap-4 text-sm">
                <Link
                  href={`/software/${item.slug}`}
                  className="underline"
                >
                  View profile
                </Link>
                {item.website_url && (
                  <a
                    href={item.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Visit website
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
