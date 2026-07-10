import { useState } from "react";

export function CalculatorApp() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [reset, setReset] = useState(false);

  const inputDigit = (d: string) => {
    if (reset || display === "0") {
      setDisplay(d);
      setReset(false);
    } else {
      setDisplay(display + d);
    }
  };

  const inputDot = () => {
    if (reset) {
      setDisplay("0.");
      setReset(false);
      return;
    }
    if (!display.includes(".")) setDisplay(display + ".");
  };

  const compute = (a: number, b: number, o: string) => {
    switch (o) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const applyOp = (o: string) => {
    const cur = parseFloat(display);
    if (prev !== null && op && !reset) {
      const r = compute(prev, cur, op);
      setDisplay(String(r));
      setPrev(r);
    } else {
      setPrev(cur);
    }
    setOp(o);
    setReset(true);
  };

  const equals = () => {
    if (prev === null || op === null) return;
    const r = compute(prev, parseFloat(display), op);
    setDisplay(String(r));
    setPrev(null);
    setOp(null);
    setReset(true);
  };

  const clear = () => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setReset(false);
  };

  const btn = (label: string, cls = "", onClick?: () => void) => (
    <button
      onClick={onClick}
      className={`rounded-xl bg-white/5 py-4 text-lg font-medium text-white transition hover:bg-white/10 active:scale-95 ${cls}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-window p-4">
      <div className="mb-3 flex flex-1 items-end justify-end overflow-hidden rounded-xl bg-black/40 px-4 py-6">
        <span className="truncate font-mono text-4xl text-white">{display}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {btn("AC", "bg-white/10 text-primary", clear)}
        {btn("±", "bg-white/10", () => setDisplay(String(-parseFloat(display))))}
        {btn("%", "bg-white/10", () => setDisplay(String(parseFloat(display) / 100)))}
        {btn("÷", "bg-primary/70 text-primary-foreground", () => applyOp("÷"))}

        {btn("7", "", () => inputDigit("7"))}
        {btn("8", "", () => inputDigit("8"))}
        {btn("9", "", () => inputDigit("9"))}
        {btn("×", "bg-primary/70 text-primary-foreground", () => applyOp("×"))}

        {btn("4", "", () => inputDigit("4"))}
        {btn("5", "", () => inputDigit("5"))}
        {btn("6", "", () => inputDigit("6"))}
        {btn("−", "bg-primary/70 text-primary-foreground", () => applyOp("−"))}

        {btn("1", "", () => inputDigit("1"))}
        {btn("2", "", () => inputDigit("2"))}
        {btn("3", "", () => inputDigit("3"))}
        {btn("+", "bg-primary/70 text-primary-foreground", () => applyOp("+"))}

        {btn("0", "col-span-2", () => inputDigit("0"))}
        {btn(".", "", inputDot)}
        {btn("=", "bg-primary text-primary-foreground", equals)}
      </div>
    </div>
  );
}
