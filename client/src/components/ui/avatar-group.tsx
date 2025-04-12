import * as React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  items: {
    image?: string
    name: string
  }[]
  limit?: number
}

export function AvatarGroup({
  items,
  limit = 3,
  className,
  ...props
}: AvatarGroupProps) {
  const itemsToShow = items.slice(0, limit)
  const remainingCount = Math.max(items.length - limit, 0)

  return (
    <div
      className={cn("flex items-center justify-start -space-x-2", className)}
      {...props}
    >
      {itemsToShow.map((item, index) => (
        <Avatar
          key={index}
          className="border-2 border-background"
        >
          {item.image ? (
            <AvatarImage src={item.image} alt={item.name} />
          ) : null}
          <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 ? (
        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium text-muted-foreground">
          +{remainingCount}
        </div>
      ) : null}
    </div>
  )
}
