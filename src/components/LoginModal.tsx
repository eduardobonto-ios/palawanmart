/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LoginModal() {
  const { 
    isLoginModalOpen, 
    setIsLoginModalOpen, 
    login, 
    isLoggingIn, 
    loginError, 
    setLoginError 
  } = useApp();

  const handleClose = () => {
    setIsLoginModalOpen(false);
    setLoginError(null);
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-emerald-950/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 text-emerald-900/20 hover:text-emerald-900 hover:bg-emerald-50 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="p-8 md:p-12 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-primary">
                <LogIn size={40} />
              </div>
              
              <h2 className="text-2xl font-black text-emerald-900 mb-2">Welcome Back!</h2>
              <p className="text-emerald-900/60 font-medium mb-8">
                Sign in to PalawanMart to start shopping or selling local products.
              </p>

              <button 
                onClick={login}
                disabled={isLoggingIn}
                className={`w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-emerald-100 rounded-2xl font-black text-emerald-900 transition-all active:scale-95 shadow-sm ${
                  isLoggingIn 
                    ? 'opacity-60 cursor-not-allowed bg-emerald-50/50' 
                    : 'hover:border-primary hover:bg-emerald-50/50'
                }`}
              >
                {isLoggingIn ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-emerald-950" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    <img 
                      src="https://www.google.com/favicon.ico" 
                      alt="Google" 
                      className="w-5 h-5 animate-pulse" 
                      referrerPolicy="no-referrer"
                    />
                    Continue with Google
                  </>
                )}
              </button>

              {loginError && (
                <div id="login-error-container" className="mt-6 p-4 text-left bg-rose-50 border border-rose-100 rounded-2xl text-rose-950">
                  <p className="text-xs font-bold leading-relaxed mb-4">{loginError}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      id="btn-open-new-tab"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="text-xs px-3 py-2 bg-emerald-900 text-white rounded-xl font-bold hover:bg-emerald-950 transition-all active:scale-95 shadow-sm"
                    >
                      Open App in New Tab
                    </button>
                    <button
                      id="btn-dismiss-error"
                      onClick={() => setLoginError(null)}
                      className="text-xs px-3 py-2 bg-white text-rose-900 border border-rose-200 rounded-xl font-bold hover:bg-rose-100 transition-all active:scale-95"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              <p className="mt-8 text-[10px] font-bold text-emerald-900/20 uppercase tracking-widest">
                By continuing, you agree to our Terms of Service
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
