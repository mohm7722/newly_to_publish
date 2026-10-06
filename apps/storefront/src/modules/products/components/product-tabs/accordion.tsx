import { Text, clx } from "@modules/common/components/ui"
import React from "react"

type AccordionItemProps = {
  title: string
  subtitle?: string
  description?: string
  required?: boolean
  tooltip?: string
  forceMountContent?: true
  headingSize?: "small" | "medium" | "large"
  customTrigger?: React.ReactNode
  complete?: boolean
  active?: boolean
  triggerable?: boolean
  children: React.ReactNode
  value?: string
  className?: string
}

type AccordionProps = {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  type?: "single" | "multiple"
  collapsible?: boolean
  className?: string
}

const Accordion: React.FC<AccordionProps> & {
  Item: React.FC<AccordionItemProps>
} = ({ children, ...props }) => {
  return <div className={props.className}>{children}</div>
}

const Item: React.FC<AccordionItemProps> = ({
  title,
  subtitle,
  description,
  children,
  className,
  headingSize = "large",
  customTrigger = undefined,
  forceMountContent = undefined,
  triggerable,
  ...props
}) => {
  return (
    <div
      {...props}
      className={clx(
        "border-grey-20 group border-t last:mb-0 last:border-b",
        "py-3",
        className
      )}
    >
      <div className="px-1">
        <div className="flex flex-col">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <Text className="text-ui-fg-subtle text-sm">{title}</Text>
            </div>
            <div>{customTrigger || <MorphingTrigger />}</div>
          </div>
          {subtitle && (
            <Text as="span" className="mt-1 text-sm">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
      <div className={clx("px-1")}>
        <div className="inter-base-regular">
          {description && <Text>{description}</Text>}
          <div className="w-full">{children}</div>
        </div>
      </div>
    </div>
  )
}

Accordion.Item = Item

const MorphingTrigger = () => {
  return (
    <div className="text-grey-90 hover:bg-grey-5 active:bg-grey-5 active:text-violet-60 focus:border-violet-60 disabled:text-grey-30 bg-transparent disabled:bg-transparent rounded-rounded group relative p-[6px]">
      <div className="h-5 w-5">
        <span className="bg-grey-50 rounded-circle group-radix-state-open:rotate-90 absolute inset-y-[31.75%] left-[48%] right-1/2 w-[1.5px] duration-300" />
        <span className="bg-grey-50 rounded-circle group-radix-state-open:rotate-90 group-radix-state-open:left-1/2 group-radix-state-open:right-1/2 absolute inset-x-[31.75%] top-[48%] bottom-1/2 h-[1.5px] duration-300" />
      </div>
    </div>
  )
}

export default Accordion
