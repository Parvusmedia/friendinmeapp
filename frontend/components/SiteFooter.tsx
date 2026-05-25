import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="footer-icon" aria-hidden="true">
          🐾
        </div>
        <div>
          <strong className="site-footer-brand">FriendInMe</strong>
          <p>Plataforma en desarrollo — datos orientativos, no sustituyen el criterio del refugio.</p>
          <Link href="/privacidad">Política de privacidad</Link>
        </div>
      </div>
    </footer>
  );
}
