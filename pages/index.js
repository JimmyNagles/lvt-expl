import Image from "next/image";
import { Inter } from "next/font/google";
import Mapbox from "../Components/Mapbox";
import { useState } from "react";
import NavBar from "@/Components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between  ${inter.className}`}
    >
      <NavBar />
      <Mapbox />
    </main>
  );
}
