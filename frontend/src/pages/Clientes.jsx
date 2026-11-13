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
          <h2 className="text-2xl font-bold text-gray-800">
            Gestión de clientes
          </h2>
          <p className="text-gray-500">
            Registra y administra los clientes de Ángeles Fashion.
          </p>
        </div>

        <button
          onClick={mostrarFormulario ? cancelarFormulario : nuevoCliente}
          className="rounded-lg bg-rose-600 px-5 py-2 text-white hover:bg-rose-700"
        >
          {mostrarFormulario ? "Cancelar" : "+ Agregar cliente"}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-100 p-3 text-red-700">
          {error}
        </div>
      )}

      {mensaje && (
        <div
          role="status"
          className="rounded-lg bg-green-100 p-3 text-green-700"
        >
          {mensaje}
        </div>
      )}

      {mostrarFormulario && (
        <form
          onSubmit={guardarCliente}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-5 text-lg font-semibold text-gray-800">
            {clienteEditando !== null
              ? "Editar cliente"
              : "Registrar nuevo cliente"}
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {campos.map((campo) => (
              <label key={campo.nombre} className="space-y-1">
                <span className="text-sm font-medium text-gray-700">
                  {campo.etiqueta}
                </span>

                <input
                  type={campo.tipo}
                  name={campo.nombre}
                  value={formulario[campo.nombre]}
                  onChange={cambiarCampo}
                  required
                  className="w-full rounded-lg border border-gray-300 p-2 outline-none focus:border-rose-500"
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="mt-5 rounded-lg bg-rose-600 px-6 py-2 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {guardando
              ? "Guardando..."
              : clienteEditando !== null
                ? "Actualizar cliente"
                : "Guardar cliente"}
          </button>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="Buscar por nombre, documento, correo o teléfono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-rose-500"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        {cargando ? (
          <p className="p-6 text-gray-500">Cargando clientes...</p>
        ) : clientesFiltrados.length === 0 ? (
          <p className="p-6 text-gray-500">
            {busqueda
              ? "No se encontraron clientes con esa búsqueda."
              : "No hay clientes registrados."}
          </p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Documento</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">Correo</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {clientesFiltrados.map((cliente) => (
                <tr key={cliente.id} className="border-t">
                  <td className="p-4">{cliente.id}</td>
                  <td className="p-4">
                    {cliente.nombre} {cliente.apellido}
                  </td>
                  <td className="p-4">{cliente.documento_identidad}</td>
                  <td className="p-4">{cliente.telefono}</td>
                  <td className="p-4">{cliente.correo}</td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editarCliente(cliente)}
                        className="rounded-lg bg-blue-100 px-3 py-1 text-blue-700 hover:bg-blue-200"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => eliminarCliente(cliente)}
                        disabled={eliminandoId === cliente.id}
                        className="rounded-lg bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200 disabled:opacity-50"
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
        )}
      </div>

      <p className="text-sm text-gray-500">
        Total de clientes: {clientes.length}
      </p>
    </div>
  );
}
