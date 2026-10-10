import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AutentiqueTela from "./AutentiqueTela.jsx";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AutentiqueTela />
    </QueryClientProvider>
  );
}
