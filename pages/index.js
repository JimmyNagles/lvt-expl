import Image from "next/image";
import { Inter } from "next/font/google";
import Mapbox from "../components/Mapbox";
import { useState } from "react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  return (
    <main
      className={`flex min-h-screen flex-col items-center justify-between  ${inter.className}`}
    >
      <div className="h-[100px]"></div>
      <Mapbox />
    </main>
  );
}
