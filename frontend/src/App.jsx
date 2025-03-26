import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from "./pages/Login";
import Home from "./pages/Home";
import { useTokenRefresh } from './hooks/useTokenRefresh';

const App = () => {
  const { currentUser, token } = useSelector(state => state.user);
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
      <ToastContainer position="bottom-right" />
    </Router>
  );
};

export default App;