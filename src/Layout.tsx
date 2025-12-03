import type { PropsWithChildren } from "react";
import { NavLinks } from "./components/navlink";
import { NavLink } from "./components/navlinks";
import { Flex } from "./components/ui/flex";

interface FooterLink {
  text: string;
  link?: string;
}

interface PageProps {
  title?: string;
  subtitle?: string;
  footer?: FooterLink[];
}

export default function Layout({
  children,
  title = "Magyar közlöny értelmező",
  subtitle,
  footer = [],
}: PropsWithChildren<PageProps>) {
  return (
    <Flex col>
      <header>
        <h3>{title}</h3>
        <h4>{subtitle}</h4>
      </header>
      <main className="min-h-screen flex flex-col md:grid md:grid-cols-[auto_1fr] md:grid-rows-1 gap-12">
        <NavLinks title="Információk:" />
        <div className="flex flex-col gap-12">
          <div className="w-full px-12">{children}</div>
          <p>
            A <NavLink>Magyar Közlöny</NavLink> weboldala{" "}
            <a rel="noreferrer" target="href" href="https://magyarkozlony.hu/">
              itt található
            </a>
            .
          </p>
        </div>
      </main>
      <footer>
        {footer.map((item) => {
          if (item.link) {
            return (
              <a href={item.link} rel="nooper" target="_blank">
                {item.text}
              </a>
            );
          }
          return <div>{item.text}</div>;
        })}
        <a
          href="https://github.com/thavixt/fetch-magyar-kozlony"
          rel="nooper"
          target="_blank">
          github
        </a>
      </footer>
    </Flex>
  );
}
