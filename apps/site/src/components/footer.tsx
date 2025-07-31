import { Briefcase, Github, Twitter, MessageCircle, Mail } from "lucide-react"
import Link from "next/link"

export function Footer() {
  const footerSections = [
    {
      title: "PRODUCT",
      links: [
        { name: "Features", href: "#features" },
        { name: "Pricing", href: "#pricing" },
        { name: "Documentation", href: "#docs" },
        { name: "API Reference", href: "#api" },
        { name: "Status Page", href: "#status" },
      ],
    },
    {
      title: "SUPPORT",
      links: [
        { name: "Help Center", href: "#help" },
        { name: "Discord Server", href: "#discord" },
        { name: "Contact Us", href: "#contact" },
        { name: "Bug Reports", href: "#bugs" },
        { name: "Feature Requests", href: "#features" },
      ],
    },
    {
      title: "LEGAL",
      links: [
        { name: "Privacy Policy", href: "#privacy" },
        { name: "Terms of Service", href: "#terms" },
        { name: "Cookie Policy", href: "#cookies" },
        { name: "Security", href: "#security" },
        { name: "Compliance", href: "#compliance" },
      ],
    },
  ]

  const socialLinks = [
    { name: "Discord", icon: MessageCircle, href: "#discord" },
    { name: "GitHub", icon: Github, href: "#github" },
    { name: "Twitter", icon: Twitter, href: "#twitter" },
    { name: "Email", icon: Mail, href: "#email" },
  ]

  return (
    <footer className="border-t-2 border-cyan-400/30 bg-slate-950 py-16">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center border border-cyan-300/50 shadow-lg">
                <Briefcase className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <span className="text-2xl font-bold text-cyan-400 font-mono tracking-wider">JOBSYNC</span>
                <div className="text-sm text-cyan-300 font-mono">v1.0.0 • STABLE</div>
              </div>
            </div>
            <p className="text-slate-400 font-mono text-sm leading-relaxed mb-8 max-w-md">
              Automated job discovery for Discord communities. Smart scraping, instant posting, seamless applications.
              Trusted by 5,000+ servers worldwide.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <Link
                  key={social.name}
                  href={social.href}
                  className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-400/50 transition-all duration-300 group"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                </Link>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-bold text-cyan-400 mb-6 font-mono text-lg tracking-widest">[{section.title}]</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-slate-400 hover:text-cyan-400 transition-colors duration-300 font-mono text-sm hover:underline"
                    >
                      {link.name}
                    </Link>
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
              © {new Date().getFullYear()} JOBSYNC SYSTEMS • BUILT FOR CAREER GROWTH
            </p>
            <div className="flex items-center space-x-6 text-slate-400 font-mono text-sm">
              <span>Made with ❤️ for Discord</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>Open Source</span>
              <div className="w-1 h-1 bg-slate-600 rounded-full" />
              <span>GDPR Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
