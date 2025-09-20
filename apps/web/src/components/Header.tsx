"use client";

import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="glass-header relative z-50">
      <div className="flex items-center justify-between whitespace-nowrap px-4 sm:px-10 py-4">
        {/* Logo y Título */}
        <div className="flex items-center gap-3 text-white">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            {/* Aristas formando la estrella */}
            {/* Nodo central superior a todos los otros */}
            <line x1="24" y1="8" x2="10" y2="18" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="24" y1="8" x2="38" y2="18" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="24" y1="8" x2="14" y2="35" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="24" y1="8" x2="34" y2="35" stroke="currentColor" strokeWidth="1.5"/>
            
            {/* Conexiones cruzadas formando la estrella */}
            <line x1="10" y1="18" x2="34" y2="35" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="38" y1="18" x2="14" y2="35" stroke="currentColor" strokeWidth="1.5"/>
            
            {/* Conexiones horizontales */}
            <line x1="10" y1="18" x2="38" y2="18" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="14" y1="35" x2="34" y2="35" stroke="currentColor" strokeWidth="1.5"/>
            
            {/* Conexiones adicionales */}
            <line x1="10" y1="18" x2="14" y2="35" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="38" y1="18" x2="34" y2="35" stroke="currentColor" strokeWidth="1.5"/>
            
            {/* 5 Nodos */}
            {/* Nodo central superior */}
            <circle cx="24" cy="8" r="2.5" fill="currentColor"/>
            
            {/* Nodos laterales superiores */}
            <circle cx="10" cy="18" r="2.5" fill="currentColor"/>
            <circle cx="38" cy="18" r="2.5" fill="currentColor"/>
            
            {/* Nodos inferiores */}
            <circle cx="14" cy="35" r="2.5" fill="currentColor"/>
            <circle cx="34" cy="35" r="2.5" fill="currentColor"/>
          </svg>
          <h1 className="text-xl font-bold">Analizador de Complejidad</h1>
        </div>

        {/* Navegación Desktop */}
        <div className="hidden lg:flex items-center gap-6">
          <nav className="flex items-center gap-6 text-sm font-medium text-dark-text">
            <a className="hover:text-white transition-colors" href="/">Inicio</a>
            <a className="hover:text-white transition-colors" href="/documentation">Documentación</a>
            <a className="hover:text-white transition-colors" href="/">Ejemplos</a>
            <a className="hover:text-white transition-colors" href="/about-us">Acerca de</a>
          </nav>
          <div className="flex items-center gap-3">
            <button className="glass-button flex items-center justify-center rounded-md h-10 px-4 text-white text-sm font-bold transition-all">
              <span className="material-symbols-outlined mr-2">add</span>
              {" "}Nuevo Análisis
            </button>
          </div>
        </div>

        {/* Botón Hamburguesa */}
        <button 
          className="lg:hidden glass-secondary p-2 rounded-md transition-colors flex items-center justify-center"
          onClick={toggleMenu}
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined">
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Menú Mobile */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 glass-header border-t border-white/10 z-50 backdrop-blur-sm">
          <nav className="flex flex-col p-4 space-y-4">
            <a 
              className="text-dark-text hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-white/5"
              href="/"
              onClick={toggleMenu}
            >
              Inicio
            </a>
            <a 
              className="text-dark-text hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-white/5"
              href="/documentation"
              onClick={toggleMenu}
            >
              Documentación
            </a>
            <a 
              className="text-dark-text hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-white/5"
              href="/"
              onClick={toggleMenu}
            >
              Ejemplos
            </a>
            <a 
              className="text-dark-text hover:text-white transition-colors py-2 px-3 rounded-md hover:bg-white/5"
              href="/about-us"
              onClick={toggleMenu}
            >
              Acerca de
            </a>
            <div className="pt-2 border-t border-white/10">
              <button 
                className="glass-button w-full flex items-center justify-center rounded-md h-10 px-4 text-white text-sm font-bold transition-all"
                onClick={toggleMenu}
              >
                <span className="material-symbols-outlined mr-2">add</span>
                {" "}Nuevo Análisis
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}