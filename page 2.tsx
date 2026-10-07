import { Suspense } from "react";
import { ReportView } from "@/components/report/report-view";

export default function RelatorioPage() {
  return (
    <Suspense fallback={null}>
      <ReportView />
    </Suspense>
  );
}
