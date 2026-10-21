import Link from "next/link";
import { getAbout, getTrust, toBlocks } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import { whatsappLink } from "@/lib/whatsapp";

export async function generateMetadata() {
  return { title: getAbout(await getSettings()).title };
}

export default async function AboutPage() {
  const settings = await getSettings();
  const about = getAbout(settings);

  return (
    <div className="container-x py-16">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-accent">About {settings.storeName}</p>
          <h1 className="mt-3 font-serif text-5xl leading-tight">{about.title}</h1>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink/80">
            {toBlocks(about.text).map((b, i) =>
              b.type === "h" ? (
                <h2 key={i} className="pt-2 font-serif text-2xl text-ink">
                  {b.text}
                </h2>
              ) : (
                <p key={i} className="whitespace-pre-line">
                  {b.text}
                </p>
              )
            )}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-accent">
              প্রিন্ট দেখুন
            </Link>
            {settings.whatsappNumber && (
              <a href={whatsappLink(settings.whatsappNumber, "আসসালামু আলাইকুম!")} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                WhatsApp-এ কথা বলুন
              </a>
            )}
          </div>
        </div>
        <div className="flex justify-center rounded-[2rem] bg-gradient-to-b from-[#e9dfd0] to-[#dccdb8] p-[12%]">
          <div className="framed framed-oak w-full max-w-sm">
            <img src={about.image} alt={settings.storeName} className="aspect-[3/4] w-full object-cover" />
          </div>
        </div>
      </div>
      <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {getTrust(settings).map((t) => (
          <div key={t.title} className="rounded-2xl border border-line bg-white p-6">
            <p className="font-semibold">{t.title}</p>
            <p className="mt-1 text-muted">{t.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
