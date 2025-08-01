"use client";

import { Briefcase, Github, Twitter, MessageCircle, Lock } from "lucide-react";
import { useState } from "react";
import { BetaSignupModal } from "./beta-signup-modal";

export function Footer() {
  const [showBetaModal, setShowBetaModal] = useState(false);
  const footerSections = [
    {
      title: "PRODUCT",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Documentation", href: "#docs" },
      ],
    },
    {
      title: "SUPPORT",
      links: [
        { name: "Discord Server", href: "#discord" },
        { name: "Contact Us", href: "#contact" },
        { name: "Help Center", href: "#help" },
      ],
    },
  ];

  const socialLinks = [
    { name: "Discord", icon: MessageCircle, href: "#discord" },
    { name: "GitHub", icon: Github, href: "#github" },
    { name: "Twitter", icon: Twitter, href: "#twitter" },
  ];

  const handleLinkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowBetaModal(true);
  };

  return (
    <footer className="border-t-2 border-emerald-400/30 bg-slate-950 py-16">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center border border-emerald-300/50 shadow-lg shadow-emerald-400/20">
                <Briefcase className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <span className="text-2xl font-bold text-emerald-400 font-mono tracking-wider">
                  POSTLY
                </span>
                <div className="text-sm text-emerald-300 font-mono">
                  v0.0.1 • ONLINE
                </div>
              </div>
            </div>
            <p className="text-slate-400 font-mono text-sm leading-relaxed mb-8 max-w-md">
              Automated job discovery for Discord communities. Smart AI
              matching, instant posting, seamless applications. Built for the
              modern job seeker.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <button
                    key={social.name}
                    onClick={handleLinkClick}
                    className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-400/50 transition-colors duration-200 hover:shadow-emerald-400/20 shadow-lg"
                    aria-label={social.name}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-emerald-400 mb-6 font-mono text-lg tracking-widest flex items-center space-x-2">
                <span>[{section.title}]</span>
                <Lock className="w-3 h-3 opacity-50" />
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <button
                      onClick={handleLinkClick}
                      className="text-slate-400 hover:text-emerald-400 transition-colors duration-200 font-mono text-sm hover:underline text-left"
                    >
                      {link.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-800 mt-16 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 font-mono text-sm">
              © {new Date().getFullYear()} POSTLY • BUILT FOR JOB SEEKERS
            </p>
            <div className="flex items-center space-x-6 text-slate-400 font-mono text-sm">
              <span>Made with ❤️ for Discord</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Open Source</span>
            </div>
          </div>
        </div>
      </div>

      {/* Beta Signup Modal */}
      <BetaSignupModal
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />
    </footer>
  );
}
