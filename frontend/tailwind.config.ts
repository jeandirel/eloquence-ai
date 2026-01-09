import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                omni: {
                    bg: "#030305",       // Deepest Black
                    surface: "#0A0A0F",  // Dark Blue-Black
                    primary: "#00F3FF",  // Cyan Neon
                    secondary: "#7000FF",// Electric Violet
                    accent: "#FF0055",   // Cyber Pink
                    text: "#E0E0E0",     // Off-white
                    muted: "#50505A",    // Muted tech gray
                },
            },
            fontFamily: {
                sans: ['var(--font-geist-sans)', 'Inter', 'sans-serif'],
                mono: ['var(--font-geist-mono)', 'JetBrains Mono', 'monospace'],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "omni-gradient": "linear-gradient(135deg, #030305 0%, #0A0A0F 100%)",
                "glass": "linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
            },
            animation: {
                "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "float": "float 6s ease-in-out infinite",
                "glow": "glow 2s ease-in-out infinite alternate",
            },
            keyframes: {
                float: {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                glow: {
                    "0%": { boxShadow: "0 0 10px rgba(0, 243, 255, 0.1)" },
                    "100%": { boxShadow: "0 0 20px rgba(0, 243, 255, 0.3), 0 0 10px rgba(0, 243, 255, 0.1)" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
