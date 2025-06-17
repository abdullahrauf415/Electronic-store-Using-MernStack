import React, { useRef } from "react";
import Hero from "../Components/Hero/Hero";
import Popular from "../Components/Popular/Popular";
import NewArrival from "../Components/NewArrival/NewArrival";

const Home = () => {
  const newArrivalRef = useRef(null);

  const scrollToNewArrival = () => {
    newArrivalRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div>
      <Hero onShopClick={scrollToNewArrival} />
      <Popular />
      <div ref={newArrivalRef}>
        <NewArrival />
      </div>
    </div>
  );
};

export default Home;
