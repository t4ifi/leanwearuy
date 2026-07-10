import Link from "next/link";
import { IconInstagram } from "./icons";

export function Footer({ instagram }: { instagram: string }) {
  const perfil = `https://instagram.com/${instagram}`;
  const dm = `https://ig.me/m/${instagram}`;

  return (
    <>
      <footer className="mt-16 border-t border-line bg-bg-elev">
        <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="font-head text-xl font-extrabold">
              Lean
              <span className="bg-gradient-to-r from-pink to-purple bg-clip-text text-transparent">
                Wear
              </span>
            </span>
            <p className="mt-3 max-w-xs text-sm text-muted">
              Importación de ropa y calzado. Encargues y stock disponible, atención directa por
              Instagram.
            </p>
          </div>

          <FooterCol title="Explorar">
            <FooterLink href="/">Encargues</FooterLink>
            <FooterLink href="/stock">Stock disponible</FooterLink>
            <FooterLink href="/como-comprar">Cómo comprar</FooterLink>
          </FooterCol>

          <FooterCol title="Seguinos">
            <a href={perfil} target="_blank" rel="noopener" className="text-sm text-purple-2 hover:text-ink">
              Instagram
            </a>
            <a href={dm} target="_blank" rel="noopener" className="text-sm text-muted hover:text-ink">
              Mensaje directo
            </a>
          </FooterCol>

          <FooterCol title="Legal">
            <FooterLink href="/como-comprar">Cómo comprar</FooterLink>
            <span className="text-sm text-faint">Términos y privacidad</span>
          </FooterCol>
        </div>

        <div className="border-t border-line">
          <div className="mx-auto max-w-[1500px] px-5 py-4">
            <p className="text-sm text-faint">
              © {new Date().getFullYear()} LeanWear · Importación de indumentaria
            </p>
          </div>
        </div>
      </footer>

      {/* Botón flotante de Instagram */}
      <a
        href={dm}
        target="_blank"
        rel="noopener"
        aria-label="Escribinos por Instagram"
        className="fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-2xl text-white shadow-lg transition hover:scale-105"
        style={{
          background:
            "linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
        }}
      >
        <IconInstagram className="size-7" />
      </a>
    </>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-3.5 text-xs font-semibold uppercase tracking-widest text-faint">{title}</h4>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-muted transition hover:text-ink">
      {children}
    </Link>
  );
}
