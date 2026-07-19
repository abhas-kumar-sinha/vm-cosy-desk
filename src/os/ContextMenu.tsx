import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { ChevronRight, Check } from "lucide-react";
import type { ReactNode } from "react";

export const Menu = ContextMenuPrimitive.Root;
export const MenuTrigger = ContextMenuPrimitive.Trigger;

const contentClass =
  "z-[9999] min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-neutral-900/80 p-1 text-sm text-white shadow-2xl backdrop-blur-2xl backdrop-saturate-150 animate-in fade-in-0 zoom-in-95";
const itemClass =
  "flex cursor-default select-none items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-[13px] outline-none data-[highlighted]:bg-white/10 data-[disabled]:opacity-40";

export function MenuContent({ children }: { children: ReactNode }) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content className={contentClass} collisionPadding={8}>
        {children}
      </ContextMenuPrimitive.Content>
    </ContextMenuPrimitive.Portal>
  );
}

export function MenuItem({
  children,
  onSelect,
  disabled,
  shortcut,
  danger,
}: {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  shortcut?: string;
  danger?: boolean;
}) {
  return (
    <ContextMenuPrimitive.Item
      disabled={disabled}
      onSelect={onSelect}
      className={`${itemClass} ${danger ? "text-red-300 data-[highlighted]:bg-red-500/20" : ""}`}
    >
      <span>{children}</span>
      {shortcut && <kbd className="text-[10px] text-white/40">{shortcut}</kbd>}
    </ContextMenuPrimitive.Item>
  );
}

export function MenuSeparator() {
  return <ContextMenuPrimitive.Separator className="my-1 h-px bg-white/8" />;
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <ContextMenuPrimitive.Label className="px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/40">{children}</ContextMenuPrimitive.Label>;
}

export function MenuSub({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <ContextMenuPrimitive.Sub>
      <ContextMenuPrimitive.SubTrigger className={itemClass}>
        <span>{label}</span>
        <ChevronRight className="h-3.5 w-3.5 opacity-60" />
      </ContextMenuPrimitive.SubTrigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.SubContent className={contentClass} sideOffset={4} alignOffset={-4}>
          {children}
        </ContextMenuPrimitive.SubContent>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Sub>
  );
}

export function MenuCheckboxItem({
  checked,
  onSelect,
  children,
}: {
  checked: boolean;
  onSelect?: () => void;
  children: ReactNode;
}) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      checked={checked}
      onSelect={onSelect}
      className={`${itemClass} pl-7`}
    >
      <ContextMenuPrimitive.ItemIndicator className="absolute left-2">
        <Check className="h-3 w-3" />
      </ContextMenuPrimitive.ItemIndicator>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}
