/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-display font-bold tracking-tight text-primary">
              Palawan<span className="text-white">Mart</span>
            </span>
          </div>
          <p className="text-sm leading-relaxed">
            The #1 multi-vendor marketplace for local products in Palawan. Supporting small businesses and local artisans.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-primary transition-colors"><Facebook size={20} /></a>
            <a href="#" className="hover:text-primary transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-primary transition-colors"><Twitter size={20} /></a>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-white font-bold uppercase tracking-wider text-xs">Shop</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">Categories</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Promotions</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Best Sellers</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">New Arrivals</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-white font-bold uppercase tracking-wider text-xs">For Vendors</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">Become a Seller</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Vendor Login</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Seller Protection</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Shipping Guide</a></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-white font-bold uppercase tracking-wider text-xs">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <MapPin size={18} className="text-primary mt-0.5 shrink-0" />
              <span>Rizal Avenue, Puerto Princesa City, Palawan</span>
            </li>
            <li className="flex items-center gap-3">
              <Phone size={18} className="text-primary shrink-0" />
              <span>+63 912 345 6789</span>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={18} className="text-primary shrink-0" />
              <span>hello@palawanmart.ph</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 text-xs text-center">
        <p>&copy; {new Date().getFullYear()} PalawanMart. All rights reserved. Made with ❤️ in Palawan.</p>
      </div>
    </footer>
  );
}
