import React from "react";
import { Separator } from "../ui/separator";

const SettingMenuGroup = ({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`flex flex-col w-full h-full ${className}`}>
      <SettingMenuGroupLabel isSeparator>{label}</SettingMenuGroupLabel>
      <div className="flex-1 w-full">{children}</div>
    </div>
  );
};

const SettingMenuGroupLabel = ({
  children,
  isSeparator,
}: {
  children: React.ReactNode;
  isSeparator?: boolean;
}) => {
  return (
    <>
      <h2 className="text-primary">{children}</h2>
      {isSeparator && <Separator className="my-2" />}
    </>
  );
};

const SettingMenuItem = ({
  label,
  description,
  action,
  asChild,
  children,
  className,
  onClick,
  isRealLabel,
  labelHtmlFor,
  labelClassName,
}: {
  label?: string | React.ReactNode;
  description?: string | React.ReactNode;
  action?: React.ReactNode;
  asChild?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isRealLabel?: boolean;
  labelHtmlFor?: string;
  labelClassName?: string;
}) => {
  if (asChild) {
    return (
      <div
        className={`flex items-center justify-between w-full py-1 ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  if (isRealLabel) {
    return (
      <div
        className={`flex items-center justify-between w-full text-sm ${className}`}
      >
        <label
          htmlFor={labelHtmlFor || ""}
          className={`block w-full font-normal cursor-pointer ${labelClassName}`}
          data-test="islabel"
        >
          <div className="max-w-7/10 space-y-0.5">
            {typeof label === "string" ? (
              <p className="text-primary">{label}</p>
            ) : (
              label
            )}
            {description && typeof description === "string" ? (
              <p className="text-[13px] text-neutral-400 leading-4">
                {description}
              </p>
            ) : (
              description
            )}
          </div>
        </label>
        {action && action}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between w-full text-sm py-1 ${className}`}
      onClick={onClick}
    >
      <div className={`flex-1 ${action && "max-w-7/10"}`}>
        {label && typeof label === "string" ? (
          <p className="text-primary font-normal">{label}</p>
        ) : (
          label
        )}
        {description && typeof description === "string" ? (
          <p className="text-neutral-400 text-[13px] max-w-full break-all font-normal">
            {description}
          </p>
        ) : (
          description
        )}
      </div>
      {action && action}
    </div>
  );
};

const SettingMenu = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`flex flex-col gap-2 py-3 font-normal ${className}`}>
      {children}
    </div>
  );
};

export {
  SettingMenuGroup,
  SettingMenuGroupLabel,
  SettingMenuItem,
  SettingMenu,
};
