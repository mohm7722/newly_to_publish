import { Label, clx } from "@modules/common/components/ui"
import React, { useEffect, useImperativeHandle, useState } from "react"

import Eye from "@modules/common/icons/eye"
import EyeOff from "@modules/common/icons/eye-off"

type InputProps = Omit<
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  "placeholder"
> & {
  label: string
  errors?: Record<string, unknown>
  touched?: Record<string, unknown>
  name: string
  topLabel?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type,
      name,
      label,
      touched: _touched,
      required,
      topLabel,
      id,
      className,
      dir,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [inputType, setInputType] = useState(type)
    const inputId = id || name
    const textDirection = dir ?? (type === "email" || type === "tel" ? "ltr" : undefined)

    useEffect(() => {
      if (type === "password") {
        setInputType(showPassword ? "text" : "password")
      } else {
        setInputType(type)
      }
    }, [type, showPassword])

    useImperativeHandle(ref, () => inputRef.current!)

    return (
      <div className="flex w-full flex-col">
        {topLabel && (
          <Label htmlFor={inputId} className="mb-2 txt-compact-medium-plus">
            {topLabel}
          </Label>
        )}
        <div className="relative z-0 flex w-full txt-compact-medium">
          <input
            id={inputId}
            type={inputType}
            name={name}
            dir={textDirection}
            placeholder=" "
            required={required}
            className={clx(
              "peer mt-0 block h-14 w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 pb-1 pt-5 text-base shadow-sm transition placeholder:text-transparent hover:border-[#67285A]/30 focus:border-[#67285A] focus:outline-none focus:ring-2 focus:ring-[#67285A]/10",
              type === "password" && "pl-12",
              className
            )}
            {...props}
            ref={inputRef}
          />
          <label
            htmlFor={inputId}
            className="pointer-events-none absolute right-0 top-4 mx-3 flex origin-right items-center bg-white px-1 text-gray-500 transition-all duration-200 peer-focus:text-[#67285A]"
          >
            {label}
            {required && <span className="mr-0.5 text-rose-500">*</span>}
          </label>
          {type === "password" && (
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute left-0 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-gray-400 transition hover:text-[#67285A] focus:outline-none focus:ring-2 focus:ring-[#67285A]/20"
              aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              aria-pressed={showPassword}
            >
              {showPassword ? <Eye /> : <EyeOff />}
            </button>
          )}
        </div>
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
