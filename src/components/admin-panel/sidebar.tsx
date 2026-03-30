"use client";
import { Menu } from "@/components/admin-panel/menu";
import { SidebarToggle } from "@/components/admin-panel/sidebar-toggle";
import { useSidebar } from "@/hooks/use-sidebar";
import { useStore } from "@/hooks/use-store";
import { cn } from "@/lib/utils";
//import Image from "next/image"; // Import Next.js Image component



const Logo = ({ size = 18 }: { size?: number }) => (
  <div style={{ width: size, height: size }}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <defs>
        <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FDE68A', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#D4AF37', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#926B0F', stopOpacity: 1 }} />
        </linearGradient>

        <linearGradient id="rimGradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#926B0F', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FDE68A', stopOpacity: 1 }} />
        </linearGradient>

        <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
          <feOffset dx="1" dy="2" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Rim */}
      <circle cx="50" cy="50" r="48" fill="url(#rimGradient)" />

      {/* Main Coin Face */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="url(#goldGradient)"
        filter="url(#shadow)"
        stroke="#856404"
        strokeWidth={0.5}
      />

      {/* Decorative Inner Circle */}
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="#B8860B"
        strokeWidth={1}
        strokeDasharray="2,2"
        opacity={0.5}
      />

      {/* Styled 'D' Logo */}
      <path
        d="M42 30 V70 H58 C72 70, 72 30, 58 30 Z M48 36 H56 C64 36, 64 64, 56 64 H48 V36 Z"
        fill="#1A1A1A"
        fillRule="evenodd"
      />

      {/* Shine Highlight */}
      <ellipse
        cx="35"
        cy="30"
        rx="12"
        ry="6"
        fill="#FFFFFF"
        opacity={0.2}
        transform="rotate(-45 35 30)"
      />
    </svg>
  </div>
);



export function Sidebar() {
  const sidebar = useStore(useSidebar, (x) => x);
  if (!sidebar) return null;
  const { isOpen, toggleOpen, getOpenState, setIsHover, settings } = sidebar;

  return (
    <aside
      className={cn(
"fixed top-0 left-0 z-50 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
        !getOpenState() ? "w-[90px]" : "w-72",
        settings.disabled && "hidden"
      )}
    >
      <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
      <div
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        className="relative h-full flex flex-col px-3 py-4 overflow-y-auto shadow-md dark:shadow-zinc-800"
      >
        <div
          className={cn(
            "flex items-center gap-2 mb-1 transition-transform ease-in-out duration-300",
            !getOpenState() ? "translate-x-1 justify-center" : "translate-x-0 justify-start"
          )}
        >
          {/* Display logo and text based on getOpenState 
          <Image
            src="/assets/images/logo_xi.png" // Update this path to your logo image
            alt="Trade Dinaar Logo"
            width={24} // Adjust width and height as needed
            height={24}
            className="mr-1"
          />*/}
           <Logo />

          {getOpenState() && (
            <h1
              className={cn(
                "font-bold text-lg whitespace-nowrap transition-opacity duration-300",
                !getOpenState() ? "opacity-0 hidden" : "opacity-100"
              )}
            >
              Trade Dinaar
            </h1>
          )}
        </div>
        <Menu isOpen={getOpenState()} />
      </div>
    </aside>
  );
}
