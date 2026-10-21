import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getErrorMessage } from "../api/client";
import { createRoom, listRooms, updateHousekeepingStatus } from "../api/rooms";
import { createRoomType, listRoomTypes } from "../api/roomTypes";
import { useAuth } from "../auth/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import { formatMoney } from "../lib/format";
import type { HousekeepingStatus } from "../types";

const roomTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.coerce.number().positive(),
  maxOccupancy: z.coerce.number().int().positive(),
  amenities: z.string().optional(),
});
type RoomTypeForm = z.infer<typeof roomTypeSchema>;

const roomSchema = z.object({
  roomNumber: z.string().min(1),
  roomTypeId: z.string().min(1, "Select a room type"),
  floor: z.coerce.number().int(),
});
type RoomForm = z.infer<typeof roomSchema>;

const housekeepingOptions: HousekeepingStatus[] = ["CLEAN", "DIRTY", "INSPECTED", "OUT_OF_SERVICE"];

export function InventoryPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const queryClient = useQueryClient();
  const [showRoomTypeForm, setShowRoomTypeForm] = useState(false);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const roomTypesQuery = useQuery({ queryKey: ["room-types"], queryFn: listRoomTypes });
  const roomsQuery = useQuery({ queryKey: ["rooms"], queryFn: () => listRooms() });

  const roomTypeForm = useForm<RoomTypeForm>({ resolver: zodResolver(roomTypeSchema) });
  const roomForm = useForm<RoomForm>({ resolver: zodResolver(roomSchema) });

  const createRoomTypeMutation = useMutation({
    mutationFn: (values: RoomTypeForm) =>
      createRoomType({
        name: values.name,
        description: values.description,
        basePrice: values.basePrice,
        maxOccupancy: values.maxOccupancy,
        amenities: values.amenities ? values.amenities.split(",").map((a) => a.trim()).filter(Boolean) : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["room-types"] });
      roomTypeForm.reset();
      setShowRoomTypeForm(false);
      setFormError(null);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const createRoomMutation = useMutation({
    mutationFn: (values: RoomForm) => createRoom(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      roomForm.reset();
      setShowRoomForm(false);
      setFormError(null);
    },
    onError: (err) => setFormError(getErrorMessage(err)),
  });

  const housekeepingMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: HousekeepingStatus }) =>
      updateHousekeepingStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Rooms & Room Types</h1>
        <p className="text-sm text-slate-500">Manage inventory and housekeeping status.</p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-slate-900">Room Types</h2>
          {isAdmin && (
            <button
              onClick={() => setShowRoomTypeForm((v) => !v)}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              {showRoomTypeForm ? "Cancel" : "New room type"}
            </button>
          )}
        </div>

        {showRoomTypeForm && (
          <form
            onSubmit={roomTypeForm.handleSubmit((v) => createRoomTypeMutation.mutate(v))}
            className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-5"
          >
            <input placeholder="Name" {...roomTypeForm.register("name")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Description" {...roomTypeForm.register("description")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Base price" type="number" step="0.01" {...roomTypeForm.register("basePrice")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Max occupancy" type="number" {...roomTypeForm.register("maxOccupancy")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <input placeholder="Amenities (comma-separated)" {...roomTypeForm.register("amenities")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white sm:col-span-2 md:col-span-1">
              Save
            </button>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Base price</th>
                <th className="px-4 py-2">Max occupancy</th>
                <th className="px-4 py-2">Amenities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roomTypesQuery.data?.map((rt) => (
                <tr key={rt.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{rt.name}</td>
                  <td className="px-4 py-2">{formatMoney(rt.basePrice)}</td>
                  <td className="px-4 py-2">{rt.maxOccupancy}</td>
                  <td className="px-4 py-2 text-slate-500">{rt.amenities.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium text-slate-900">Rooms</h2>
          {isAdmin && (
            <button
              onClick={() => setShowRoomForm((v) => !v)}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            >
              {showRoomForm ? "Cancel" : "New room"}
            </button>
          )}
        </div>

        {showRoomForm && (
          <form
            onSubmit={roomForm.handleSubmit((v) => createRoomMutation.mutate(v))}
            className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 md:grid-cols-4"
          >
            <input placeholder="Room number" {...roomForm.register("roomNumber")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <select {...roomForm.register("roomTypeId")} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
              <option value="">Select room type</option>
              {roomTypesQuery.data?.map((rt) => (
                <option key={rt.id} value={rt.id}>
                  {rt.name}
                </option>
              ))}
            </select>
            <input placeholder="Floor" type="number" {...roomForm.register("floor")} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
            <button type="submit" className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white">
              Save
            </button>
          </form>
        )}

        {formError && <p className="mb-3 text-sm text-red-600">{formError}</p>}

        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Room</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Floor</th>
                <th className="px-4 py-2">Housekeeping</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roomsQuery.data?.map((room) => (
                <tr key={room.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{room.roomNumber}</td>
                  <td className="px-4 py-2">{room.roomType.name}</td>
                  <td className="px-4 py-2">{room.floor}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={room.housekeepingStatus} />
                      <select
                        value={room.housekeepingStatus}
                        onChange={(e) =>
                          housekeepingMutation.mutate({ id: room.id, status: e.target.value as HousekeepingStatus })
                        }
                        className="rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                      >
                        {housekeepingOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
