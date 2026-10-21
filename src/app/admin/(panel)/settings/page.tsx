import { saveSettings } from "@/app/admin/actions";
import { ActionForm, SubmitButton } from "@/components/admin/ActionForm";
import { Card, Field, PageHeader } from "@/components/admin/ui";
import { getSettings } from "@/lib/settings";

const decimal = (c: number) => (c / 100).toFixed(2);

export default async function SettingsPage() {
  const s = await getSettings();
  return (
    <>
      <PageHeader title="Store settings" subtitle="Changes go live on the storefront as soon as you save." />
      <ActionForm action={saveSettings} success="Settings saved — your store is updated." className="space-y-4">
        <Card className="grid gap-4 sm:grid-cols-2">
          <p className="font-semibold sm:col-span-2">Brand</p>
          <Field label="Store name">
            <input name="storeName" required defaultValue={s.storeName} className="input" />
          </Field>
          <Field label="Tagline">
            <input name="tagline" defaultValue={s.tagline} className="input" />
          </Field>
          <Field label="Announcement bar" className="sm:col-span-2">
            <input name="announcement" defaultValue={s.announcement} className="input" />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="announcementEnabled" defaultChecked={s.announcementEnabled} className="h-4 w-4 accent-ink" /> Show announcement bar
          </label>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-2">
          <p className="font-semibold sm:col-span-2">Home page hero</p>
          <Field label="Small label above the headline">
            <input name="heroEyebrow" defaultValue={s.heroEyebrow} className="input" />
          </Field>
          <Field label="Button text">
            <input name="heroCta" defaultValue={s.heroCta} className="input" />
          </Field>
          <Field label="Headline" className="sm:col-span-2">
            <input name="heroTitle" defaultValue={s.heroTitle} className="input" />
          </Field>
          <Field label="Subheading" className="sm:col-span-2">
            <textarea name="heroSubtitle" rows={2} defaultValue={s.heroSubtitle} className="input" />
          </Field>
          <Field label="Main hero image URL" className="sm:col-span-2">
            <input name="heroImage" defaultValue={s.heroImage} className="input" />
          </Field>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-4">
          <p className="font-semibold sm:col-span-4">Pricing & shipping</p>
          <Field label="Currency symbol">
            <input name="currency" defaultValue={s.currency} className="input" />
          </Field>
          <Field label="Free shipping over">
            <input name="freeShippingThreshold" inputMode="decimal" defaultValue={decimal(s.freeShippingThreshold)} className="input" />
          </Field>
          <Field label="Standard shipping fee">
            <input name="shippingFee" inputMode="decimal" defaultValue={decimal(s.shippingFee)} className="input" />
          </Field>
          <Field label="Frame add-on price">
            <input name="framePrice" inputMode="decimal" defaultValue={decimal(s.framePrice)} className="input" />
          </Field>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-2">
          <p className="font-semibold sm:col-span-2">Newsletter offer</p>
          <Field label="Title">
            <input name="newsletterTitle" defaultValue={s.newsletterTitle} className="input" />
          </Field>
          <Field label="Discount code shown after sign-up" hint="Create it under Discounts">
            <input name="newsletterCode" defaultValue={s.newsletterCode} className="input font-mono uppercase" />
          </Field>
          <Field label="Text" className="sm:col-span-2">
            <input name="newsletterText" defaultValue={s.newsletterText} className="input" />
          </Field>
        </Card>

        <Card className="grid gap-4 sm:grid-cols-2">
          <p className="font-semibold sm:col-span-2">Contact & social</p>
          <Field label="Email">
            <input name="contactEmail" type="email" defaultValue={s.contactEmail} className="input" />
          </Field>
          <Field label="Phone">
            <input name="contactPhone" defaultValue={s.contactPhone} className="input" />
          </Field>
          <Field label="Instagram URL">
            <input name="instagram" defaultValue={s.instagram} className="input" />
          </Field>
          <Field label="Facebook URL">
            <input name="facebook" defaultValue={s.facebook} className="input" />
          </Field>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <SubmitButton className="btn btn-primary shadow-lg">Save settings</SubmitButton>
        </div>
      </ActionForm>
    </>
  );
}
