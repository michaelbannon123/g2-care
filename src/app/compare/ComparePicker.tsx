"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type SoftwareOption = {
  slug: string;
  name: string;
};

export default function ComparePicker({
  software,
}: {
  software: SoftwareOption[];
}) {
  const router = useRouter();
  const [slugA, setSlugA] = useState("");
  const [slugB, setSlugB] = useState("");

  const canCompare = slugA !== "" && slugB !== "" && slugA !== slugB;

  const handleCompare = () => {
    if (!canCompare) {
      return;
    }

    router.push(`/compare/${slugA}-vs-${slugB}`);
  };

  return (
    <div className="mt-8 rounded-xl border border-gray-200 p-6 dark:border-gray-800">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-gray-500 dark:text-gray-400">Product 1</span>
          <select
            value={slugA}
            onChange={(event) => setSlugA(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent p-2 text-sm dark:border-gray-800"
          >
            <option value="">Select a product&hellip;</option>
            {software.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-gray-500 dark:text-gray-400">Product 2</span>
          <select
            value={slugB}
            onChange={(event) => setSlugB(event.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 bg-transparent p-2 text-sm dark:border-gray-800"
          >
            <option value="">Select a product&hellip;</option>
            {software.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {slugA !== "" && slugB !== "" && slugA === slugB && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          Choose two different products to compare.
        </p>
      )}

      <button
        type="button"
        onClick={handleCompare}
        disabled={!canCompare}
        className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-gray-100 dark:text-gray-900"
      >
        Compare software
      </button>
    </div>
  );
}
