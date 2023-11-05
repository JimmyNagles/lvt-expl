import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

const NavBar = ({
  links = [
    {
      name: "Land Tax Value Explorer",
      link: "/",
    },
  ],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      console.log(`Window width: ${window.innerWidth}`);

      if (window.innerWidth > 1000) {
        setIsOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);

    // Remove the event listener when the component unmounts to avoid memory leaks
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <nav className="bg-black p-2 w-full">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center p-4 h-[100px]">
          <div className="flex items-center">
            <Link href="/">
              {/* <Image
                className="rounded-lg"
                src="/RD.png"
                alt=" logo"
                width={70}
                height={70}
              /> */}
            </Link>
          </div>
          <div className="lg:flex lg:justify-evenly hidden w-full">
            {links.map((link, index) => {
              return (
                <ul
                  className="text-white m-2 hover:text-orange-500"
                  key={index}
                >
                  <Link href={link.link}>{link.name}</Link>
                </ul>
              );
            })}
          </div>
          <div className="lg:hidden flex flex-row-reverse">
            {/* on click */}
            <button
              onClick={() => {
                setIsOpen(!isOpen);
              }}
              className="text-white focus:outline-none focus:text-gray-500"
            >
              <svg className="h-6 w-6 fill-current" viewBox="0 0 20 20">
                <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* renders this  */}
        <div className={isOpen ? " p-2  " : "hidden"}>
          <div className="  w-full ">
            {links.map((link, index) => {
              return (
                <ul className="text-white m-2 hover:text-blue-900 " key={index}>
                  <Link href={link.link}>{link.name}</Link>
                </ul>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
