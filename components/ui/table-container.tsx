import { ReactNode } from "react";
import { Card } from "./card";

export function TableContainer({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  return (
    <Card className="overflow-hidden p-0">
      {(title || description) && (
        <div className="border-b border-slate-200 px-6 py-5">
          {title ? (
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
      )}

      <div className="overflow-x-auto">{children}</div>
    </Card>
  );
}