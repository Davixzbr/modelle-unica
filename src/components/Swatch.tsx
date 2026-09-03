import { colorHex, isLightColor } from "@/lib/colors";

/** Bolinha de cor real (hex) com anel p/ tons claros. */
export default function Swatch({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const hex = colorHex(name);
  const light = isLightColor(name);
  return (
    <span
      aria-hidden
      title={name}
      className={`inline-block h-4 w-4 flex-none rounded-full ring-1 ring-inset ${
        light ? "ring-ink/25" : "ring-ink/10"
      } ${className}`}
      style={{ backgroundColor: hex }}
    />
  );
}
