'use client';

const STEPS = [
  { label: 'Import', description: 'Upload et mapping' },
  { label: 'Review', description: 'Vérification des matchs' },
  { label: 'Export', description: 'Téléchargement' },
];

export function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i < currentStep
                  ? 'bg-blue-600 text-white'
                  : i === currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            <div>
              <div
                className={`text-sm font-medium ${
                  i <= currentStep ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                {step.label}
              </div>
              <div className="text-xs text-gray-400">{step.description}</div>
            </div>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`w-16 h-0.5 mx-3 ${
                i < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
