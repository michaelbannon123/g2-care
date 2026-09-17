import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Field,
  SourceLink,
  StatusBadge,
  SupportedBadge,
  formatDate,
  formatPrice,
  type CareSetting,
  type Feature,
  type Integration,
  type Pricing,
  type RegulatoryStatus,
  type Software,
  type Source,
} from "@/lib/software";

/**
 * Comparison slugs are of the form "<slug-a>-vs-<slug-b>". Because software
 * slugs may themselves contain hyphens, we resolve the pair against the real
 * list of software slugs in the database rather than guessing where the
 * "-vs-" boundary falls. This keeps the route reusable for any future pair
 * of products without hardcoding specific slugs.
 */
function resolveComparisonSlugs(comparison: string, knownSlugs: string[]) {
  for (const slugA of knownSlugs) {
    for (const slugB of knownSlugs) {
      if (slugA !== slugB && `${slugA}-vs-${slugB}` === comparison) {
        return [slugA, slugB] as const;
      }
    }
  }

  return null;
}

function pricingSummary(pricing: Pricing[]) {
  const primary = pricing[0];

  if (!primary || primary.starting_price === null) {
    return "Not verified";
  }

  const price = formatPrice(primary.starting_price, primary.currency);

  return primary.billing_period
    ? `${price} / ${primary.billing_period.toLowerCase()}`
    : price;
}

function regulatorySummary(statuses: RegulatoryStatus[]) {
  const primary = statuses[0];

  if (!primary || !primary.status) {
    return null;
  }

  return primary.status;
}

export default async function ComparePage({
  params,
}: PageProps<"/compare/[comparison]">) {
  const { comparison } = await params;

  const { data: allSoftware, error: softwareListError } = await supabase
    .from("software")
    .select("*");

  if (softwareListError || !allSoftware) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <p className="mt-4">Database error: {softwareListError?.message}</p>
      </main>
    );
  }

  const slugs = resolveComparisonSlugs(
    comparison,
    allSoftware.map((item) => item.slug)
  );

  if (!slugs) {
    notFound();
  }

  const [slugA, slugB] = slugs;
  const productA = allSoftware.find((item) => item.slug === slugA) as
    | Software
    | undefined;
  const productB = allSoftware.find((item) => item.slug === slugB) as
    | Software
    | undefined;

  if (!productA || !productB) {
    notFound();
  }

  const ids = [productA.id, productB.id];

  const [
    { data: sources, error: sourcesError },
    { data: pricing, error: pricingError },
    { data: features, error: featuresError },
    { data: settings, error: settingsError },
    { data: integrations, error: integrationsError },
    { data: regulatoryStatus, error: regulatoryError },
  ] = await Promise.all([
    supabase.from("sources").select("*").in("software_id", ids),
    supabase.from("software_pricing").select("*").in("software_id", ids),
    supabase.from("software_features").select("*").in("software_id", ids),
    supabase.from("software_settings").select("*").in("software_id", ids),
    supabase.from("software_integrations").select("*").in("software_id", ids),
    supabase
      .from("software_regulatory_status")
      .select("*")
      .in("software_id", ids),
  ]);

  const firstError =
    sourcesError ||
    pricingError ||
    featuresError ||
    settingsError ||
    integrationsError ||
    regulatoryError;

  if (firstError) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <p className="mt-4">Database error: {firstError.message}</p>
      </main>
    );
  }

  const sourceMap = new Map<string, Source>(
    (sources as Source[])?.map((source) => [source.id, source]) ?? []
  );

  const forProduct = <T extends { software_id: string }>(
    rows: T[] | null,
    softwareId: string
  ) => (rows ?? []).filter((row) => row.software_id === softwareId);

  const products = [productA, productB];
  const pricingByProduct = products.map((p) =>
    forProduct(pricing as Pricing[] | null, p.id)
  );
  const featuresByProduct = products.map((p) =>
    forProduct(features as Feature[] | null, p.id)
  );
  const settingsByProduct = products.map((p) =>
    forProduct(settings as CareSetting[] | null, p.id)
  );
  const integrationsByProduct = products.map((p) =>
    forProduct(integrations as Integration[] | null, p.id)
  );
  const regulatoryByProduct = products.map((p) =>
    forProduct(regulatoryStatus as RegulatoryStatus[] | null, p.id)
  );
  const sourcesByProduct = products.map((p) =>
    forProduct(sources as Source[] | null, p.id)
  );

  // Union of feature/setting names across both products, matched by exact
  // name string. A missing row for a product means "Not verified", never "No".
  const featureNames = Array.from(
    new Set((features as Feature[] | null)?.map((f) => f.feature) ?? [])
  ).sort();
  const settingNames = Array.from(
    new Set((settings as CareSetting[] | null)?.map((s) => s.setting) ?? [])
  ).sort();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <Link
        href="/"
        className="text-sm text-gray-500 underline dark:text-gray-400"
      >
        &larr; Back to software
      </Link>

      <h1 className="mt-4 text-4xl font-bold">
        {productA.name} vs {productB.name}
      </h1>

      <p className="mt-3 max-w-3xl text-gray-500 dark:text-gray-400">
        This comparison uses verified public-source information only. Where a
        product has no matching database record for a given feature, setting
        or attribute, it is shown as <strong>&ldquo;Not verified&rdquo;</strong>{" "}
        — this does not mean the product lacks that capability, only that it
        has not yet been confirmed against a public source.
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link
          href={`/software/${productA.slug}`}
          className="underline"
        >
          View {productA.name} profile
        </Link>
        <Link
          href={`/software/${productB.slug}`}
          className="underline"
        >
          View {productB.name} profile
        </Link>
      </div>

      {/* Summary */}
      <h2 className="mt-12 text-2xl font-semibold">Summary</h2>

      <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <th className="p-4 text-left font-medium text-gray-500 dark:text-gray-400">
                Attribute
              </th>
              {products.map((p) => (
                <th
                  key={p.id}
                  className="p-4 text-left font-semibold sm:sticky sm:top-0"
                >
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="p-4 text-gray-500 dark:text-gray-400">
                Description
              </td>
              {products.map((p) => (
                <td key={p.id} className="p-4">
                  {p.description ?? "Not verified"}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="p-4 text-gray-500 dark:text-gray-400">
                Headquarters
              </td>
              {products.map((p) => (
                <td key={p.id} className="p-4">
                  {p.headquarters_country ?? "Not verified"}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="p-4 text-gray-500 dark:text-gray-400">
                Published price
              </td>
              {pricingByProduct.map((rows, i) => (
                <td key={products[i].id} className="p-4 font-medium">
                  {pricingSummary(rows)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="p-4 text-gray-500 dark:text-gray-400">
                Care settings
              </td>
              {settingsByProduct.map((rows, i) => (
                <td key={products[i].id} className="p-4">
                  {rows.length}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="p-4 text-gray-500 dark:text-gray-400">
                Verified features
              </td>
              {featuresByProduct.map((rows, i) => (
                <td key={products[i].id} className="p-4">
                  {rows.length}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="p-4 text-gray-500 dark:text-gray-400">
                Integrations
              </td>
              {integrationsByProduct.map((rows, i) => (
                <td key={products[i].id} className="p-4">
                  {rows.length}
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-200 dark:border-gray-800">
              <td className="p-4 text-gray-500 dark:text-gray-400">
                NHS / regulatory status
              </td>
              {regulatoryByProduct.map((rows, i) => (
                <td key={products[i].id} className="p-4">
                  {regulatorySummary(rows) ? (
                    <StatusBadge status={regulatorySummary(rows)} />
                  ) : (
                    "Not verified"
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-4 text-gray-500 dark:text-gray-400">
                Full profile
              </td>
              {products.map((p) => (
                <td key={p.id} className="p-4">
                  <Link href={`/software/${p.slug}`} className="underline">
                    View profile
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pricing */}
      <h2 className="mt-12 text-2xl font-semibold">Pricing</h2>

      <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">
        {productA.name} and {productB.name} publish pricing in different
        structures. These figures are shown as published and are{" "}
        <strong>not converted or normalised</strong> to a common billing
        period. Do not treat them as directly comparable without obtaining
        provider-specific quotes.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {pricingByProduct.map((rows, i) => {
          const product = products[i];
          const item = rows[0];

          return (
            <div
              key={product.id}
              className="rounded-xl border border-gray-200 p-6 dark:border-gray-800"
            >
              <h3 className="font-semibold">{product.name}</h3>

              {!item ? (
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Pricing information not yet verified.
                </p>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    {item.starting_price !== null && (
                      <span className="text-2xl font-bold">
                        {formatPrice(item.starting_price, item.currency)}
                      </span>
                    )}
                    {item.billing_period && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        / {item.billing_period.toLowerCase()}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {item.pricing_model && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {item.pricing_model}
                      </span>
                    )}
                    {item.pricing_public !== null && (
                      <span className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        Publicly available pricing
                        <SupportedBadge value={item.pricing_public} />
                      </span>
                    )}
                  </div>

                  <Field
                    label="Minimum contract length"
                    value={
                      item.minimum_contract_months !== null
                        ? `${item.minimum_contract_months} months`
                        : null
                    }
                  />
                  <Field
                    label="Setup fee"
                    value={
                      item.setup_fee !== null
                        ? formatPrice(item.setup_fee, item.currency)
                        : null
                    }
                  />
                  <Field label="Notes" value={item.pricing_notes} />
                  <Field
                    label="Verified"
                    value={formatDate(item.verified_at)}
                  />
                  <SourceLink
                    sourceId={item.source_id}
                    sourceMap={sourceMap}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Features */}
      <h2 className="mt-12 text-2xl font-semibold">Features</h2>

      {featureNames.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Feature information not yet verified.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="p-4 text-left font-medium text-gray-500 dark:text-gray-400">
                  Feature
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    className="p-4 text-left font-semibold sm:sticky sm:top-0"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureNames.map((name) => (
                <tr
                  key={name}
                  className="border-b border-gray-200 last:border-0 dark:border-gray-800"
                >
                  <td className="p-4">{name}</td>
                  {featuresByProduct.map((rows, i) => {
                    const match = rows.find((row) => row.feature === name);
                    return (
                      <td key={products[i].id} className="p-4">
                        <SupportedBadge value={match?.supported ?? null} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Care settings */}
      <h2 className="mt-12 text-2xl font-semibold">Care settings</h2>

      {settingNames.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Care setting information not yet verified.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800">
                <th className="p-4 text-left font-medium text-gray-500 dark:text-gray-400">
                  Care setting
                </th>
                {products.map((p) => (
                  <th
                    key={p.id}
                    className="p-4 text-left font-semibold sm:sticky sm:top-0"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {settingNames.map((name) => (
                <tr
                  key={name}
                  className="border-b border-gray-200 last:border-0 dark:border-gray-800"
                >
                  <td className="p-4">{name}</td>
                  {settingsByProduct.map((rows, i) => {
                    const match = rows.find((row) => row.setting === name);
                    return (
                      <td key={products[i].id} className="p-4">
                        <SupportedBadge value={match?.supported ?? null} />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Integrations */}
      <h2 className="mt-12 text-2xl font-semibold">Integrations</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {integrationsByProduct.map((rows, i) => {
          const product = products[i];

          return (
            <div key={product.id}>
              <h3 className="font-semibold">{product.name}</h3>

              {rows.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Integration information not yet verified.
                </p>
              ) : (
                <div className="mt-2 grid gap-3">
                  {rows.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <h4 className="font-medium">{item.integration_name}</h4>
                      {item.integration_type && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {item.integration_type}
                        </p>
                      )}
                      <Field label="Notes" value={item.notes} />
                      <SourceLink
                        sourceId={item.source_id}
                        sourceMap={sourceMap}
                      />
                    </article>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Regulatory & NHS status */}
      <h2 className="mt-12 text-2xl font-semibold">
        Regulatory &amp; NHS status
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {regulatoryByProduct.map((rows, i) => {
          const product = products[i];

          return (
            <div key={product.id}>
              <h3 className="font-semibold">{product.name}</h3>

              {rows.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Regulatory information not yet verified.
                </p>
              ) : (
                <div className="mt-2 grid gap-3">
                  {rows.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          {item.authority && (
                            <h4 className="font-medium">{item.authority}</h4>
                          )}
                          {item.scheme && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              {item.scheme}
                            </p>
                          )}
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <Field label="Reference" value={item.reference} />
                      <Field
                        label="Verified"
                        value={formatDate(item.verified_at)}
                      />
                      <SourceLink
                        sourceId={item.source_id}
                        sourceMap={sourceMap}
                      />
                    </article>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sources & verification */}
      <h2 className="mt-12 text-2xl font-semibold">Sources &amp; verification</h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {sourcesByProduct.map((rows, i) => {
          const product = products[i];

          return (
            <div key={product.id}>
              <h3 className="font-semibold">{product.name}</h3>

              {rows.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No sources recorded.
                </p>
              ) : (
                <div className="mt-2 grid gap-3">
                  {rows.map((source) => (
                    <article
                      key={source.id}
                      className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <h4 className="font-medium">{source.source_name}</h4>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {source.source_type}
                      </p>
                      <Field
                        label="Verified"
                        value={formatDate(source.verified_at)}
                      />
                      <a
                        href={source.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-sm underline"
                      >
                        {source.source_url}
                      </a>
                    </article>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
