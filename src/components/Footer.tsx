import {
  Heart,
  Github,
  Linkedin,
  Mail,
  Code,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-20 border-t border-gray-200/50 bg-white/30 backdrop-blur-sm">
      {/* Decorative gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-green-500/30 to-transparent" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand Section */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-r from-green-500 to-green-600 rounded-lg blur-sm opacity-50" />
              <div className="relative bg-linear-to-br from-green-500 to-green-600 p-1.5 rounded-lg">
                <Code className="w-4 h-4 text-white" />
              </div>
            </div>
            <span className="text-sm font-medium text-gray-600">
              Built with{" "}
              <Heart className="w-3 h-3 inline-block text-red-500 mx-0.5 fill-red-500" />{" "}
              by
            </span>
          </div>

          {/* Developer Credit - Main */}
          <div className="flex items-center space-x-4">
            {/* Aderoute */}
            <Link href="/" className="group flex items-center space-x-2">
              <span className="text-sm font-bold bg-linear-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent group-hover:from-orange-600 group-hover:to-orange-700 transition-all">
                Aderoute
              </span>
              <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-orange-500 transition-colors" />
            </Link>

            <span className="text-gray-300">|</span>

            {/* Eric Lumumba */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium text-gray-700">
                Eric Lumumba
              </span>

              {/* Social Icons */}
              <div className="flex items-center space-x-1">
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-all duration-200"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href="https://linkedin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-blue-600 hover:text-blue-700 rounded-full hover:bg-blue-50 transition-all duration-200"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
                <a
                  href="mailto:eric@aderoute.com"
                  className="p-2 text-green-600 hover:text-green-700 rounded-full hover:bg-green-50 transition-all duration-200"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-400">
            © {currentYear} All rights reserved
          </div>
        </div>

        {/* Mobile view adjustment */}
        <div className="mt-4 text-center md:hidden">
          <p className="text-xs text-gray-400 flex items-center justify-center space-x-1">
            <span>Created with</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>by Eric Lumumba for Aderoute</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
