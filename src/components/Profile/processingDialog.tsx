"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle2, Loader2 } from "lucide-react";

interface ProcessingStep {
  id: number;
  name: string;
  description: string;
}

interface CVProcessingDialogProps {
  open: boolean;
  onClose: () => void;
}

const processingSteps: ProcessingStep[] = [
  { id: 1, name: "Uploading CV", description: "Preparing your document for analysis" },
  { id: 2, name: "Extracting Information", description: "Using AI to parse your CV" },
  { id: 3, name: "Organizing Data", description: "Structuring your professional information" },
  { id: 4, name: "Finalizing", description: "Preparing your data for review" }
];

export default function CVProcessingDialog({ open, onClose }: CVProcessingDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const simulateProcessing = async () => {
      setProgress(0);
      setCurrentStep(0);

      for (let i = 0; i < processingSteps.length; i++) {
        setCurrentStep(i);
        const stepDuration = 1000 + Math.random() * 500;
        const incrementCount = 5;
        const incrementSize = 100 / (processingSteps.length * incrementCount);

        for (let j = 0; j < incrementCount; j++) {
          await new Promise(resolve => setTimeout(resolve, stepDuration / incrementCount));
          setProgress(prev => Math.min(prev + incrementSize, 100));
        }
      }

      setTimeout(() => {
        onClose(); // Automatically close after finishing
      }, 500);
    };

    if (open) {
      simulateProcessing();
    }
  }, [open, onClose]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Processing your CV</DialogTitle>
          <DialogDescription>Please wait while we analyze your document</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            {processingSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors duration-200 ${index === currentStep ? 'bg-muted' : ''
                  }`}
              >
                <div className="mt-1">
                  {index < currentStep ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : index === currentStep ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{step.name}</p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
