import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from "./pages/Login";
import Home from "./pages/Home";
import { useTokenRefresh } from './hooks/useTokenRefresh';

const App = () => {
  const { currentUser } = useSelector(state => state.user);
  useTokenRefresh();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={currentUser ? <Navigate to="/" /> : <Login />}
        />
        <Route
          path="/"
          element={currentUser ? <Home /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
};

export default App;