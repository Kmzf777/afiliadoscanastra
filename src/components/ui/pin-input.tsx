"use client";

import { PinInput } from "@ark-ui/react/pin-input";

export default function PinInputComponent() {
  return (
    <div className="flex items-center justify-center min-h-32">
      <div className="w-80">
        <PinInput.Root onValueComplete={(e) => console.log(e.valueAsString)}>
          <PinInput.Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Digite seu código PIN
          </PinInput.Label>
          <PinInput.Control className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((_, index) => (
              <PinInput.Input
                key={index}
                index={index}
                className="w-12 h-12 text-center text-lg font-medium border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-primary-500/50 dark:focus:ring-primary-400/50 focus:border-primary-500 dark:focus:border-primary-400 transition-all"
              />
            ))}
          </PinInput.Control>
          <PinInput.HiddenInput />
        </PinInput.Root>
      </div>
    </div>
  );
}