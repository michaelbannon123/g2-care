import Link from "next/link";
import { supabase } from "@/lib/supabase";
import HomeDirectory, { type DirectoryItem } from "./HomeDirectory";

const NHS_ASSURED_SCHEME = "Digital Social Care Records Assured Solutions List";

// Some vendors' currency values (e.g. Birdie's £0.20 per scheduled hour) are
// lost by the shared formatPrice() helper's default rounding, which is tuned
// for whole-pound prices elsewhere in the app. This keeps cents visible only
// when the amount actually has a fractional part.
function formatCompactPrice(amount: number, currency: string | null) {
  if (!currency) {
    return amount.toLocaleString("en-GB");
  }

  const hasFraction = amount % 1 !== 0;

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Extracts the billed unit from pricing models like "Per scheduled hour" or
// "Per active service user" so the compact summary can show what the price
// is actually charged per, instead of implying a flat fee.
function extractPricingUnit(pricingModel: string | null) {
  const match = pricingModel?.match(/^per\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export default async function Home() {
  const { data: software, error: softwareError } = await supabase
    .from("software")
    .select("*")
    .eq("active", true)
    .order("name");

  if (softwareError) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">G2 Care</h1>
        <p className="mt-4">Database error: {softwareError.message}</p>
      </main>
    );
  }

  const ids = software?.map((item) => item.id) ?? [];

  const [
    { data: settingsRows, error: settingsError },
    { data: regulatoryRows, error: regulatoryError },
    { data: pricingRows, error: pricingError },
  ] = ids.length > 0
    ? await Promise.all([
        supabase.from("software_settings").select("*").in("software_id", ids),
        supabase
          .from("software_regulatory_status")
          .select("*")
          .in("software_id", ids),
        supabase.from("software_pricing").select("*").in("software_id", ids),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];

  const firstError = settingsError || regulatoryError || pricingError;

  if (firstError) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">G2 Care</h1>
        <p className="mt-4">Database error: {firstError.message}</p>
      </main>
    );
  }

  const items: DirectoryItem[] = (software ?? []).map((product) => {
    const mySettings = (settingsRows ?? []).filter(
      (row) => row.software_id === product.id && row.supported === true
    );
    const myRegulatory = (regulatoryRows ?? []).filter(
      (row) => row.software_id === product.id
    );
    const myPricing = (pricingRows ?? []).filter(
      (row) => row.software_id === product.id
    );

    const nhsAssured = myRegulatory.some(
      (row) => row.scheme === NHS_ASSURED_SCHEME && row.status === "Assured"
    );

    const pricingRow = myPricing[0];

    let pricingStatus: DirectoryItem["pricingStatus"] = "not_verified";
    let priceSummary: string | null = null;

    if (pricingRow && pricingRow.pricing_public === true) {
      pricingStatus = "public";

      if (pricingRow.starting_price !== null) {
        const isFreeStarterPlan =
          pricingRow.starting_price === 0 &&
          /free/i.test(pricingRow.pricing_notes ?? "");

        if (isFreeStarterPlan) {
          // A £0 starting price here reflects a genuine free plan, not the
          // absence of paid tiers - the notes confirm paid tiers still exist.
          priceSummary = "Free plan available";
        } else {
          const price = formatCompactPrice(
            pricingRow.starting_price,
            pricingRow.currency
          );
          const unit = extractPricingUnit(pricingRow.pricing_model);
          const prefix = unit ? "From " : "";
          const unitSuffix = unit ? ` / ${unit}` : "";

          priceSummary = pricingRow.billing_period
            ? `${prefix}${price}${unitSuffix} / ${pricingRow.billing_period.toLowerCase()}`
            : `${prefix}${price}${unitSuffix}`;
        }
      }
    } else if (pricingRow && pricingRow.pricing_public === false) {
      pricingStatus = "quote_required";
    }

    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description,
      headquarters_country: product.headquarters_country,
      website_url: product.website_url,
      careSettings: Array.from(
        new Set(mySettings.map((row) => row.setting as string))
      ).sort(),
      nhsAssured,
      pricingStatus,
      priceSummary,
    };
  });

  const careSettingOptions = Array.from(
    new Set(items.flatMap((item) => item.careSettings))
  ).sort();

  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-4xl font-bold">Compare UK Care Software</h1>

      <p className="mt-3 max-w-2xl text-gray-500 dark:text-gray-400">
        Independent comparisons of UK care software, built entirely from
        verified public-source information.
      </p>

      <Link
        href="/compare"
        className="mt-4 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-gray-100 dark:text-gray-900"
      >
        Compare software
      </Link>

      <HomeDirectory items={items} careSettingOptions={careSettingOptions} />
    </main>
  );
}
