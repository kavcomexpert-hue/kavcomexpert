import { PageHeader } from "@/components/admin/page-header";
import { TaxonomyManager } from "@/components/admin/taxonomy-manager";
import { requirePageRoles } from "@/lib/admin/session";
import {
  getAdminCategories,
  getAdminTags,
  getCategoryUsageCounts,
  getTagUsageCounts,
} from "@/lib/queries/taxonomy";

export default async function AdminTaxonomyPage() {
  await requirePageRoles(["admin", "editor"]);

  const [categories, tags, categoryUsage, tagUsage] = await Promise.all([
    getAdminCategories(),
    getAdminTags(),
    getCategoryUsageCounts(),
    getTagUsageCounts(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Taxonomy"
        description="Manage blog categories and tags. Deleting a category moves its posts to Uncategorized."
      />
      <TaxonomyManager
        categories={categories.map((item) => ({
          ...item,
          usageCount: categoryUsage[item.id] ?? 0,
        }))}
        tags={tags.map((item) => ({
          ...item,
          usageCount: tagUsage[item.id] ?? 0,
        }))}
      />
    </div>
  );
}
