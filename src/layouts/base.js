import React from "react";
import { Link } from "gatsby";
import ThemeToggle from "../components/Toggle"

export default function Base({ children }) {
  const year = new Date().getFullYear();
  return (
    <div>
      <div className="md:text-left text-center md:fixed md:w-80 bg-gray-900 md:h-full text-white">
        <div className="p-4 mx-auto text-center">
            <ThemeToggle className="text-center" />
        </div>
        <div className="md:absolute bottom-0 py-12 mx-12 space-y-8">
          <h1 className="text-6xl font-black font-serif">Eisen's Blog</h1>
          <nav>
            <ul className="text-md flex-row">
              <li>
                <Link to="/" className="leading-7 block hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="leading-7 block hover:underline">
                  About
                </Link>
              </li>
              <li>
                <Link to="/archive" className="leading-7 block hover:underline">
                  Archive
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/aisensiy"
                  target="_blank"
                  rel="noreferrer"
                  className="leading-7 block hover:underline"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
          <footer className="text-gray-400">
            © {year}. All rights reserved.
          </footer>
        </div>
      </div>
      <div className="md:ml-80 p-4 md:p-8 md:max-w-6xl main">{children}</div>
    </div>
  );
}
