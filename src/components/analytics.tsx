import Script from "next/script";

type AnalyticsProps = {
  ga4Id?: string | null;
  clarityId?: string | null;
};

/**
 * GA4 + Microsoft Clarity. Production only. IDs from CMS settings with env fallback.
 */
export function Analytics({ ga4Id, clarityId }: AnalyticsProps) {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const gaId = ga4Id?.trim() || process.env.NEXT_PUBLIC_GA_ID || "";
  const clarity = clarityId?.trim() || process.env.NEXT_PUBLIC_CLARITY_ID || "";

  if (!gaId && !clarity) {
    return null;
  }

  return (
    <>
      {gaId ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="ga4-init" strategy="lazyOnload">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      ) : null}

      {clarity ? (
        <Script id="microsoft-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${clarity}");
          `}
        </Script>
      ) : null}
    </>
  );
}
