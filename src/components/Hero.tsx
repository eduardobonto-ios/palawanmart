/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative px-4 sm:px-6 lg:px-8 mt-10">
      <div className="max-w-7xl mx-auto h-[450px] md:h-[550px] relative rounded-[3rem] overflow-hidden shadow-2xl shadow-emerald-900/20 bg-primary-dark">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500 origin-bottom-left rotate-12 -translate-y-20 scale-150 opacity-20 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-teal-400 origin-top-right -rotate-12 translate-y-20 scale-125 opacity-20 blur-2xl rounded-full" />

        <div className="h-full flex flex-col justify-center px-8 md:px-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl text-white"
          >
            <div className="flex items-center gap-2 mb-6 bg-white/10 backdrop-blur-md w-fit px-3 py-1.5 rounded-full border border-white/20">
              <MapPin size={16} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Discover Palawan Gems</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-display font-extrabold leading-[1.05] mb-6 text-white">
              Authentic <br />
              <span className="text-emerald-400 italic">Palawan Treasures</span>
            </h1>

            <p className="text-lg text-emerald-100/80 mb-10 max-w-lg leading-relaxed">
              Handpicked authentic products straight from Puerto Princesa and El Nido artisans. Support local and discover the last frontier.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="bg-white text-primary-dark px-10 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-black/10 cursor-pointer">
                Shop Now <ArrowRight size={20} />
              </button>
              <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all cursor-pointer">
                Sell Now
              </button>
            </div>
          </motion.div>
        </div>

        {/* Floating image decoration */}
        <motion.div 
          initial={{ opacity: 0, x: 100, rotate: 10 }}
          animate={{ opacity: 1, x: 0, rotate: 5 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="hidden lg:block absolute right-20 top-1/2 -translate-y-1/2 w-80 h-[400px] glass-dark p-4 rounded-[3rem] shadow-2xl"
        >
          <img 
            src="https://images.unsplash.com/photo-1536511132770-058865673037?auto=format&fit=crop&q=80&w=800" 
            alt="Palawan Gems" 
            className="w-full h-full object-cover rounded-[2.5rem]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute -top-4 -left-4 glass p-4 rounded-2xl shadow-lg">
            <Star size={32} className="text-emerald-500" fill="currentColor" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

import { Star } from 'lucide-react';
