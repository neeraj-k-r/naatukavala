"use client";

import { useActionState } from "react";

import { deleteProduct } from "@/lib/actions";

export default function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [, action, pending] = useActionState(deleteProduct, undefined);

  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        onClick={(event) => {
          if (!confirm(`Delete "${name}"? This cannot be undone.`)) {
            event.preventDefault();
          }
        }}
        className="rounded-lg border border-red-100 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete
      </button>
    </form>
  );
}