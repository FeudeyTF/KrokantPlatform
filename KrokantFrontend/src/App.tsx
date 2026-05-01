import { useEffect, useState } from "react";
import { api, setAuthToken } from "./api/client";
import { Dashboard } from "./components/Dashboard";
import { Header } from "./components/Header";
import { LoginPage } from "./components/LoginPage";
import { TaskDetails } from "./components/TaskDetails";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import type { User } from "./types";

type Page = "dashboard" | "tasks" | "create";

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>("tasks");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const savedToken = localStorage.getItem("krokant_token");
    const savedUser = localStorage.getItem("krokant_user");

    if (savedToken && savedUser) {
      setAuthToken(savedToken);
      const parsedUser = JSON.parse(savedUser) as User;
      setUser(parsedUser);
      setPage(parsedUser.role === "HEAD" ? "dashboard" : "tasks");
    }
  }, []);

  async function handleLogin(email: string, password: string) {
    const data = await api.login(email, password);
    localStorage.setItem("krokant_token", data.accessToken);
    localStorage.setItem("krokant_user", JSON.stringify(data.user));
    setAuthToken(data.accessToken);
    setUser(data.user);
    setPage(data.user.role === "HEAD" ? "dashboard" : "tasks");
  }

  function handleLogout() {
    localStorage.removeItem("krokant_token");
    localStorage.removeItem("krokant_user");
    setAuthToken("");
    setUser(null);
    setSelectedTaskId("");
  }

  function navigate(nextPage: Page) {
    setSelectedTaskId("");
    setPage(nextPage);
  }

  function refreshTasks() {
    setRefreshKey((value) => value + 1);
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      <Header user={user} page={page} onNavigate={navigate} onLogout={handleLogout} />

      <main className="content">
        {selectedTaskId ? (
          <TaskDetails
            taskId={selectedTaskId}
            currentUser={user}
            onBack={() => setSelectedTaskId("")}
            onChanged={refreshTasks}
          />
        ) : (
          <>
            {page === "dashboard" && user.role === "HEAD" && <Dashboard />}
            {page === "tasks" && (
              <TaskList
                currentUser={user}
                refreshKey={refreshKey}
                onSelectTask={setSelectedTaskId}
              />
            )}
            {page === "create" && user.role === "HEAD" && (
              <TaskForm
                onCreated={() => {
                  refreshTasks();
                  setPage("tasks");
                }}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
