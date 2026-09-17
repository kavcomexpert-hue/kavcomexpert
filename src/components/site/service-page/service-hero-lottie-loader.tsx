import { ServiceHeroLottie } from "@/components/site/service-page/service-hero-lottie";

type ServiceHeroLottieLoaderProps = {
  src: string;
  label: string;
};

/**
 * Hands the R2 Lottie URL to the client player via the same-origin
 * /api/lottie proxy (browser fetch() to R2 is blocked by CORS), so the
 * animation JSON never gets inlined into the RSC payload.
 */
export function ServiceHeroLottieLoader({
  src,
  label,
}: ServiceHeroLottieLoaderProps) {
  return (
    <ServiceHeroLottie
      src={`/api/lottie?src=${encodeURIComponent(src)}`}
      label={label}
    />
  );
}
