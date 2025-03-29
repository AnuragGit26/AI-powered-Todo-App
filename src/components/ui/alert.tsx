import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react"

const alertVariants = cva(
    "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
    {
        variants: {
            variant: {
                default: "bg-background text-foreground",
                destructive:
                    "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
                success:
                    "border-green-500/50 text-green-700 dark:text-green-400 dark:border-green-500/30 bg-green-50 dark:bg-green-950/30 [&>svg]:text-green-500",
                info:
                    "border-blue-500/50 text-blue-700 dark:text-blue-400 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 [&>svg]:text-blue-500",
                warning:
                    "border-yellow-500/50 text-yellow-700 dark:text-yellow-400 dark:border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/30 [&>svg]:text-yellow-500",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

const Alert = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> & {
        icon?: React.ReactNode
    }
>(({ className, variant, icon, children, ...props }, ref) => {
    let IconComponent = null

    if (!icon) {
        if (variant === "destructive") {
            IconComponent = <XCircle className="h-4 w-4" />
        } else if (variant === "success") {
            IconComponent = <CheckCircle2 className="h-4 w-4" />
        } else if (variant === "info") {
            IconComponent = <Info className="h-4 w-4" />
        } else if (variant === "warning") {
            IconComponent = <AlertCircle className="h-4 w-4" />
        }
    }

    return (
        <div
            ref={ref}
            role="alert"
            className={cn(alertVariants({ variant }), className)}
            {...props}
        >
            {icon || IconComponent}
            {children}
        </div>
    )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn("mb-1 font-medium leading-none tracking-tight", className)}
        {...props}
    />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
    HTMLParagraphElement,
    React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm [&_p]:leading-relaxed", className)}
        {...props}
    />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription } 