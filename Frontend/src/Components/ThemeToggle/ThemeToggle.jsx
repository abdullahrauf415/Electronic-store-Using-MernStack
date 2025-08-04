import { useContext } from "react";
import HomeContext from "../../Context/HomeContext";
import "./ThemeToggle.css";
const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useContext(HomeContext);

  return (
    <button className="theme-toggle-btn" onClick={toggleDarkMode}>
      {darkMode ? "🌞" : "🌙"}
    </button>
  );
};

export default ThemeToggle;
