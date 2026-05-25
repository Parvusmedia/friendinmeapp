"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import styles from "./dog-photo.module.css";
import { DOG_PHOTO_OBJECT_POSITION } from "./DogPhoto";
import { resolveMediaUrl } from "@/lib/media-url";

type Props = {
  urls: string[];
  name: string;
  /** En ficha de perro: imagen al lado del texto en desktop */
  layout?: "default" | "side";
};

export function DogPhotoGallery({ urls, name, layout = "default" }: Props) {
  const galleryClass =
    layout === "side" ? `${styles.gallery} ${styles.gallerySideLayout}` : styles.gallery;
  const list = urls.filter(Boolean);
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const current = list[index] ?? null;
  const currentSrc = current ? resolveMediaUrl(current) : null;

  const go = useCallback(
    (delta: number) => {
      if (list.length < 2) return;
      setIndex((i) => (i + delta + list.length) % list.length);
    },
    [list.length]
  );

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, go]);

  if (!list.length) {
    return (
      <div className={galleryClass}>
        <div className={styles.galleryMain}>
          <div className={styles.dogPhotoEmpty} style={{ minHeight: 280 }} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={galleryClass}>
        <button
          type="button"
          className={styles.galleryMain}
          onClick={() => setLightbox(true)}
          aria-label={`Ampliar foto de ${name}`}
        >
          <div className={styles.galleryMainFrame}>
            {currentSrc ? (
              <Image
                src={currentSrc}
                alt={name}
                fill
                className={styles.galleryMainImg}
                sizes="(max-width: 900px) 100vw, 50vw"
                unoptimized
              />
            ) : null}
          </div>
          <span className={styles.galleryHint}>Clic para ampliar</span>
        </button>
        {list.length > 1 ? (
          <div className={styles.thumbs} role="tablist" aria-label="Fotos del perro">
            {list.map((url, i) => (
              <button
                key={url}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={`${styles.thumbBtn} ${i === index ? styles.thumbBtnActive : ""}`}
                onClick={() => setIndex(i)}
              >
                <Image
                  src={resolveMediaUrl(url)}
                  alt=""
                  fill
                  className={styles.thumbImg}
                  style={{ objectPosition: DOG_PHOTO_OBJECT_POSITION }}
                  sizes="72px"
                  unoptimized
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {lightbox && currentSrc ? (
        <div
          className={styles.lightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Fotos de ${name}`}
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            className={`btn btn-secondary ${styles.lightboxClose}`}
            onClick={() => setLightbox(false)}
          >
            Cerrar
          </button>
          {list.length > 1 ? (
            <>
              <button
                type="button"
                className={`btn btn-secondary ${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(e) => {
                  e.stopPropagation();
                  go(-1);
                }}
                aria-label="Foto anterior"
              >
                ‹
              </button>
              <button
                type="button"
                className={`btn btn-secondary ${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => {
                  e.stopPropagation();
                  go(1);
                }}
                aria-label="Foto siguiente"
              >
                ›
              </button>
            </>
          ) : null}
          <div className={styles.lightboxFrame} onClick={(e) => e.stopPropagation()}>
            <Image
              src={currentSrc}
              alt={name}
              fill
              className={styles.lightboxImg}
              sizes="96vw"
              unoptimized
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
