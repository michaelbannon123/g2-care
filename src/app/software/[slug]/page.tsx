import Link from "next/link";
import { notFound } from "next/navigation";
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

  const { data: sources, error: sourcesError } = await supabase
    .from("sources")
    .select("*")
    .eq("software_id", software.id)
    .order("verified_at", { ascending: false });

  if (sourcesError) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="mt-4">Database error: {sourcesError.message}</p>
      </main>
    );
  }

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
