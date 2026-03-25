type StepperProps = {
    currentStep: number
}

export default function Stepper({ currentStep }: StepperProps) {

    const steps = [
        "Choose Federation",
        "Select Note Denomination",
        "Fund the Notes",
        "Download PDF Notes"
    ]

    return (
        <div className="w-full flex justify-center">
            <div className="flex items-start w-full max-w-4xl">

                {steps.map((step, index) => {
                    const stepNumber = index + 1
                    const active = stepNumber === currentStep
                    const completed = stepNumber < currentStep

                    return (
                        <div key={index} className="flex-1 flex flex-col items-center relative mx-1">

                            {/* connector line */}
                            {index !== 0 && (
                                <div
                                    className={`absolute top-4 -left-1/2 w-full h-[2px]
                  ${index < currentStep ? "bg-blue-500" : "bg-gray-300"}
                  `}
                                />
                            )}

                            {/* circle */}
                            <div
                                className={`z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${active || completed
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-200 text-gray-600"
                                    }`}
                            >
                                {stepNumber}
                            </div>

                            <p className="text-xs text-gray-600 text-center mt-2 max-w-[120px]">
                                {step}
                            </p>

                        </div>
                    )
                })}

            </div>
        </div>
    )
}