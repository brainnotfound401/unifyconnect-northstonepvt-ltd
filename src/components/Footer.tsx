import { Link } from "react-router-dom";
import northstoneLogo from "@/assets/northstone-logo.jpeg";

const Footer = () => {
  const footerLinks = {
    Product: ["Features", "Pricing", "Integrations", "API", "Download"],
    Solutions: ["Enterprise", "Education", "Healthcare", "Government"],
    Resources: ["Documentation", "Blog", "Community", "Support"],
    Company: ["About", "Careers", "Press", "Contact"],
  };

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <img
                src={northstoneLogo}
                alt="Northstone"
                className="h-10 w-10 rounded-lg object-cover"
              />
              <div className="flex flex-col">
                <span className="font-display text-xl font-bold text-primary">
                  Unify
                </span>
                <span className="text-[10px] text-muted-foreground -mt-1">
                  by Northstone Pvt. Ltd.
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs mb-6">
              Connect, collaborate, and unify your team with the most powerful
              video conferencing platform.
            </p>
            <div className="flex items-center gap-4">
              {["twitter", "linkedin", "youtube", "github"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <div className="w-4 h-4 rounded bg-muted-foreground/30" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-display font-semibold text-foreground mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Northstone Pvt. Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
