import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getErrorMessage } from "../api/client";
import { createUser, deactivateUser, listUsers, updateUser } from "../api/users";

const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(["ADMIN", "FRONT_DESK"]),
});
type FormValues = z.infer<typeof schema>;

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usersQuery = useQuery({ queryKey: ["users"], queryFn: listUsers });
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "FRONT_DESK" } });

  const createMutation = useMutation({
    mutationFn: (values: FormValues) => createUser(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      form.reset({ role: "FRONT_DESK" });
      setShowForm(false);
      setError(null);
    },
    onError: (err) => setError(getErrorMessage(err)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? updateUser(id, { isActive: true }) : deactivateUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Staff Accounts</h1>
          <p className="text-sm text-slate-500">Manage admin and front-desk users.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          {showForm ? "Cancel" : "New staff account"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={form.handleSubmit((v) => createMutation.mutate(v))}
          className="grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-4"
        >
          <input placeholder="Full name" {...form.register("fullName")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Email" {...form.register("email")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input placeholder="Password" type="password" {...form.register("password")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <select {...form.register("role")} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="FRONT_DESK">Front desk</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white sm:col-span-2 md:col-span-1">
            Create account
          </button>
        </form>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersQuery.data?.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-medium text-slate-900">{u.fullName}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">
                  <span className={u.isActive ? "text-green-600" : "text-slate-400"}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => toggleActiveMutation.mutate({ id: u.id, isActive: !u.isActive })}
                    className="text-xs font-medium text-slate-600 underline hover:text-slate-900"
                  >
                    {u.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
