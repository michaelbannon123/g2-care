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
  type Source,
} from "@/lib/software";

export default async function SoftwarePage({
  params,
}: PageProps<"/software/[slug]">) {
  const { slug } = await params;

  const { data: software, error: softwareError } = await supabase
    .from("software")
    .select("*")
    .eq("slug", slug)
    .single();

  if (softwareError || !software) {
    notFound();
  }

  const [
    { data: sources, error: sourcesError },
    { data: pricing, error: pricingError },
    { data: features, error: featuresError },
    { data: settings, error: settingsError },
    { data: integrations, error: integrationsError },
    { data: regulatoryStatus, error: regulatoryError },
  ] = await Promise.all([
    supabase
      .from("sources")
      .select("*")
      .eq("software_id", software.id)
      .order("verified_at", { ascending: false }),
    supabase.from("software_pricing").select("*").eq("software_id", software.id),
    supabase.from("software_features").select("*").eq("software_id", software.id),
    supabase.from("software_settings").select("*").eq("software_id", software.id),
    supabase
      .from("software_integrations")
      .select("*")
      .eq("software_id", software.id),
    supabase
      .from("software_regulatory_status")
      .select("*")
      .eq("software_id", software.id),
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
      <main className="mx-auto max-w-3xl p-8">
        <p className="mt-4">Database error: {firstError.message}</p>
      </main>
    );
  }

  const sourceMap = new Map<string, Source>(
    (sources as Source[])?.map((source) => [source.id, source]) ?? []
  );

  const careSettingsCount = settings?.length ?? 0;
  const verifiedFeaturesCount = features?.length ?? 0;
  const integrationsCount = integrations?.length ?? 0;
  const sourceCount = sources?.length ?? 0;

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/" className="text-sm text-gray-500 underline dark:text-gray-400">
        &larr; Back to software
      </Link>

      <h1 className="mt-4 text-4xl font-bold">{software.name}</h1>

      <p className="mt-3 text-gray-500 dark:text-gray-400">
        {software.description}
      </p>

      <p className="mt-4 text-sm">
        Headquarters: {software.headquarters_country}
      </p>

      <a
        href={software.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block underline"
      >
        Visit website
      </a>

      {/* Summary */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 p-4 text-center dark:border-gray-800">
          <div className="text-2xl font-bold">{careSettingsCount}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Care settings
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-center dark:border-gray-800">
          <div className="text-2xl font-bold">{verifiedFeaturesCount}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Verified features
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-center dark:border-gray-800">
          <div className="text-2xl font-bold">{integrationsCount}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Integrations
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 text-center dark:border-gray-800">
          <div className="text-2xl font-bold">{sourceCount}</div>
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Sources
          </div>
        </div>
      </div>

      {/* Pricing */}
      <h2 className="mt-12 text-2xl font-semibold">Pricing</h2>

      {!pricing || pricing.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Pricing information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {(pricing as Pricing[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-6 dark:border-gray-800"
            >
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {item.starting_price !== null && (
                  <span className="text-3xl font-bold">
                    {formatPrice(item.starting_price, item.currency)}
                  </span>
                )}
                {item.billing_period && (
                  <span className="text-base text-gray-500 dark:text-gray-400">
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
                label="Setup fee"
                value={
                  item.setup_fee !== null
                    ? formatPrice(item.setup_fee, item.currency)
                    : null
                }
              />
              <Field
                label="Minimum contract length"
                value={
                  item.minimum_contract_months !== null
                    ? `${item.minimum_contract_months} months`
                    : null
                }
              />
              <Field label="Notes" value={item.pricing_notes} />
              <Field label="Verified" value={formatDate(item.verified_at)} />
              <SourceLink sourceId={item.source_id} sourceMap={sourceMap} />
            </article>
          ))}
        </div>
      )}

      {/* Features */}
      <h2 className="mt-12 text-2xl font-semibold">Features</h2>

      {!features || features.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Feature information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(features as Feature[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{item.feature}</h3>
                <SupportedBadge value={item.supported} />
              </div>
              <Field label="Notes" value={item.notes} />
              <SourceLink sourceId={item.source_id} sourceMap={sourceMap} />
            </article>
          ))}
        </div>
      )}

      {/* Care settings */}
      <h2 className="mt-12 text-2xl font-semibold">Care settings</h2>

      {!settings || settings.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Care setting information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(settings as CareSetting[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">{item.setting}</h3>
                <SupportedBadge value={item.supported} />
              </div>
              <Field label="Notes" value={item.notes} />
              <SourceLink sourceId={item.source_id} sourceMap={sourceMap} />
            </article>
          ))}
        </div>
      )}

      {/* Integrations */}
      <h2 className="mt-12 text-2xl font-semibold">Integrations</h2>

      {!integrations || integrations.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Integration information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(integrations as Integration[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            >
              <h3 className="text-lg font-semibold">{item.integration_name}</h3>
              {item.integration_type && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {item.integration_type}
                </p>
              )}
              <Field label="Notes" value={item.notes} />
              <SourceLink sourceId={item.source_id} sourceMap={sourceMap} />
            </article>
          ))}
        </div>
      )}

      {/* Regulatory & NHS status */}
      <h2 className="mt-12 text-2xl font-semibold">
        Regulatory &amp; NHS status
      </h2>

      {!regulatoryStatus || regulatoryStatus.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Regulatory information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {(regulatoryStatus as RegulatoryStatus[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-6 dark:border-gray-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  {item.authority && (
                    <h3 className="font-semibold">{item.authority}</h3>
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
              <Field label="Verified" value={formatDate(item.verified_at)} />
              <SourceLink sourceId={item.source_id} sourceMap={sourceMap} />
            </article>
          ))}
        </div>
      )}

      {/* Verified sources */}
      <h2 className="mt-12 text-2xl font-semibold">Verified sources</h2>

      <div className="mt-4 grid gap-4">
        {(sources as Source[])?.map((source) => (
          <article
            key={source.id}
            className="rounded-xl border border-gray-200 p-6 dark:border-gray-800"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{source.source_name}</h3>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300">
                Verified source
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {source.source_type}
            </p>

            <a
              href={source.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block underline"
            >
              {source.source_url}
            </a>

            {formatDate(source.verified_at) && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Verified on {formatDate(source.verified_at)}
              </p>
            )}

            {source.notes && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {source.notes}
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
