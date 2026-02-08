import React from "react";
import UserContext from "./context/user";
import { Navigate, Route, Routes } from "react-router";
import Login from "./components/Login";
import Registration from "./components/Registration";
import RoomsPage from "./components/RoomsPage";

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [role, setRole] = useState("");

  return (
    <div>
      <UserContext.Provider
        value={{ accessToken, setAccessToken, role, setRole }}
      >
        <Routes>
          <Route path="/" elemnent={<Navigate to="/login" replace />} />
          <Route path="/login" elemnent={<Login />} />
          <Route path="/registration" elemnent={<Registration />} />
          <Route
            path="/rooms/*"
            element={
              <ProtectedRoute>
                <RoomsPage />
              </ProtectedRoute>
            }
          ></Route>
        </Routes>
      </UserContext.Provider>
    </div>
  );
}

export default App;
