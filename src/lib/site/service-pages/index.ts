import { androidAppDevelopmentPage } from "@/lib/site/service-pages/android-app-development";
import { awsServicesPage } from "@/lib/site/service-pages/aws-services";
import { cloudflareIntegrationPage } from "@/lib/site/service-pages/cloudflare-integration";
import { digitalMarketingPage } from "@/lib/site/service-pages/digital-marketing";
import { erpSolutionsPage } from "@/lib/site/service-pages/erp-solutions";
import { facebookAdsPage } from "@/lib/site/service-pages/facebook-ads";
import { fullStackDevelopmentPage } from "@/lib/site/service-pages/full-stack-development";
import { googleAdsPage } from "@/lib/site/service-pages/google-ads";
import { graphicDesigningPage } from "@/lib/site/service-pages/graphic-designing";
import { iosAppDevelopmentPage } from "@/lib/site/service-pages/ios-app-development";
import { linkedinAdsPage } from "@/lib/site/service-pages/linkedin-ads";
import { magentoDevelopmentPage } from "@/lib/site/service-pages/magento-development";
import { migrationServicesPage } from "@/lib/site/service-pages/migration-services";
import { paymentIntegrationPage } from "@/lib/site/service-pages/payment-integration";
import { seoAiOptimizationPage } from "@/lib/site/service-pages/seo-ai-optimization";
import { shopifyDevelopmentPage } from "@/lib/site/service-pages/shopify-development";
import { socialMediaMarketingPage } from "@/lib/site/service-pages/social-media-marketing";
import { uiUxDesignPage } from "@/lib/site/service-pages/ui-ux-design";
import { videoEditingPage } from "@/lib/site/service-pages/video-editing";
import { virtualAssistantPage } from "@/lib/site/service-pages/virtual-assistant";
import { woocommerceDevelopmentPage } from "@/lib/site/service-pages/woocommerce-development";
import { wordpressDevelopmentPage } from "@/lib/site/service-pages/wordpress-development";
import type { StaticServicePage } from "@/lib/site/service-pages/types";

export const staticServicePages: Record<string, StaticServicePage> = {
  [wordpressDevelopmentPage.slug]: wordpressDevelopmentPage,
  [shopifyDevelopmentPage.slug]: shopifyDevelopmentPage,
  [magentoDevelopmentPage.slug]: magentoDevelopmentPage,
  [woocommerceDevelopmentPage.slug]: woocommerceDevelopmentPage,
  [fullStackDevelopmentPage.slug]: fullStackDevelopmentPage,
  [migrationServicesPage.slug]: migrationServicesPage,
  [iosAppDevelopmentPage.slug]: iosAppDevelopmentPage,
  [androidAppDevelopmentPage.slug]: androidAppDevelopmentPage,
  [erpSolutionsPage.slug]: erpSolutionsPage,
  [awsServicesPage.slug]: awsServicesPage,
  [cloudflareIntegrationPage.slug]: cloudflareIntegrationPage,
  [paymentIntegrationPage.slug]: paymentIntegrationPage,
  [digitalMarketingPage.slug]: digitalMarketingPage,
  [virtualAssistantPage.slug]: virtualAssistantPage,
  [socialMediaMarketingPage.slug]: socialMediaMarketingPage,
  [googleAdsPage.slug]: googleAdsPage,
  [facebookAdsPage.slug]: facebookAdsPage,
  [linkedinAdsPage.slug]: linkedinAdsPage,
  [uiUxDesignPage.slug]: uiUxDesignPage,
  [graphicDesigningPage.slug]: graphicDesigningPage,
  [seoAiOptimizationPage.slug]: seoAiOptimizationPage,
  [videoEditingPage.slug]: videoEditingPage,
};

export function getStaticServicePage(
  slug: string,
): StaticServicePage | undefined {
  return staticServicePages[slug];
}

export const staticServiceSlugs = Object.keys(staticServicePages);
