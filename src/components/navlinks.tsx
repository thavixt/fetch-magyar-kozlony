import { cn } from "@/lib/utils";
import { snakeCase } from "@/utils";

export const NAV_LINK_IDENTIFIER_CLASSNAME = `navlink-${crypto.randomUUID().slice(0, 4)}`;

export function NavLink({
  children,
  link,
}: {
  children: string;
  link?: string;
}) {
  return (
    <span
      id={snakeCase(children)}
      className={cn(NAV_LINK_IDENTIFIER_CLASSNAME, "inline-flex")}
      data-title={children}
      data-href={snakeCase(children)}>
      <span className="flex items-center gap-0.5 pl-0.5">
        <a href={`#${snakeCase(children)}`} className="opacity-50">
          #
        </a>
        <a href={link} target="_blank" rel="nooper">
          {children}
        </a>
      </span>
    </span>
  );
}
