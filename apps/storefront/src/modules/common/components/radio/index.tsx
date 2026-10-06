const Radio = ({
  checked,
  "data-testid": dataTestId,
}: {
  checked: boolean
  "data-testid"?: string
}) => {
  return (
    <span
      aria-hidden="true"
      data-state={checked ? "checked" : "unchecked"}
      className="group relative flex h-5 w-5 items-center justify-center outline-none"
      data-testid={dataTestId || "radio-button"}
    >
      <span className="shadow-borders-base group-hover:shadow-borders-strong-with-shadow bg-ui-bg-base group-data-[state=checked]:bg-ui-bg-interactive group-data-[state=checked]:shadow-borders-interactive flex h-[14px] w-[14px] items-center justify-center rounded-full transition-all">
        {checked && (
          <span className="flex items-center justify-center">
            <span className="bg-ui-bg-base shadow-details-contrast-on-bg-interactive h-1.5 w-1.5 rounded-full" />
          </span>
        )}
      </span>
    </span>
  )
}

export default Radio
