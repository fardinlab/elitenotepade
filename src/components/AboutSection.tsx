import { User, Phone, Send, Globe, Facebook } from "lucide-react";
import { motion } from "framer-motion";

const AboutSection = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-border/50"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
          <User className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Fardin Sagor</h2>
        </div>
      </div>

      <div className="space-y-3">
        <a
          href="tel:0193238913"
          className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors group"
        >
          <Phone className="w-5 h-5 text-green-500" />
          <span className="text-foreground group-hover:text-primary transition-colors">0193238913</span>
        </a>

        <a
          href="https://t.me/elitefardin"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors group"
        >
          <Send className="w-5 h-5 text-blue-400" />
          <span className="text-foreground group-hover:text-primary transition-colors">@elitefardin</span>
        </a>

        <a
          href="https://facebook.com/elitefardinlab"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors group"
        >
          <Facebook className="w-5 h-5 text-blue-500" />
          <span className="text-foreground group-hover:text-primary transition-colors">elitefardinlab</span>
        </a>

        <a
          href="https://sagor.pages.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-3 rounded-xl bg-background/50 hover:bg-background/80 transition-colors group"
        >
          <Globe className="w-5 h-5 text-purple-400" />
          <span className="text-foreground group-hover:text-primary transition-colors">sagor.pages.dev</span>
        </a>
      </div>
    </motion.div>
  );
};

export default AboutSection;
