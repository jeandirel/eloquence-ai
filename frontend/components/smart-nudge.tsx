"use client";

/**
 * Smart Nudge Component
 * Non-intrusive visual feedback that appears at specific screen positions
 */

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Gauge, Zap, AlertCircle } from "lucide-react";

interface SmartNudgeProps {
    type: "GAZE_ALERT" | "PACE_ALERT" | "DISSONANCE_ALERT";
    message: string;
    icon: string;
    position: string;
    severity: "info" | "warning" | "error";
}

export default function SmartNudge({
    type,
    message,
    icon,
    position,
    severity,
}: SmartNudgeProps) {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    // Map icon strings to components
    const IconComponent = {
        eye: Eye,
        speedometer: Gauge,
        energy: Zap,
        alert: AlertCircle,
    }[icon] || AlertCircle;

    // Map positions to Tailwind classes
    const positionClasses = {
        "top-center": "top-24 left-1/2 transform -translate-x-1/2",
        "bottom-right": "bottom-24 right-8",
        "center-left": "top-1/2 left-8 transform -translate-y-1/2",
        "bottom-center": "bottom-24 left-1/2 transform -translate-x-1/2",
    }[position] || "top-24 right-8";

    // Severity colors
    const severityStyles = {
        info: "from-primary/80 to-primary/60 border-primary/30",
        warning: "from-yellow-500/80 to-yellow-600/60 border-yellow-400/30",
        error: "from-secondary/80 to-red-600/60 border-secondary/30",
    }[severity];

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className={`fixed ${positionClasses} z-50`}
                >
                    <div
                        className={`
              glass-dark
              bg-gradient-to-br ${severityStyles}
              rounded-2xl px-6 py-4
              shadow-glass
              backdrop-blur-glass
              border
              flex items-center gap-4
              min-w-[280px] max-w-[400px]
            `}
                    >
                        {/* Icon */}
                        <div className="flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                <IconComponent className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        {/* Message */}
                        <div className="flex-1">
                            <p className="text-white font-medium text-sm leading-relaxed">
                                {message}
                            </p>
                        </div>

                        {/* Dismiss button */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center group"
                            aria-label="Dismiss"
                        >
                            <span className="text-white/60 group-hover:text-white text-lg leading-none">
                                ×
                            </span>
                        </button>
                    </div>

                    {/* Animated progress bar (auto-dismiss indicator) */}
                    <motion.div
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-2xl origin-left"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
