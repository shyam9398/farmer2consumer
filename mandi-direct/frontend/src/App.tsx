import React from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { NavigationMapperProvider } from "@/context/NavigationMapperContext";
import { Navbar } from "@/components/layout/Navbar";
import { AppRoutes } from "@/routes/AppRoutes";
import { NavigationMapperOverlay } from "@/components/navigationMapper/NavigationMapperOverlay";
import { FloatingAssistants } from "@/components/navigation/FloatingAssistants";
import { LanguageSelectModal } from "@/components/language/LanguageSelectModal";

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <NavigationMapperProvider>
              <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-emerald-500/20 selection:text-emerald-300">
                <Navbar />
                <main className="flex-1">
                  <AppRoutes />
                </main>
                <NavigationMapperOverlay />
                <FloatingAssistants />
                <LanguageSelectModal />
              </div>
            </NavigationMapperProvider>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
