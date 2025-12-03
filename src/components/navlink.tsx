import { NAV_LINK_IDENTIFIER_CLASSNAME } from "./navlinks";
import { useState, useLayoutEffect } from "react";

interface Link {
  text: string;
  href: string;
}

function useNavLinks() {
  const [links, setLinks] = useState<Link[]>([]);

  useLayoutEffect(() => {
    const nodeList = document.querySelectorAll<HTMLAnchorElement>(
      `.${NAV_LINK_IDENTIFIER_CLASSNAME}`,
    );
    const elements = Array.from(nodeList);
    setLinks(
      elements.map((el) => {
        return {
          href: el.dataset.href as string,
          text: el.dataset.title as string,
        };
      }),
    );
  }, []);

  return links;
}

export function NavLinks({ title }: { title: string }) {
  const links = useNavLinks();

  return (
    <div
      className={
        "md:sticky top-30 left-10 h-fit max-w-[200px] text-xs text-gray-400"
      }>
      <div>{title}</div>
      <ul>
        {links.map((l) => (
          <li key={l.href}>
            <a href={`#${l.href}`}>{l.text}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
