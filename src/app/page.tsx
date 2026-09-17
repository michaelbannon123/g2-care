import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const { data: software, error } = await supabase
    .from("software")
    .select("*")
    .eq("active", true)
    .order("name");

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">G2 Care</h1>
        <p className="mt-4">Database error: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-4xl font-bold">Compare Care Software</h1>

      <p className="mt-3 text-gray-500">
        Independent UK care software comparisons backed by verified sources.
      </p>

      {software?.some((p) => p.slug === "nourish-care") &&
        software?.some((p) => p.slug === "carelinelive") && (
          <Link
            href="/compare/nourish-care-vs-carelinelive"
            className="mt-4 inline-block text-sm underline"
          >
            Compare Nourish Care vs CareLineLive
          </Link>
        )}

      <div className="mt-8 grid gap-6">
        {software?.map((product) => (
          <article
            key={product.id}
            className="rounded-xl border border-gray-200 p-6"
          >
            <h2 className="text-2xl font-semibold">
              <Link href={`/software/${product.slug}`} className="hover:underline">
                {product.name}
              </Link>
            </h2>

            <p className="mt-2 text-gray-500">
              {product.description}
            </p>

            <p className="mt-4 text-sm">
              Headquarters: {product.headquarters_country}
            </p>

            <div className="mt-4 flex items-center gap-4">
              <a
                href={product.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block underline"
              >
                Visit website
              </a>

              <Link
                href={`/software/${product.slug}`}
                className="inline-block underline"
              >
                View profile
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}