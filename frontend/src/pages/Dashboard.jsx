import { useState } from "react";
import Inventario from "./Inventario";
import Clientes from "./Clientes";
import Ventas from "./Ventas";
import Alquileres from "./Alquileres";
import Reportes from "./Reportes";

function Dashboard({ cerrarSesion, token }) {
  const [paginaActual, setPaginaActual] = useState("Inicio");

  const modulos = [
    "Inicio",
    "Inventario",
    "Clientes",
    "Ventas",
    "Alquileres",
    "Reportes",
  ];

  return (
    <div className="min-h-screen bg-rose-50 md:flex">
      <aside className="w-full md:w-64 bg-[#85486e] text-white p-6">
        <h1 className="text-2xl font-bold mb-10">Ángeles Fashion</h1>

        <nav className="flex flex-col gap-2">
          {modulos.map((modulo) => (
            <button
              key={modulo}
              type="button"
              onClick={() => setPaginaActual(modulo)}
              className={`text-left px-4 py-3 rounded-lg transition cursor-pointer ${
                paginaActual === modulo
                  ? "bg-white text-[#85486e] font-semibold"
                  : "hover:bg-[#a96590]"
              }`}
            >
              {modulo}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {paginaActual}
          </h2>

          <button
            type="button"
            onClick={cerrarSesion}
            className="text-sm font-medium text-gray-600 hover:text-red-600 cursor-pointer"
          >
            Cerrar sesión
          </button>
        </header>

        <section className="p-6 md:p-10">
          {paginaActual === "Inicio" ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900">
                Panel administrativo
              </h2>

              <p className="mt-3 text-gray-600">
                Bienvenida al sistema de gestión de Ángeles Fashion.
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                {["Inventario", "Ventas", "Alquileres"].map((modulo) => (
                  <button
                    key={modulo}
                    type="button"
                    onClick={() => setPaginaActual(modulo)}
                    className="text-left bg-white rounded-xl shadow-sm p-6 border border-rose-100 hover:shadow-md transition cursor-pointer"
                  >
                    <h3 className="text-xl font-semibold text-[#85486e]">
                      {modulo}
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">Ir al módulo</p>
                  </button>
                ))}
              </div>
            </>
          ) : paginaActual === "Inventario" ? (
            <Inventario token={token} />
          ) : paginaActual === "Clientes" ? (
            <Clientes token={token} />
          ) : paginaActual === "Ventas" ? (
            <Ventas token={token} />
          ) : paginaActual === "Alquileres" ? (
            <Alquileres token={token} />
          ) : paginaActual === "Reportes" ? (
            <Reportes token={token} />
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-8">
              <h2 className="text-2xl font-bold text-[#85486e]">
                Gestión de {paginaActual}
              </h2>

              <p className="mt-3 text-gray-500">
                Aquí mostraremos las funcionalidades del módulo.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
