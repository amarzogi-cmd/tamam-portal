import { Check } from "lucide-react";

interface Step {
  id: string;
  label: string;
  order: number;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
}

export function ProgressStepper({
  steps,
  currentStep,
  completedSteps,
}: ProgressStepperProps) {
  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {/* Progress Bar */}
      <div className="relative">
        <div className="absolute top-5 left-0 right-0 h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = step.id === currentStep;
            const isPast = index < currentStepIndex;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    border-2 transition-all duration-300 z-10
                    ${
                      isCurrent
                        ? "bg-primary border-primary text-primary-foreground shadow-lg scale-110"
                        : isCompleted || isPast
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-background border-border text-muted-foreground"
                    }
                  `}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-bold">{step.order}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    mt-2 text-xs text-center max-w-[80px]
                    ${
                      isCurrent
                        ? "font-bold text-foreground"
                        : isCompleted || isPast
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50"
                    }
                  `}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Text */}
      <div className="text-center mt-4">
        <p className="text-sm text-muted-foreground">
          المرحلة {currentStepIndex + 1} من {steps.length} • {Math.round(progress)}% مكتمل
        </p>
      </div>
    </div>
  );
}
