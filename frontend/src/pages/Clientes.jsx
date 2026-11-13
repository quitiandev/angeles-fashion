import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const formularioInicial = {
  nombre: "",
  apellido: "",
  documento_identidad: "",
  telefono: "",
  correo: "",
};

export default function Clientes({ token }) {
  const [clientes, setClientes] = useState([]);
  const [formulario, setFormulario] = useState({ ...formularioInicial });
  const [clienteEditando, setClienteEditando] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const obtenerError = async (respuesta, mensajeDefecto) => {
    const datos = await respuesta.json().catch(() => ({}));

    if (typeof datos.detail === "string") {
      return datos.detail;
    }

    if (Array.isArray(datos.detail)) {
      return datos.detail.map((item) => item.msg || "Dato inválido").join(". ");
    }

    return mensajeDefecto;
  };

  const cargarClientes = async (signal) => {
    const respuesta = await fetch(`${API}/clientes/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    if (!respuesta.ok) {
      throw new Error(
        await obtenerError(respuesta, "No se pudieron cargar los clientes"),
      );
    }

    const datos = await respuesta.json();

    if (!Array.isArray(datos)) {
      throw new Error("El servidor no devolvió una lista de clientes");
    }

    return datos;
  };

  useEffect(() => {
    const controlador = new AbortController();

    const cargar = async () => {
      try {
        setCargando(true);
        setError("");
        const datos = await cargarClientes(controlador.signal);

        if (!controlador.signal.aborted) {
          setClientes(datos);
        }
      } catch (err) {
        if (!controlador.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controlador.signal.aborted) {
          setCargando(false);
        }
      }
    };

    cargar();

    return () => controlador.abort();
  }, [token]);

  const cambiarCampo = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setClienteEditando(null);
    setFormulario({ ...formularioInicial });
    setError("");
  };

  const nuevoCliente = () => {
    setClienteEditando(null);
    setFormulario({ ...formularioInicial });
    setError("");
    setMensaje("");
    setMostrarFormulario(true);
  };

  const editarCliente = (cliente) => {
    setClienteEditando(cliente.id);

    setFormulario({
      nombre: cliente.nombre ?? "",
      apellido: cliente.apellido ?? "",
      documento_identidad: cliente.documento_identidad ?? "",
      telefono: cliente.telefono ?? "",
      correo: cliente.correo ?? "",
    });

    setError("");
    setMensaje("");
    setMostrarFormulario(true);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardarCliente = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    setGuardando(true);

    const editando = clienteEditando !== null;

    try {
      const url = editando
        ? `${API}/clientes/${clienteEditando}`
        : `${API}/clientes/`;

      const respuesta = await fetch(url, {
        method: editando ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formulario),
      });

      if (!respuesta.ok) {
        throw new Error(
          await obtenerError(respuesta, "No se pudo guardar el cliente"),
        );
      }

      const datosActualizados = await cargarClientes();
      setClientes(datosActualizados);

      cancelarFormulario();
      setMensaje(
        editando
          ? "Cliente actualizado correctamente"
          : "Cliente registrado correctamente",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarCliente = async (cliente) => {
    const confirmado = window.confirm(
      `¿Eliminar a ${cliente.nombre} ${cliente.apellido}?\n\n` +
        "Esta acción no se puede deshacer.",
    );

    if (!confirmado) return;

    setEliminandoId(cliente.id);
    setError("");
    setMensaje("");

    try {
      const respuesta = await fetch(`${API}/clientes/${cliente.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!respuesta.ok) {
        throw new Error(
          await obtenerError(respuesta, "No se pudo eliminar el cliente"),
        );
      }

      const datosActualizados = await cargarClientes();
      setClientes(datosActualizados);
      setMensaje("Cliente eliminado correctamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminandoId(null);
    }
  };

  const clientesFiltrados = clientes.filter((cliente) => {
    const texto = [
      cliente.nombre,
      cliente.apellido,
      cliente.documento_identidad,
      cliente.correo,
      cliente.telefono,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return texto.includes(busqueda.trim().toLowerCase());
  });

  const campos = [
    { nombre: "nombre", etiqueta: "Nombre", tipo: "text" },
    { nombre: "apellido", etiqueta: "Apellido", tipo: "text" },
    {
      nombre: "documento_identidad",
      etiqueta: "Documento de identidad",
      tipo: "text",
    },
    { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
    { nombre: "correo", etiqueta: "Correo electrónico", tipo: "email" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#85486e]">
            Directorio
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#292524]">
            Gestión de clientes
          </h2>
          <p className="mt-1 text-sm text-[#8a817d]">
            Organiza los datos de contacto de tus clientes.
          </p>
        </div>
        <button
          type="button"
          onClick={mostrarFormulario ? cancelarFormulario : nuevoCliente}
          className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium transition ${mostrarFormulario ? "border border-[#eae6e3] bg-white text-[#57534e] hover:bg-[#faf8f7]" : "bg-[#85486e] text-white hover:bg-[#713a5d]"}`}
        >
          {mostrarFormulario ? "Cancelar" : "+ Agregar cliente"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {mensaje && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form
          onSubmit={guardarCliente}
          className="overflow-hidden rounded-2xl border border-[#eae6e3] bg-white"
        >
          <div className="border-b border-[#eeeae7] px-5 py-5 md:px-7">
            <h3 className="text-lg font-semibold text-[#292524]">
              {clienteEditando !== null
                ? "Editar cliente"
                : "Registrar nuevo cliente"}
            </h3>
            <p className="mt-1 text-sm text-[#8a817d]">
              Completa la información del cliente.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-5 px-5 py-6 md:grid-cols-2 md:px-7">
            {campos.map((campo) => (
              <label key={campo.nombre} className="block space-y-2">
                <span className="text-sm font-medium text-[#57534e]">
                  {campo.etiqueta}
                </span>
                <input
                  type={campo.tipo}
                  name={campo.nombre}
                  value={formulario[campo.nombre]}
                  onChange={cambiarCampo}
                  required
                  className="w-full rounded-lg border border-[#e3dedb] bg-white px-3.5 py-3 text-sm text-[#292524] outline-none transition placeholder:text-[#a8a29e] focus:border-[#85486e] focus:ring-2 focus:ring-[#85486e]/10"
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#eeeae7] bg-[#fcfbfa] px-5 py-4 md:px-7">
            <button
              type="button"
              onClick={cancelarFormulario}
              className="cursor-pointer rounded-lg border border-[#e3dedb] bg-white px-5 py-2.5 text-sm font-medium text-[#57534e] hover:bg-[#f8f7f5]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="cursor-pointer rounded-lg bg-[#85486e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#713a5d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando
                ? "Guardando..."
                : clienteEditando !== null
                  ? "Actualizar cliente"
                  : "Guardar cliente"}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#eae6e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eeeae7] px-5 py-5 md:px-7">
          <div>
            <h3 className="text-base font-semibold text-[#292524]">
              Directorio de clientes
            </h3>
            <p className="mt-1 text-xs text-[#8a817d]">
              {clientes.length}{" "}
              {clientes.length === 1
                ? "cliente registrado"
                : "clientes registrados"}
            </p>
          </div>
          <div className="relative w-full sm:w-85">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a8a29e]"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              type="search"
              aria-label="Buscar clientes"
              placeholder="Buscar nombre, documento, correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-lg border border-[#e3dedb] bg-[#fcfbfa] py-2.5 pl-10 pr-3 text-sm text-[#292524] outline-none transition placeholder:text-[#a8a29e] focus:border-[#85486e] focus:bg-white"
            />
          </div>
        </div>

        {cargando ? (
          <p className="px-7 py-12 text-center text-sm text-[#8a817d]">
            Cargando clientes...
          </p>
        ) : clientesFiltrados.length === 0 ? (
          <div className="px-7 py-14 text-center">
            <p className="font-medium text-[#57534e]">
              {busqueda
                ? "No se encontraron resultados"
                : "Todavía no hay clientes"}
            </p>
            <p className="mt-1 text-sm text-[#a8a29e]">
              {busqueda
                ? "Prueba con otro nombre, documento o dato de contacto."
                : "Registra tu primer cliente para comenzar."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-left text-sm">
              <thead className="bg-[#fcfbfa] text-xs font-semibold uppercase tracking-wide text-[#8a817d]">
                <tr>
                  <th className="px-5 py-4 font-semibold md:pl-7">Cliente</th>
                  <th className="px-5 py-4 font-semibold">Documento</th>
                  <th className="px-5 py-4 font-semibold">Teléfono</th>
                  <th className="px-5 py-4 font-semibold">Correo</th>
                  <th className="px-5 py-4 text-right font-semibold md:pr-7">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0edeb]">
                {clientesFiltrados.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="transition hover:bg-[#fcfbfa]"
                  >
                    <td className="px-5 py-4 md:pl-7">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f4e8ef] text-xs font-semibold text-[#85486e]">
                          {`${(cliente.nombre || "").charAt(0)}${(cliente.apellido || "").charAt(0)}`.toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium text-[#292524]">
                            {cliente.nombre} {cliente.apellido}
                          </p>
                          <p className="text-xs text-[#a8a29e]">
                            ID #{cliente.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[#57534e]">
                      {cliente.documento_identidad}
                    </td>
                    <td className="px-5 py-4 text-[#57534e]">
                      {cliente.telefono || "—"}
                    </td>
                    <td className="px-5 py-4 text-[#57534e]">
                      {cliente.correo || "—"}
                    </td>
                    <td className="px-5 py-4 md:pr-7">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => editarCliente(cliente)}
                          className="cursor-pointer rounded-lg border border-[#eae6e3] bg-white px-3 py-2 text-xs font-medium text-[#57534e] transition hover:border-[#c8a5b7] hover:text-[#85486e]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarCliente(cliente)}
                          disabled={eliminandoId === cliente.id}
                          className="cursor-pointer rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {eliminandoId === cliente.id
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!cargando && clientesFiltrados.length > 0 && (
          <div className="border-t border-[#eeeae7] px-5 py-3 text-xs text-[#8a817d] md:px-7">
            Mostrando {clientesFiltrados.length} de {clientes.length} clientes
          </div>
        )}
      </div>
    </div>
  );
}
