import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl } from "@/lib/media-url";
import styles from "./dog-photo.module.css";

/** Punto de enfoque por defecto para retratos de perros (cara en tercio superior). */
export const DOG_PHOTO_OBJECT_POSITION = "50% 28%";

type DogPhotoProps = {
  src: string | null | undefined;
  alt: string;
  className?: string;
  onClick?: () => void;
  /** Altura del recuadro (por defecto 200px en listado /perros). */
  height?: number;
  /** Si se indica, la miniatura enlaza a la ficha del perro. */
  href?: string;
};

/** Miniatura en listados: recorte tipo cover centrado en la cara. */
export function DogPhotoThumb({ src, alt, onClick, height, href }: DogPhotoProps) {
  const wrapStyle = height != null ? { height: `${height}px` } : undefined;

  const inner =
    src ? (
      <div
        className={styles.dogPhotoThumbWrap}
        style={wrapStyle}
        onClick={onClick}
        role={onClick ? "button" : undefined}
      >
        <Image
          src={resolveMediaUrl(src)}
          alt={alt}
          fill
          className={styles.dogPhoto}
          style={{ objectPosition: DOG_PHOTO_OBJECT_POSITION }}
          sizes="(max-width: 768px) 100vw, 200px"
          unoptimized
        />
      </div>
    ) : (
      <div className={styles.dogPhotoEmpty} style={wrapStyle} aria-hidden />
    );

  if (href) {
    return (
      <Link href={href} className={styles.dogPhotoLink} aria-label={`Ver ficha de ${alt.replace(/^Foto de /i, "")}`}>
        {inner}
      </Link>
    );
  }

  return inner;
}
