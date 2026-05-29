"use client";

import { motion } from "framer-motion";

export default function RobotMascot() {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-black overflow-hidden">
      <motion.img
        src="public/imagens/robotscan2push.png" // coloque aqui a imagem do robo
        alt="Robot Mascot"
        className="w-[320px] md:w-[420px] object-contain"
        animate={{
          y: [0, -12, 0],
          rotate: [0, 2, -2, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Brilho neon */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full bg-purple-500 blur-[120px] opacity-30"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}