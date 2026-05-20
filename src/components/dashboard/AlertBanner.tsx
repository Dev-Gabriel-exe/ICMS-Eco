// src/components/dashboard/AlertBanner.tsx
import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "warning" | "error" | "info";
  title: string;
  message: string;
}

interface Props {
  alerts: Alert[];
}

export default function AlertBanner({ alerts }: Props) {
  if (alerts.length === 0) return null;

  const configs = {
    warning: {
      bg: "bg-amber-50 border-amber-200",
      icon: AlertTriangle,
      iconColor: "text-amber-600",
      titleColor: "text-amber-900",
      textColor: "text-amber-800",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: AlertTriangle,
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      textColor: "text-red-800",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: Info,
      iconColor: "text-blue-600",
      titleColor: "text-blue-900",
      textColor: "text-blue-800",
    },
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => {
        const cfg = configs[alert.type];
        const Icon = cfg.icon;

        return (
          <div
            key={alert.id}
            className={cn("flex items-start gap-3 p-4 rounded-lg border", cfg.bg)}
          >
            <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", cfg.iconColor)} />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-semibold", cfg.titleColor)}>{alert.title}</p>
              <p className={cn("text-sm mt-0.5", cfg.textColor)}>{alert.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
