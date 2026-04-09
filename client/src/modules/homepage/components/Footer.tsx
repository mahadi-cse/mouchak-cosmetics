import { Mail, MapPin, Phone } from "lucide-react";

import { footerContent, paymentMethods, productCategories, supportLinks } from "./data";

export function Footer() {
  return (
    <footer className="bg-zinc-950 text-zinc-400">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xl font-extrabold text-white">{footerContent.brandName}</p>
          <p className="mb-3 text-[11px] uppercase tracking-[0.2em] text-primary">{footerContent.brandRegion}</p>
          <p className="mb-4 text-sm leading-7">
            {footerContent.brandDescription}
          </p>
          <div className="flex gap-2">
            {footerContent.socialIcons.map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="grid h-9 w-9 place-items-center rounded-md bg-zinc-800 text-zinc-300 transition hover:bg-primary hover:text-white"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold tracking-widest text-white uppercase">{footerContent.sections.products}</h4>
          <ul className="space-y-3 text-sm">
            {productCategories.map((item) => (
              <li key={item}>
                <a href="#" className="transition hover:text-white">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold tracking-widest text-white uppercase">{footerContent.sections.support}</h4>
          <ul className="space-y-3 text-sm">
            {supportLinks.map((item) => (
              <li key={item}>
                <a href="#" className="transition hover:text-white">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-bold tracking-widest text-white uppercase">{footerContent.sections.contact}</h4>
          <div className="space-y-3 text-sm">
            <p className="inline-flex items-center gap-2"><MapPin size={14} className="text-primary" /> {footerContent.contact.address}</p>
            <p className="inline-flex items-center gap-2"><Phone size={14} className="text-primary" /> {footerContent.contact.phone}</p>
            <p className="inline-flex items-center gap-2"><Mail size={14} className="text-primary" /> {footerContent.contact.email}</p>
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs sm:flex-row">
          <p>{footerContent.copyright}</p>
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">{footerContent.paymentLabel}</span>
            {paymentMethods.map((pay) => (
              <span key={pay} className="rounded bg-zinc-800 px-2 py-1 text-zinc-200">{pay}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
