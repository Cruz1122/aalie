"use client";

import { useNavigation } from "@/contexts/NavigationContext";
import PageLoader from "./PageLoader";

interface NavigationLoadingWrapperProps {
  children: React.ReactNode;
}

export default function NavigationLoadingWrapper({ children }: Readonly<NavigationLoadingWrapperProps>) {
  const { isLoading } = useNavigation();
  
  return (
    <>
      {children}
      <PageLoader isLoading={isLoading} />
    </>
  );
}