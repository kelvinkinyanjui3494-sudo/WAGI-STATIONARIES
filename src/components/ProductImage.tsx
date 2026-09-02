import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

function resolveImageUrl(src?: string | null) {
  if (!src) return null;

  // Laravel storage URLs may have been saved with different local hosts.
  // Always point local Laravel storage images to the running API server.
  if (
    src.startsWith("http://localhost/storage/") ||
    src.startsWith("http://127.0.0.1/storage/")
  ) {
    return src.replace(
      /^http:\/\/(?:localhost|127\.0\.0\.1)\/storage\//,
      "http://127.0.0.1:8000/storage/",
    );
  }

  return src;
}

/**
 * Product image with lazy loading, a shimmer placeholder and a graceful
 * fallback for products whose real photo has not been uploaded yet.
 */
export function ProductImage({
  src,
  alt,
  className,
  imgClassName,
  priority = false,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const imageUrl = resolveImageUrl(src);
  const hasImage = Boolean(imageUrl) && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      {hasImage ? (
        <>
          {!loaded && <div className="absolute inset-0 skeleton-shimmer" />}

          <img
            src={imageUrl ?? ""}
            alt={alt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={cn(
              "size-full object-contain transition-opacity duration-500",
              loaded ? "opacity-100" : "opacity-0",
              imgClassName,
            )}
          />
        </>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1.5 px-3 text-center">
          <ImageOff className="size-6 text-muted-foreground/60" aria-hidden />

          <span className="text-[0.65rem] font-medium leading-tight text-muted-foreground">
            Photo coming soon
          </span>
        </div>
      )}
    </div>
  );
}