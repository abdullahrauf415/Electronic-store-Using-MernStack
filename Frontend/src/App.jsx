import "./App.css";
import Navbar from "./Components/Navbar/Navbar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Shopcategory from "./pages/Shopcategory";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import LoginSignup from "./pages/LoginSignup";
import Footer from "./Components/Footer/Footer";
import Checkout from "./pages/Checkout";
import Payment from "./pages/Payment";
import PaymentConfirmation from "./pages/PaymentConfirmation";
import Admin from "./pages/Admin";
import UserProfile from "./pages/UserProfile";
import ChatApp from "./Components/Chatbot/ChatApp";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/electronics"
            element={<Shopcategory category="Electronics" />}
          />
          <Route
            path="/Gadgets"
            element={<Shopcategory category="Gadgets" />}
          />
          <Route
            path="/Accessories"
            element={<Shopcategory category="Accessories" />}
          />
          <Route path="/product/:productId" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/payment" element={<Payment />} />
          <Route
            path="/payment-confirmation"
            element={<PaymentConfirmation />}
          />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/UserProfile" element={<UserProfile />} />
          <Route path="Admin/*" element={<Admin />} />
        </Routes>
        <Footer />
      </BrowserRouter>
      <ChatApp />
    </div>
  );
}

export default App;
