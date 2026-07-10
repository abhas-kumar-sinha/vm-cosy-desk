import { Cpu, MemoryStick, HardDrive } from "lucide-react";

export function AboutApp() {
  return (
    <div className="flex h-full flex-col items-center gap-4 bg-window p-8 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-primary via-accent-purple to-accent-teal text-3xl font-black text-white shadow-2xl">
        L
      </div>
      <div>
        <div className="text-2xl font-bold">LovableOS</div>
        <div className="text-sm text-white/60">1.0 "Aurora"</div>
      </div>
      <div className="mt-2 grid w-full grid-cols-1 gap-2 text-sm">
        <Line icon={Cpu} label="Processor" value="Virtual x86_64 (4 cores)" />
        <Line icon={MemoryStick} label="Memory" value="8.0 GB" />
        <Line icon={HardDrive} label="Storage" value="128 GB" />
      </div>
      <div className="mt-auto text-xs text-white/40">
        A Linux-inspired desktop, built for your browser.
      </div>
    </div>
  );
}

function Line({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-4 py-2">
      <div className="flex items-center gap-2 text-white/70">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <span>{value}</span>
    </div>
  );
}
