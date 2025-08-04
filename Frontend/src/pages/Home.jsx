import React, { useRef } from "react";
import Hero from "../Components/Hero/Hero";
import Popular from "../Components/Popular/Popular";
import NewArrival from "../Components/NewArrival/NewArrival";
import SuggestedProducts from "../Components/SuggestedProducts/SuggestedProducts";
import "./CSS/Home.css";

const Home = () => {
  const newArrivalRef = useRef(null);

  const scrollToNewArrival = () => {
    newArrivalRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="home-page">
      <Hero onShopClick={scrollToNewArrival} />
      <section className="home-section">
        <SuggestedProducts />
      </section>
      <section className="home-section">
        <Popular />
      </section>
      <section className="home-section" ref={newArrivalRef}>
        <NewArrival />
      </section>
    </div>
  );
};

export default Home;
