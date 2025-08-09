import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import History from "@/pages/history";
import Profile from "@/pages/profile";
import ProfileEdit from "@/pages/profile-edit";
import DemoStores from "@/pages/demo-stores";
import DemoFavoriteStores from "@/pages/demo-favorite-stores";
import StoreDetail from "@/pages/store-detail";
import CoinTransfer from "@/pages/coin-transfer";
import NftCollection from "@/pages/nft-collection";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/history" component={History} />
          <Route path="/profile" component={Profile} />
          <Route path="/profile/edit" component={ProfileEdit} />
          <Route path="/demo-stores" component={DemoStores} />
          <Route path="/store/:id" component={StoreDetail} />
          <Route path="/demo-favorite-stores" component={DemoFavoriteStores} />
          <Route path="/coin-transfer" component={CoinTransfer} />
          <Route path="/nft-collection" component={NftCollection} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
