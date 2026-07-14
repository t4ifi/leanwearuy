"use client";

import { useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui";
import { uploadImages, deleteImage, setPrimaryImage } from "./image-actions";

export type ImageItem = { id: string; url: string; isPrimary: boolean };

export function ImageManager({
  productId,
  images,
}: {
  productId: string;
  images: ImageItem[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function subir(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("files", f);

    startTransition(async () => {
      try {
        const res = await uploadImages(productId, fd);
        if (res?.error) setError(res.error);
      } catch {
        // Si el servidor rechaza el cuerpo (foto muy grande) la acción falla
        // antes de correr: mostramos un mensaje en vez de romper la página.
        setError("No se pudo subir la imagen. Suele ser porque pesa demasiado (máx. ~4 MB); probá con una más liviana.");
      }
    });
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold text-ink">Fotos</h2>
        <p className="mt-1 text-sm text-muted">
          La <strong>principal</strong> es la que se ve en el catálogo. JPG, PNG, WEBP o AVIF, hasta 4 MB.
        </p>
      </div>

      {/* Zona de arrastrar y soltar */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          subir(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center text-sm transition ${
          dragging
            ? "border-purple bg-panel-2 text-ink"
            : "border-line-2 text-muted hover:border-purple"
        }`}
      >
        {pending ? (
          "Subiendo..."
        ) : (
          <>
            Arrastrá las fotos acá o <span className="text-purple-2">hacé click para elegir</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          hidden
          onChange={(e) => {
            subir(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.id}
              className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                img.isPrimary ? "border-purple" : "border-line-2"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="size-full bg-bg-elev object-cover" />

              {img.isPrimary && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-gradient-to-br from-purple-2 to-purple-3 px-2 py-0.5 text-[10px] font-bold text-white">
                  Principal
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => setPrimaryImage(img.id).then(() => {}))}
                    className="flex-1 rounded-md bg-panel-2/90 py-1 text-[10px] text-white hover:bg-purple-3"
                  >
                    ★ Principal
                  </button>
                )}
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm("¿Borrar esta foto?")) return;
                    startTransition(() => deleteImage(img.id).then(() => {}));
                  }}
                  className="flex-1 rounded-md bg-panel-2/90 py-1 text-[10px] text-danger hover:bg-danger/30"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
