import React from 'react';
import Link from 'next/link';

const Menu = () => {
  return (
    <nav className="bg-gray-200 p-4">
      <ul className="space-y-2">
      <li>
        <Link href="/" className="text-blue-500">Inicio</Link>
      </li>
      <li>
        <Link href="/resoluciones" className="text-blue-500">Resoluciones</Link>
      </li>
      {/* Agrega más enlaces del menú aquí */}
    </ul>
    </nav>
  );
};

export default Menu;