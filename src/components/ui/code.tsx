import * as React from "react";
import { cn } from "../../lib/utils";

type CodeProps = React.HTMLAttributes<HTMLPreElement>;

export const Code = React.forwardRef<HTMLPreElement, CodeProps>(
    ({ className, ...props }, ref) => {
        return (
            <pre
                ref={ref}
                className={cn(
                    "px-4 py-3 font-mono text-sm bg-neutral-100 dark:bg-neutral-800 rounded-md overflow-auto",
                    className
                )}
                {...props}
            />
        );
    }
);

Code.displayName = "Code"; 