import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Cart from "./pages/Cart";
import ProtectedRoute from "./routes/ProtectedRoute";
import OrderHistory from "./pages/OrderHistory";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* protected: all app routes require login */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          
            <Route path="/home" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<OrderHistory />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
