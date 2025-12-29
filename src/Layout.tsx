import type { PropsWithChildren } from "react";
import { NavLinks } from "./components/navlink";
import { NavLink } from "./components/navlinks";
import { Flex } from "./components/ui/flex";

interface FooterLink {
  text: string;
  link?: string;
}

interface PageProps {
  title: string;
  subtitle?: string;
  footer?: FooterLink[];
}

export default function Layout({
  children,
  title,
  subtitle,
  footer = [],
}: PropsWithChildren<PageProps>) {
  return (
    <Flex col>
      <header>
        <div className="flex flex-col items-center justify-center gap-2">
          <h3>{title}</h3>
        </div>
      </header>
      {/* <main className="min-h-screen flex flex-col md:grid md:grid-cols-[auto_1fr] md:grid-rows-1 gap-12 max-w-[1000px] m-auto items-center justify-center"> */}
      <main className="min-h-screen flex flex-col gap-12 max-w-[1000px] m-auto items-center justify-center">
        {/* <NavLinks title="Információk:" /> */}
        <div className="flex flex-col gap-12">
          {/* {subtitle ? (
            <div className="text-gray-500 flex flex-col gap-2">
              <span>{subtitle}</span>
            </div>
          ) : null} */}
          <div className="w-full px-12">{children}</div>
        </div>
      </main>
      <footer>
        <div className="flex flex-col items-start gap-1">
          {footer.map((item) => {
            if (item.link) {
              return (
                <NavLink key={item.link} link={item.link}>
                  {item.text}
                </NavLink>
              );
            }
            return <div key={item.text}>{item.text}</div>;
          })}
        </div>
      </footer>
    </Flex>
  );
}
