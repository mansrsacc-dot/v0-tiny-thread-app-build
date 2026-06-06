import Link from "next/link";

const STORE = "https://tinythread.lv";

const policyLinks = [
  { href: `${STORE}/policies/privacy-policy`,   label: "Privātuma politika",  labelEn: "Privacy Policy" },
  { href: `${STORE}/policies/refund-policy`,    label: "Atgriešanas politika", labelEn: "Refund Policy" },
  { href: `${STORE}/policies/terms-of-service`, label: "Lietošanas noteikumi", labelEn: "Terms of Service" },
  { href: `${STORE}/policies/shipping-policy`,  label: "Piegādes politika",   labelEn: "Shipping Policy" },
  { href: `/kontakti`,                           label: "Kontakti",            labelEn: "Contact" },
  { href: `${STORE}/pages/legal-notice`,         label: "Juridiskais paziņojums", labelEn: "Legal Notice" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#1e1b18] py-8 px-6 mt-auto">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mb-4">
          {policyLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm text-white/50 hover:text-white/80 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-center text-xs text-white/25">© {new Date().getFullYear()} TinyThread. Visas tiesības aizsargātas.</p>
      </div>
    </footer>
  );
}
