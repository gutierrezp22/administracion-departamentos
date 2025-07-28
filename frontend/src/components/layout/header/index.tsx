import React from "react";
import Image from "next/image";

const header = () => {
	return (
		<header className="bg-gray-800 text-white p-4 flex justify-between items-center">
			{/* Logo */}
			<div className="text-2xl font-bold">Logo</div>

			{/* Icono de sesión de usuario */}
			<div className="flex items-center">
				{/* Reemplaza con tu icono de usuario */}
				<Image
					src="/user-icon.png"
					alt="Icono de usuario"
					width={24}
					height={24}
					className="mr-2"
				/>
				<span>Nombre de Usuario</span>
			</div>
		</header>
	);
};

export default header;
