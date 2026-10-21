import { CheckoutForm } from "@/components/store/CheckoutForm";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="container-x py-10">
      <h1 className="mb-8 font-serif text-4xl">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
