"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

/**
 * Galería del producto: foto grande, miniaturas y visor a pantalla completa.
 * En el visor se navega con las flechas o con el teclado (←/→/Esc).
 */
export function Gallery({ images, alt, badge }: { images: string[]; alt: string; badge: string }) {
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);

  const move = useCallback(
    (delta: number) => setIndex((i) => (i + delta + images.length) % images.length),
    [images.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, move]);

  if (images.length === 0) {
    return <div className="grid aspect-square place-items-center rounded-2xl bg-bg-elev text-purple">◆</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={() => setOpen(true)}
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-2xl border border-line bg-bg-elev"
      >
        <Image
          src={images[index]}
          alt={alt}
          fill
          priority
          sizes="(max-width: 900px) 100vw, 45vw"
          className="object-contain"
        />
        <span className="absolute left-3.5 top-3.5 rounded-full border border-line-2 bg-bg/80 px-3 py-1 text-xs font-semibold text-purple-2 backdrop-blur">
          {badge}
        </span>
      </button>

      {images.length > 1 && (
        <div className="flex flex-wrap gap-2.5">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setIndex(i)}
              className={`relative size-[70px] overflow-hidden rounded-xl border-2 transition ${
                i === index ? "border-purple opacity-100" : "border-transparent opacity-65 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="70px" className="bg-bg-elev object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <div
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          className="fixed inset-0 z-[130] grid place-items-center bg-black/92 p-8 backdrop-blur-sm"
        >
          <button
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="absolute right-5 top-5 grid size-11 place-items-center rounded-full border border-line-2 bg-panel-2/80 text-white hover:bg-purple-3"
          >
            ✕
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={() => move(-1)}
                aria-label="Anterior"
                className="absolute left-5 grid size-12 place-items-center rounded-full border border-line-2 bg-panel-2/80 text-2xl text-white hover:bg-purple-3"
              >
                ‹
              </button>
              <button
                onClick={() => move(1)}
                aria-label="Siguiente"
                className="absolute right-5 grid size-12 place-items-center rounded-full border border-line-2 bg-panel-2/80 text-2xl text-white hover:bg-purple-3"
              >
                ›
              </button>
            </>
          )}

          <div className="relative size-full">
            <Image src={images[index]} alt={alt} fill sizes="92vw" className="object-contain" />
          </div>

          <span className="absolute bottom-6 rounded-full border border-line-2 bg-panel-2/80 px-3.5 py-1.5 text-sm text-muted">
            {index + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
}
