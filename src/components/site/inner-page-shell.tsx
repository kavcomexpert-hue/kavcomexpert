import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { JsonLd } from "@/components/seo/json-ld";
import { buildBreadcrumbListSchema } from "@/lib/schema/breadcrumbs";
import type { BreadcrumbItem } from "@/lib/schema/breadcrumbs";
import type { ReactNode } from "react";

type InnerPageShellProps = {
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
};

export function InnerPageShell({ breadcrumbs, children }: InnerPageShellProps) {
  return (
    <>
      <JsonLd data={buildBreadcrumbListSchema(breadcrumbs)} />
      <div className="mx-auto max-w-[1120px] px-6 pt-16 md:pt-24">
        <Breadcrumbs items={breadcrumbs} />
      </div>
      {children}
    </>
  );
}
