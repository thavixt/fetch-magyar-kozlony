import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { Spinner } from "./spinner";

const rand = (opt1: unknown, opt2: unknown) =>
  Math.random() > 0.5 ? opt1 : opt2;

export function Loader({ rows, size }: { rows: number; size?: "md" | "lg" }) {
  return (
    <div className="flex flex-col items-center w-[400px] gap-4">
      <Button variant="secondary" disabled size="sm">
        <Spinner />
        Betöltés...
      </Button>
      <div className="flex flex-col items-start gap-1 w-full">
        {new Array(rows).fill(null).map((_, i) => {
          const h = `${size === "lg" ? "h-8" : "h-4"}`;
          const w = `${rand("w-full", rand("w-1/2", "w-1/3"))}`;
          return <Skeleton key={i} className={`${h} ${w} bg-gray-300`} />;
        })}
      </div>
    </div>
  );
}
