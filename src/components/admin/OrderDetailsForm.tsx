"use client";

import { updateOrderDetails } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "./ActionForm";
import { Field } from "./ui";

type Details = { id: string; name: string; phone: string; email: string; address: string; city: string; deliveryArea: string; courier: string; trackingCode: string; adminNote: string };

const COURIERS = ["", "Pathao", "Steadfast", "RedX", "Paperfly", "Sundarban", "eCourier", "Own delivery", "Other"];

export function OrderDetailsForm({ order }: { order: Details }) {
  return (
    <ActionForm action={updateOrderDetails} success="Order updated" className="space-y-3 text-sm">
      <input type="hidden" name="id" value={order.id} />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Courier">
          <select name="courier" defaultValue={order.courier} className="input">
            {COURIERS.map((c) => (
              <option key={c} value={c}>
                {c || "— Not sent yet —"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tracking / consignment ID">
          <input name="trackingCode" defaultValue={order.trackingCode} className="input" />
        </Field>
      </div>
      <Field label="Private note (only you see this)">
        <textarea name="adminNote" rows={2} defaultValue={order.adminNote} className="input" />
      </Field>
      <details className="rounded-xl border border-line p-3">
        <summary className="font-medium">Edit customer & address</summary>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Name">
            <input name="name" defaultValue={order.name} className="input" />
          </Field>
          <Field label="Phone">
            <input name="phone" defaultValue={order.phone} className="input" />
          </Field>
          <Field label="Address" className="col-span-2">
            <input name="address" defaultValue={order.address} className="input" />
          </Field>
          <Field label="District">
            <input name="city" defaultValue={order.city} className="input" />
          </Field>
          <Field label="Area">
            <select name="deliveryArea" defaultValue={order.deliveryArea} className="input">
              <option value="inside">Inside Dhaka</option>
              <option value="outside">Outside Dhaka</option>
            </select>
          </Field>
          <Field label="Email" className="col-span-2">
            <input name="email" defaultValue={order.email} className="input" />
          </Field>
        </div>
      </details>
      <SubmitButton className="btn btn-primary w-full rounded-xl py-2.5">Save changes</SubmitButton>
    </ActionForm>
  );
}
