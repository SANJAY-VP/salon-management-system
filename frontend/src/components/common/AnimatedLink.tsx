import React from "react";
import { Link, LinkProps } from "react-router-dom";

export function AnimatedLink({ className = "", children, ...props }: LinkProps) {
  return (
    <Link
      {...props}
      className={`text-gold font-bold hover:text-gold-light transition-colors relative group py-1 cursor-pointer ${className}`}
    >
      {children}
      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
    </Link>
  );
}
