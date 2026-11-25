import { Outlet } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 overflow-x-hidden selection:bg-[#FFD700]/30 flex flex-col">
      <Header />
      <main className="flex-1 w-full min-w-0">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
