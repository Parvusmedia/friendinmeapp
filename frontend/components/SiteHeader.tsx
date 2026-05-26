"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hasValidSession } from "@/lib/auth";

const navLinks = [
  { href: "/#perros", label: "Perros" },
  { href: "/cuestionario", label: "Match" },
  { href: "/privacidad", label: "Privacidad" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [panelHref, setPanelHref] = useState("/panel/login");

  useEffect(() => {
    setPanelHref(hasValidSession() ? "/panel/dashboard" : "/panel/login");
  }, [pathname]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="site-logo" onClick={() => setOpen(false)}>
          FriendInMe
        </Link>

        <button
          type="button"
          className="site-menu-btn"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          data-open={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden />
          <span aria-hidden />
          <span aria-hidden />
        </button>

        <nav className="site-nav-desktop" aria-label="Principal">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="site-nav-link">
              {l.label}
            </Link>
          ))}
          <Link href={panelHref} className="btn btn-secondary site-nav-panel-btn">
            Panel
          </Link>
        </nav>
      </div>

      {open ? (
        <div
          id="site-mobile-nav"
          className="site-nav-mobile-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Menú"
        >
          <div className="site-nav-mobile-head">
            <Link href="/" className="site-logo site-logo--sheet" onClick={() => setOpen(false)}>
              FriendInMe
            </Link>
            <button type="button" className="site-nav-close" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
              ✕
            </button>
          </div>
          <nav className="site-nav-mobile-links" aria-label="Principal móvil">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="site-nav-mobile-link">
                {l.label}
              </Link>
            ))}
            <Link href={panelHref} className="btn btn-primary site-nav-mobile-panel">
              Ir al panel
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
