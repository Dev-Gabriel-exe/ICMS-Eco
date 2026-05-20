// src/app/(dashboard)/municipio/[municipioId]/checklist/page.tsx
import { notFound, redirect } from "next/navigation";
import type { ChecklistItem, Criteria } from "@/types";
import { CheckCircle2, AlertTriangle, Circle, ChevronRight } from "lucide-react";

export const metadata = { title: "Checklist" };

export default async function ChecklistOverviewPage({
  params,
}: {
  params: { municipioId: string };
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { municipioId } = params;

  const [municipality, activeCertame, criteria] = await Promise.all([
    db.municipality.findUnique({ where: { id: municipioId } }),
    db.certame.findFirst({ where: { isActive: true }, orderBy: { year: "desc" } }),
    db.criteria.findMany({ orderBy: { id: "asc" } }),
  ]);

  if (!municipality) notFound();

  if (!activeCertame) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-surface-900 mb-4">Checklist — {municipality.name}</h1>
        <div className="card p-8 text-center text-surface-400">
          Nenhum certame ativo. Aguarde o administrador.
        </div>
      </div>
    );
  }

  const items = await db.checklistItem.findMany({
    where: { municipalityId: municipioId, certameId: activeCertame.id },
    include: { criteria: true, evidences: true },
  });

  const score = calculateMunicipalityScore(
    municipioId,
    activeCertame.id,
    criteria as unknown as Criteria[],
    items as unknown as ChecklistItem[],
    municipality.population
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-surface-900">Checklist — {municipality.name}</h1>
        <p className="text-sm text-surface-500 mt-0.5">
          Certame {activeCertame.year} · {score.criteriaMet} de 9 critérios atingidos
        </p>
      </div>

      <div className="space-y-2">
        {score.axes.map((axis) => {
          const axisItems = items.filter((i) => i.criteria.axis === axis.axis);
          const complete = axisItems.filter((i) => i.status === "complete").length;
          const total = criteria.filter((c) => c.axis === axis.axis).length;

          return (
            <Link
              key={axis.axis}
              href={`/municipio/${municipioId}/checklist/${axis.axis}`}
              className="card flex items-center gap-4 px-5 py-4 hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0
                ${axis.criteriaMet ? "bg-green-100 text-green-700" : "bg-surface-100 text-surface-600"}`}>
                {axis.axis}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-medium text-surface-800 truncate">{axis.axisName}</span>
                  <span className={`text-sm font-bold ml-2 shrink-0
                    ${axis.criteriaMet ? "text-green-700" : axis.points >= 25 ? "text-amber-700" : "text-red-600"}`}>
                    {axis.points} pts
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500
                        ${axis.criteriaMet ? "bg-green-500" : axis.progress >= 25 ? "bg-amber-500" : "bg-red-400"}`}
                      style={{ width: `${axis.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-surface-400 shrink-0">
                    {complete}/{total} itens · mín 50 pts
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {axis.criteriaMet ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : axis.points > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <Circle className="w-4 h-4 text-surface-300" />
                )}
                <ChevronRight className="w-4 h-4 text-surface-300" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
