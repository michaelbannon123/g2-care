import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ComparePicker from "./ComparePicker";

export default async function ComparePickerPage() {
  const { data: software, error } = await supabase
    .from("software")
    .select("slug, name")
    .eq("active", true)
    .order("name");

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-8">
        <p className="mt-4">Database error: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-8">
      <Link
        href="/"
        className="text-sm text-gray-500 underline dark:text-gray-400"
      >
        &larr; Back to software
      </Link>

      <h1 className="mt-4 text-4xl font-bold">Compare software</h1>

      <p className="mt-3 text-gray-500 dark:text-gray-400">
        Choose two products to compare side-by-side using verified public
        source information.
      </p>

      {!software || software.length < 2 ? (
        <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          At least two products are needed to run a comparison.
        </p>
      ) : (
        <ComparePicker software={software} />
      )}
    </main>
  );
}
