import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type Source = {
  id: string;
  software_id: string;
  source_name: string;
  source_type: string;
  source_url: string;
  verified_at: string | null;
  notes: string | null;
};

type Pricing = {
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

type Feature = {
  id: string;
  software_id: string;
  feature: string;
  supported: boolean | null;
  notes: string | null;
  source_id: string | null;
  verified_at: string | null;
};

type CareSetting = {
  id: string;
  software_id: string;
  setting: string;
  supported: boolean | null;
  notes: string | null;
  source_id: string | null;
  verified_at: string | null;
};

type Integration = {
  id: string;
  software_id: string;
  integration_name: string;
  integration_type: string | null;
  notes: string | null;
  source_id: string | null;
  verified_at: string | null;
};

type RegulatoryStatus = {
  id: string;
  software_id: string;
  authority: string | null;
  scheme: string | null;
  status: string | null;
  reference: string | null;
  verified_at: string | null;
  source_id: string | null;
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatSupported(value: boolean | null) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  return "Not verified";
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="mt-2 text-sm">
      <span className="text-gray-500">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function SourceLink({
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
      className="mt-2 inline-block text-sm underline"
    >
      Source: {source.source_name}
    </a>
  );
}

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

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link href="/" className="text-sm text-gray-500 underline">
        &larr; Back to software
      </Link>

      <h1 className="mt-4 text-4xl font-bold">{software.name}</h1>

      <p className="mt-3 text-gray-500">{software.description}</p>

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

      {/* Pricing */}
      <h2 className="mt-10 text-2xl font-semibold">Pricing</h2>

      {!pricing || pricing.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Pricing information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {(pricing as Pricing[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-6"
            >
              <Field label="Pricing model" value={item.pricing_model} />
              <Field
                label="Starting price"
                value={item.starting_price !== null ? item.starting_price : null}
              />
              <Field label="Currency" value={item.currency} />
              <Field label="Billing period" value={item.billing_period} />
              <Field
                label="Setup fee"
                value={item.setup_fee !== null ? item.setup_fee : null}
              />
              <Field
                label="Minimum contract length"
                value={
                  item.minimum_contract_months !== null
                    ? `${item.minimum_contract_months} months`
                    : null
                }
              />
              <Field
                label="Pricing publicly available"
                value={
                  item.pricing_public !== null
                    ? formatSupported(item.pricing_public)
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
      <h2 className="mt-10 text-2xl font-semibold">Features</h2>

      {!features || features.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Feature information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {(features as Feature[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{item.feature}</h3>
                <span className="text-sm text-gray-500">
                  {formatSupported(item.supported)}
                </span>
              </div>
              <Field label="Notes" value={item.notes} />
              <SourceLink sourceId={item.source_id} sourceMap={sourceMap} />
            </article>
          ))}
        </div>
      )}

      {/* Care settings */}
      <h2 className="mt-10 text-2xl font-semibold">Care settings</h2>

      {!settings || settings.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Care setting information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {(settings as CareSetting[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{item.setting}</h3>
                <span className="text-sm text-gray-500">
                  {formatSupported(item.supported)}
                </span>
              </div>
              <Field label="Notes" value={item.notes} />
              <SourceLink sourceId={item.source_id} sourceMap={sourceMap} />
            </article>
          ))}
        </div>
      )}

      {/* Integrations */}
      <h2 className="mt-10 text-2xl font-semibold">Integrations</h2>

      {!integrations || integrations.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Integration information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {(integrations as Integration[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-6"
            >
              <h3 className="font-semibold">{item.integration_name}</h3>
              <Field label="Type" value={item.integration_type} />
              <Field label="Notes" value={item.notes} />
              <SourceLink sourceId={item.source_id} sourceMap={sourceMap} />
            </article>
          ))}
        </div>
      )}

      {/* Regulatory & NHS status */}
      <h2 className="mt-10 text-2xl font-semibold">
        Regulatory &amp; NHS status
      </h2>

      {!regulatoryStatus || regulatoryStatus.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Regulatory information not yet verified.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {(regulatoryStatus as RegulatoryStatus[]).map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-gray-200 p-6"
            >
              <Field label="Authority" value={item.authority} />
              <Field label="Scheme" value={item.scheme} />
              <Field label="Status" value={item.status} />
              <Field label="Reference" value={item.reference} />
              <Field label="Verified" value={formatDate(item.verified_at)} />
              <SourceLink sourceId={item.source_id} sourceMap={sourceMap} />
            </article>
          ))}
        </div>
      )}

      {/* Verified sources */}
      <h2 className="mt-10 text-2xl font-semibold">Verified sources</h2>

      <div className="mt-4 grid gap-4">
        {(sources as Source[])?.map((source) => (
          <article
            key={source.id}
            className="rounded-xl border border-gray-200 p-6"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{source.source_name}</h3>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                Verified source
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-500">
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
              <p className="mt-2 text-sm text-gray-500">
                Verified on {formatDate(source.verified_at)}
              </p>
            )}

            {source.notes && (
              <p className="mt-2 text-sm text-gray-500">{source.notes}</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
