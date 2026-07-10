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
      const res = await uploadImages(productId, fd);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-semibold text-[#f3f1fa]">Fotos</h2>
        <p className="mt-1 text-sm text-[#a39ec0]">
          La <strong>principal</strong> es la que se ve en el catálogo. JPG, PNG, WEBP o AVIF, hasta 8 MB.
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
            ? "border-[#8b5cf6] bg-[#1b1730] text-[#f3f1fa]"
            : "border-[#2c2647] text-[#a39ec0] hover:border-[#8b5cf6]"
        }`}
      >
        {pending ? (
          "Subiendo..."
        ) : (
          <>
            Arrastrá las fotos acá o <span className="text-[#a78bfa]">hacé click para elegir</span>
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

      {error && <p className="text-sm text-[#ff8a8a]">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.id}
              className={`group relative aspect-square overflow-hidden rounded-xl border-2 ${
                img.isPrimary ? "border-[#8b5cf6]" : "border-[#2c2647]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="size-full bg-[#0e0c18] object-cover" />

              {img.isPrimary && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] px-2 py-0.5 text-[10px] font-bold text-white">
                  Principal
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/80 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                {!img.isPrimary && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => startTransition(() => setPrimaryImage(img.id).then(() => {}))}
                    className="flex-1 rounded-md bg-[#1b1730]/90 py-1 text-[10px] text-white hover:bg-[#6d28d9]"
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
                  className="flex-1 rounded-md bg-[#1b1730]/90 py-1 text-[10px] text-[#ff8a8a] hover:bg-[#ff6b6b]/30"
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
