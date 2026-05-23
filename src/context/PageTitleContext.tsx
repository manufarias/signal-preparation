import { createContext, useContext, useState } from "react";

interface PageTitleContextValue {
  pageTitle: string | undefined;
  setPageTitle: (title: string | undefined) => void;
}

const PageTitleContext = createContext<PageTitleContextValue>({
  pageTitle: undefined,
  setPageTitle: () => {},
});

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [pageTitle, setPageTitle] = useState<string | undefined>(undefined);
  return (
    <PageTitleContext.Provider value={{ pageTitle, setPageTitle }}>
      {children}
    </PageTitleContext.Provider>
  );
}

export function usePageTitle() {
  return useContext(PageTitleContext);
}
