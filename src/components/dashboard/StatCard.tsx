import { ElementType } from "react";

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  onClick,
  active,
}: {
  title: string;
  value: string | number;
  icon: ElementType;
  color: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    yellow: "bg-yellow-50 text-yellow-600",
    red: "bg-red-50 text-red-600",
    gray: "bg-gray-50 text-gray-600",
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border p-5 shadow-sm transition-all select-none ${
        onClick ? "cursor-pointer hover:shadow-md hover:bg-gray-50/30" : ""
      } ${
        active
          ? "ring-2 ring-yellow-400 border-yellow-400 shadow-md scale-[1.01]"
          : "border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-600 leading-tight pr-4">{title}</p>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
