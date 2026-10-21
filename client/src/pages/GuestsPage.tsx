import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { createGuest, listGuests } from "../api/guests";
import { getErrorMessage } from "../api/client";

const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  idDocumentNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function GuestsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guestsQuery = useQuery({ queryKey: ["guests", search], queryFn: () => listGuests(search || undefined) });
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) =>
      createGuest({ ...values, email: values.email || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      form.reset();
      setShowForm(false);
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Guests</h1>
          <p className="text-sm text-slate-500">Search existing guests or add a new profile.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:py-1.5"
        >
          {showForm ? "Cancel" : "New guest"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={form.handleSubmit((v) => createMutation.mutate(v))}
          className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-3"
        >
          <input placeholder="Full name" {...form.register("fullName")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Email" {...form.register("email")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Phone" {...form.register("phone")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="ID document number" {...form.register("idDocumentNumber")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Address" {...form.register("address")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Notes" {...form.register("notes")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white sm:col-span-2 md:col-span-1">
            Save guest
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <input
        placeholder="Search by name, email, or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Phone</th>
              <th className="px-4 py-2">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {guestsQuery.data?.map((guest) => (
              <tr key={guest.id}>
                <td className="px-4 py-2 font-medium text-slate-900">{guest.fullName}</td>
                <td className="px-4 py-2">{guest.email ?? "—"}</td>
                <td className="px-4 py-2">{guest.phone ?? "—"}</td>
                <td className="px-4 py-2 text-slate-500">{guest.notes ?? "—"}</td>
              </tr>
            ))}
            {guestsQuery.data?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No guests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
