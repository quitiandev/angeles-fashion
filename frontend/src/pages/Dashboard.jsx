import { useEffect, useState } from "react";
import Inventario from "./Inventario";
import Clientes from "./Clientes";
import Ventas from "./Ventas";
import Alquileres from "./Alquileres";
import Reportes from "./Reportes";
import CalendarioAlquileres from "./CalendarioAlquileres";
import Configuracion from "./Configuracion";
import { Icon } from "@iconify/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const modulos = [
  { nombre: "Inicio", icono: "bx:home" },
  { nombre: "Inventario", icono: "bx:closet" },
  { nombre: "Clientes", icono: "bx:group" },
  { nombre: "Ventas", icono: "bx:shopping-bag" },
  { nombre: "Alquileres", icono: "bx:calendar" },
  { nombre: "Reportes", icono: "bx:bar-chart-alt-2" },
  { nombre: "Configuración", icono: "bx:cog" },
];

function Dashboard({ cerrarSesion, token }) {
  const [paginaActual, setPaginaActual] = useState("Inicio");
  const [usuario, setUsuario] = useState(null);
  const [errorUsuario, setErrorUsuario] = useState(false);
  const [revisionPerfil, setRevisionPerfil] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function cargarUsuario() {
      try {
        const respuesta = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!respuesta.ok) throw new Error("No se pudo consultar el perfil");
        const datos = await respuesta.json();
        if (!controller.signal.aborted) {
          setUsuario(datos);
          setErrorUsuario(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Error al consultar el perfil:", error);
          setErrorUsuario(true);
        }
      }
    }
    if (token) cargarUsuario();
    return () => controller.abort();
  }, [token, revisionPerfil]);

  const navegar = (nombre) => {
    setPaginaActual(nombre);
    if (paginaActual === "Configuración" && nombre !== "Configuración") {
      setRevisionPerfil((valor) => valor + 1);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f5] md:h-screen md:overflow-hidden md:flex">
      <aside className="flex w-full shrink-0 flex-col border-b border-[#eae6e3] bg-white md:h-screen md:w-62 md:border-r md:border-b-0">
        <div className="flex items-center justify-center border-b border-[#eeeae7] px-5 py-5">
          <img
            src="/images/logoR.png"
            alt="Ángeles Fashion"
            className="h-auto w-44 max-w-full object-contain"
          />
        </div>

        <div className="px-3 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.15em] text-[#a8a29e] uppercase">
            Menú principal
          </p>
          <nav className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:flex md:flex-col">
            {modulos.map((modulo) => {
              const activo = paginaActual === modulo.nombre;
              return (
                <button
                  key={modulo.nombre}
                  type="button"
                  onClick={() => navegar(modulo.nombre)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                    activo
                      ? "bg-[#f6edf2] font-semibold text-[#85486e]"
                      : "text-[#78716c] hover:bg-[#f8f7f5] hover:text-[#292524]"
                  }`}
                >
                  <span className="flex w-5 shrink-0 items-center justify-center">
                    <Icon icon={modulo.icono} width={20} height={20} />
                  </span>
                  <span>{modulo.nombre}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-[#eeeae7] px-5 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f6edf2] text-[#85486e]">
              <Icon icon="bx:user-circle" width={24} height={24} />
            </div>
            <div className="min-w-0 flex-1">
              <p
                className="truncate text-sm font-semibold text-[#292524]"
                title={usuario?.nombre || ""}
              >
                {usuario?.nombre ||
                  (errorUsuario
                    ? "Perfil no disponible"
                    : "Cargando usuario...")}
              </p>
              <p
                className="mt-0.5 truncate text-xs text-[#8a817d]"
                title={usuario?.correo || ""}
              >
                {usuario?.correo || (errorUsuario ? "Revisa la conexión" : "")}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 md:h-screen md:overflow-y-auto">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eae6e3] bg-white px-5 py-5 md:px-9">
          <div>
            <p className="text-xs text-[#a8a29e]">
              Administración / {paginaActual}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#292524]">
              {paginaActual}
            </h2>
          </div>
          <button
            type="button"
            onClick={cerrarSesion}
            className="cursor-pointer rounded-lg border border-[#eae6e3] px-4 py-2 text-sm font-medium text-[#57534e] transition hover:border-[#85486e] hover:text-[#85486e]"
          >
            Cerrar sesión
          </button>
        </header>

        <section className="mx-auto max-w-360 p-5 md:p-9">
          {paginaActual === "Inicio" ? (
            <div className="space-y-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-xs font-semibold tracking-[0.14em] text-[#85486e] uppercase">
                    Vista general
                  </p>
                  <h2 className="text-3xl font-semibold tracking-tight text-[#292524]">
                    Tu boutique, organizada.
                  </h2>
                  <p className="mt-2 text-sm text-[#8a817d]">
                    Consulta tus alquileres y accede a las operaciones del día.
                  </p>
                </div>
                <span className="rounded-lg border border-[#eae6e3] bg-white px-3 py-2 text-xs text-[#78716c]">
                  {new Date().toLocaleDateString("es-CO", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  {
                    nombre: "Inventario",
                    descripcion: "Gestionar prendas",
                    numero: "01",
                  },
                  {
                    nombre: "Ventas",
                    descripcion: "Registrar ventas",
                    numero: "02",
                  },
                  {
                    nombre: "Alquileres",
                    descripcion: "Gestionar reservas",
                    numero: "03",
                  },
                ].map((modulo) => (
                  <button
                    key={modulo.nombre}
                    type="button"
                    onClick={() => navegar(modulo.nombre)}
                    className="group flex cursor-pointer items-center justify-between rounded-xl border border-[#eae6e3] bg-white px-5 py-4 text-left transition hover:border-[#c8a5b7] hover:bg-[#fffafd]"
                  >
                    <div>
                      <p className="text-[11px] font-medium text-[#a8a29e]">
                        {modulo.numero}
                      </p>
                      <h3 className="mt-1 font-semibold text-[#292524]">
                        {modulo.nombre}
                      </h3>
                      <p className="mt-1 text-xs text-[#8a817d]">
                        {modulo.descripcion}
                      </p>
                    </div>
                    <span className="text-xl text-[#b7a4ae] transition group-hover:translate-x-1 group-hover:text-[#85486e]">
                      →
                    </span>
                  </button>
                ))}
              </div>
              <CalendarioAlquileres
                token={token}
                irAAlquileres={() => navegar("Alquileres")}
              />
            </div>
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
          ) : paginaActual === "Configuración" ? (
            <Configuracion token={token} />
          ) : null}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
