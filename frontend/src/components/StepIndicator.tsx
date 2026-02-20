import { Check } from 'lucide-react';

interface StepIndicatorProps {
    currentStep: number;
}

const steps = [
    { num: 1, label: 'Upload' },
    { num: 2, label: 'Style' },
    { num: 3, label: 'Configure' },
    { num: 4, label: 'Edit Script' },
    { num: 5, label: 'Listen' },
];

export function StepIndicator({ currentStep }: StepIndicatorProps) {
    return (
        <div className="flex items-center justify-center w-full mb-12">
            {steps.map((step, index) => {
                const isActive = step.num === currentStep;
                const isPast = step.num < currentStep;

                return (
                    <div key={step.num} className="flex items-center">
                        <div className={`flex flex-col items-center relative z-10 ${isActive ? 'scale-110 transition-transform' : ''}`}>
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                  ${isPast ? 'bg-brand-primary border-brand-primary text-white' : ''}
                  ${isActive ? 'bg-brand-secondary border-brand-secondary text-[#0A0A0F]' : ''}
                  ${!isPast && !isActive ? 'bg-brand-card border-brand-border text-brand-muted' : ''}
                `}
                            >
                                {isPast ? <Check className="w-4 h-4" /> : step.num}
                            </div>
                            <span className={`absolute top-10 text-xs font-medium whitespace-nowrap
                ${isActive ? 'text-brand-secondary' : isPast ? 'text-brand-primary' : 'text-brand-muted'}
              `}>
                                {step.label}
                            </span>
                        </div>
                        {index < steps.length - 1 && (
                            <div
                                className={`h-[2px] w-12 sm:w-20 lg:w-32 mx-2 transition-colors
                  ${isPast ? 'bg-brand-primary' : 'bg-brand-border'}
                `}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
