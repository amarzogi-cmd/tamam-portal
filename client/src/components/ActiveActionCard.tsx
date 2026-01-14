import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ActiveActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary";
    disabled?: boolean;
  };
  secondaryButton?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary";
  };
  additionalActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
}

export function ActiveActionCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  actionButton,
  secondaryButton,
  additionalActions,
  progress,
}: ActiveActionCardProps) {
  return (
    <div className="flex justify-center w-full">
      <Card className="w-full max-w-2xl p-8 shadow-lg">
        {/* Header with Icon */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-lg bg-primary/10 ${iconColor}`}>
            <Icon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
            {progress && (
              <p className="text-sm text-muted-foreground mt-1">
                المرحلة {progress.current} من {progress.total} • {progress.percentage}% مكتمل
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {progress && (
          <div className="mb-6">
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {actionButton && (
            <Button
              size="lg"
              variant={actionButton.variant || "default"}
              onClick={actionButton.onClick}
              disabled={actionButton.disabled}
              className="w-full text-lg py-6"
            >
              {actionButton.label}
            </Button>
          )}

          {secondaryButton && (
            <Button
              size="lg"
              variant={secondaryButton.variant || "outline"}
              onClick={secondaryButton.onClick}
              className="w-full"
            >
              {secondaryButton.label}
            </Button>
          )}
        </div>

        {/* Additional Actions */}
        {additionalActions && additionalActions.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              ⚙️ إجراءات إضافية:
            </p>
            <div className="flex flex-wrap gap-2">
              {additionalActions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="ghost"
                  onClick={action.onClick}
                  className="text-sm"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
