import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster as HotToaster } from "react-hot-toast";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { ScrollToHash } from "@/components/ui/hashScroll";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 5 * 60 * 1000, // 5 minutes
			retry: 1,
		},
	},
});

const App = () => {
	useEffect(() => {
		const fetchApi = async () => {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/`, {
					method: "GET",
				});
				const data = await response.json();
				console.log("API response:", data);
			} catch (err) {
				console.error("API fetch failed:", err);
			}
		};

		fetchApi(); // call inside effect
	}, []);

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<TooltipProvider>
					<BrowserRouter>
						<div className="min-h-screen bg-background">
							<Navbar />
							<main className="pt-16">
								<ScrollToHash />
								<Routes>
									<Route
										path="/"
										element={<Home />}
									/>
									<Route
										path="/login"
										element={<Login />}
									/>
									<Route
										path="/signup"
										element={<Signup />}
									/>
									<Route
										path="/dashboard"
										element={
											<ProtectedRoute>
												<Dashboard />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/quiz"
										element={
											<ProtectedRoute>
												<Quiz />
											</ProtectedRoute>
										}
									/>
									<Route
										path="/profile"
										element={
											<ProtectedRoute>
												<Profile />
											</ProtectedRoute>
										}
									/>
									<Route
										path="*"
										element={<NotFound />}
									/>
								</Routes>
							</main>
						</div>
						<Toaster />
						<Sonner />
						<HotToaster
							position="top-right"
							toastOptions={{
								style: {
									background: "hsl(var(--card))",
									color: "hsl(var(--card-foreground))",
									border: "1px solid hsl(var(--border))",
								},
							}}
						/>
					</BrowserRouter>
				</TooltipProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
};

export default App;
