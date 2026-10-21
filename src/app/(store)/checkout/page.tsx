import { CheckoutForm } from "@/components/store/CheckoutForm";

export const metadata = { title: "চেকআউট" };

export default function CheckoutPage() {
  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="mb-6 font-serif text-3xl sm:mb-8 sm:text-4xl">চেকআউট</h1>
      <CheckoutForm />
    </div>
  );
}
