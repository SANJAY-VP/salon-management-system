import { Icon } from "./Icon";
import { LuScissors } from "react-icons/lu";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Services",
      links: [
        { label: "Haircut", href: "#" },
        { label: "Beard Grooming", href: "#" },
        { label: "Facial & Spa", href: "#" },
        { label: "Hair Coloring", href: "#" },
        { label: "Traditional Shave", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Our Barbers", href: "#" },
        { label: "Locations", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Cookie Policy", href: "#" },
        { label: "FAQ", href: "#" },
      ],
    },
  ];

  const socialLinks = [
    { icon: "instagram", href: "#" },
    { icon: "facebook", href: "#" },
    { icon: "twitter", href: "#" },
    { icon: "youtube", href: "#" },
  ];

  return (
    <footer className="bg-coffee pt-20 pb-10 border-t border-gold/10">
      <div className="max-w-7xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Logo and Tagline */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="text-4xl text-gold">
                <LuScissors />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-serif text-gold tracking-wide">Salon Book</h2>
                <p className="text-xs text-bronze uppercase tracking-widest">Premium Grooming</p>
              </div>
            </div>
            <p className="text-stone-400 max-w-sm leading-relaxed">
              Experience the pinnacle of male grooming. Our master barbers combine traditional techniques with modern style to deliver an unparalleled service.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={`Follow us on ${social.icon}`}
                  className="w-10 h-10 rounded-full bg-cocoa border border-gold/10 flex items-center justify-center text-bronze hover:bg-gold hover:text-cocoa transition-all duration-300"
                >
                  <Icon icon={social.icon as any} size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section, index) => (
            <nav key={index} aria-label={section.title}>
              <h3 className="text-white font-serif text-lg font-semibold mb-6 uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-stone-400 hover:text-gold transition-colors duration-200 flex items-center group"
                    >
                      <span className="w-0 h-[1px] bg-gold mr-0 group-hover:w-3 group-hover:mr-2 transition-all duration-300"></span>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Newsletter / Contact Info */}
        <div className="border-t border-gold/5 pt-12 mt-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 text-stone-300">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <Icon icon="phone" size={18} />
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-tighter">Call Us</p>
                <p className="font-medium">+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4 text-stone-300">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <Icon icon="email" size={18} />
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-tighter">Email Us</p>
                <p className="font-medium">contact@salonbook.com</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-4 text-stone-300">
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                <Icon icon="location" size={18} />
              </div>
              <div>
                <p className="text-xs text-stone-500 uppercase tracking-tighter">Visit Us</p>
                <p className="font-medium">123 Grooming St, New York</p>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gold/5 pt-10 mt-16 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-stone-500 text-sm">
            &copy; {currentYear} Salon Book. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-stone-500 uppercase tracking-widest font-medium">
            <a href="#" className="hover:text-gold transition">Privacy</a>
            <a href="#" className="hover:text-gold transition">Terms</a>
            <a href="#" className="hover:text-gold transition">Sitemap</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
