import { motion } from "framer-motion";
import {
  Video,
  Phone,
  Presentation,
  Users,
  Building2,
  Shield,
  Zap,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: Video,
    title: "HD Video Calls",
    description:
      "Crystal clear video quality with adaptive streaming for any network condition.",
    gradient: "from-primary to-primary/50",
  },
  {
    icon: Phone,
    title: "Voice Calls",
    description:
      "High-quality audio calls with noise cancellation and echo reduction.",
    gradient: "from-accent to-accent/50",
  },
  {
    icon: Presentation,
    title: "Webinars",
    description:
      "Host large-scale webinars with up to 10,000 attendees and interactive features.",
    gradient: "from-warning to-warning/50",
  },
  {
    icon: Users,
    title: "Team Groups",
    description:
      "Create and manage team groups for instant collaboration and communication.",
    gradient: "from-success to-success/50",
  },
  {
    icon: Building2,
    title: "Organizations",
    description:
      "Enterprise-grade organization management with roles and permissions.",
    gradient: "from-primary to-accent",
  },
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description:
      "Military-grade encryption ensures your conversations stay private.",
    gradient: "from-accent to-warning",
  },
  {
    icon: Zap,
    title: "Instant Connect",
    description:
      "Join meetings in seconds with optimized connection protocols.",
    gradient: "from-warning to-success",
  },
  {
    icon: Globe,
    title: "Global Infrastructure",
    description:
      "Servers worldwide ensure low latency wherever you are.",
    gradient: "from-success to-primary",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="inline-block px-4 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">
            Everything You Need to <span className="gradient-text">Connect</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From quick video calls to large-scale webinars, Unify has all the tools
            your team needs to collaborate effectively.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl glass hover:glass-elevated transition-all duration-300 hover:-translate-y-1">
                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <feature.icon className="h-6 w-6 text-foreground" />
                </div>

                {/* Content */}
                <h3 className="font-display text-lg font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
