import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const formularioInicial = {
  cliente_id: "",
  prendas_ids: [],
  fecha_inicio: "",
  fecha_fin: "",
};

async function obtenerError(respuesta) {
  const datos = await respuesta.json().catch(() => ({}));

  if (typeof datos.detail === "string") {
    return datos.detail;
  }

  if (Array.isArray(datos.detail)) {
    return datos.detail.map((item) => item.msg).join(". ");
  }

  return "No se pudo completar la operación";
}

export default function Alquileres({ token }) {
  const [alquileres, setAlquileres] = useState([]);
  const [detallesAlquileres, setDetallesAlquileres] = useState({});
  const [clientes, setClientes] = useState([]);
  const [prendas, setPrendas] = useState([]);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const solicitar = async (ruta, opciones = {}) => {
    const respuesta = await fetch(`${API}${ruta}`, {
      ...opciones,
      headers: {
        Authorization: `Bearer ${token}`,
        ...opciones.headers,
      },
    });

    if (!respuesta.ok) {
      throw new Error(await obtenerError(respuesta));
    }

    if (respuesta.status === 204) return null;

    return respuesta.json();
  };

  const cargarDatos = async () => {
    const [datosAlquileres, datosClientes, datosPrendas] = await Promise.all([
      solicitar("/alquileres/"),
      solicitar("/clientes/"),
      solicitar("/prendas/"),
    ]);

    setAlquileres(datosAlquileres);
    setClientes(datosClientes);
    setPrendas(datosPrendas);

    const resultados = await Promise.all(
      datosAlquileres.map(async (alquiler) => {
        try {
          const detalle = await solicitar(`/alquileres/${alquiler.id}`);
          return [alquiler.id, detalle.detalles ?? []];
        } catch {
          return [alquiler.id, []];
        }
      }),
    );

    setDetallesAlquileres(Object.fromEntries(resultados));
  };

  useEffect(() => {
    let activo = true;

    const iniciar = async () => {
      try {
        setCargando(true);

        const [datosAlquileres, datosClientes, datosPrendas] =
          await Promise.all([
            solicitar("/alquileres/"),
            solicitar("/clientes/"),
            solicitar("/prendas/"),
          ]);

        const resultados = await Promise.all(
          datosAlquileres.map(async (alquiler) => {
            try {
              const detalle = await solicitar(`/alquileres/${alquiler.id}`);
              return [alquiler.id, detalle.detalles ?? []];
            } catch {
              return [alquiler.id, []];
            }
          }),
        );

        if (activo) {
          setAlquileres(datosAlquileres);
          setClientes(datosClientes);
          setPrendas(datosPrendas);
          setDetallesAlquileres(Object.fromEntries(resultados));
        }
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    };

    iniciar();

    return () => {
      activo = false;
    };
  }, [token]);

  const cambiarCampo = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const seleccionarPrenda = (id) => {
    setFormulario((anterior) => ({
      ...anterior,
      prendas_ids: anterior.prendas_ids.includes(id)
        ? anterior.prendas_ids.filter((actual) => actual !== id)
        : [...anterior.prendas_ids, id],
    }));
  };

  const registrarAlquiler = async (evento) => {
    evento.preventDefault();
    setError("");
    setMensaje("");

    if (formulario.prendas_ids.length === 0) {
      setError("Selecciona al menos una prenda.");
      return;
    }

    if (formulario.fecha_fin < formulario.fecha_inicio) {
      setError("La fecha de finalización no puede ser anterior al inicio.");
      return;
    }

    setGuardando(true);

    try {
      await solicitar("/alquileres/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_id: Number(formulario.cliente_id),
          prendas_ids: formulario.prendas_ids,
          fecha_inicio: formulario.fecha_inicio,
          fecha_fin: formulario.fecha_fin,
        }),
      });

      await cargarDatos();

      setFormulario({ ...formularioInicial, prendas_ids: [] });
      setMostrarFormulario(false);
      setMensaje("Reserva registrada correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const gestionarAlquiler = async (alquiler, accion) => {
    const mensajes = {
      activar: "¿Confirmas la entrega de las prendas al cliente?",
      devolver: "¿Confirmas que las prendas fueron devueltas?",
      cancelar: "¿Seguro que deseas cancelar esta reserva?",
    };

    if (!window.confirm(mensajes[accion])) return;

    setError("");
    setMensaje("");
    setGuardando(true);

    try {
      const resultado = await solicitar(
        `/alquileres/${alquiler.id}/${accion}`,
        { method: "PATCH" },
      );

      await cargarDatos();

      setMensaje(
        resultado?.mensaje || "Estado del alquiler actualizado correctamente.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const nombreCliente = (id) => {
    const cliente = clientes.find((item) => item.id === id);

    return cliente ? `${cliente.nombre} ${cliente.apellido}` : `Cliente #${id}`;
  };

  const prendasElegibles = prendas.filter(
    (prenda) => String(prenda.estado).toLowerCase() === "disponible",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Gestión de alquileres
          </h2>
          <p className="text-gray-500">
            Administra reservas y consulta los alquileres.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMostrarFormulario(!mostrarFormulario);
            setError("");
            setMensaje("");
          }}
          className="rounded-lg bg-rose-600 px-5 py-2 text-white hover:bg-rose-700"
        >
          {mostrarFormulario ? "Cancelar" : "+ Nueva reserva"}
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
          onSubmit={registrarAlquiler}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-5 text-lg font-semibold">Registrar reserva</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-medium">Cliente</span>

              <select
                name="cliente_id"
                value={formulario.cliente_id}
                onChange={cambiarCampo}
                required
                className="w-full rounded-lg border border-gray-300 p-3"
              >
                <option value="">Seleccionar cliente</option>

                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} {cliente.apellido}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium">Fecha de inicio</span>

              <input
                type="date"
                name="fecha_inicio"
                value={formulario.fecha_inicio}
                onChange={cambiarCampo}
                required
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-medium">
                Fecha de finalización
              </span>

              <input
                type="date"
                name="fecha_fin"
                value={formulario.fecha_fin}
                min={formulario.fecha_inicio || undefined}
                onChange={cambiarCampo}
                required
                className="w-full rounded-lg border border-gray-300 p-3"
              />
            </label>
          </div>

          <div className="mt-6">
            <h4 className="mb-3 font-medium">Seleccionar prendas</h4>

            {prendasElegibles.length === 0 ? (
              <p className="text-gray-500">No hay prendas disponibles.</p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {prendasElegibles.map((prenda) => (
                  <label
                    key={prenda.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-rose-50"
                  >
                    <input
                      type="checkbox"
                      checked={formulario.prendas_ids.includes(prenda.id)}
                      onChange={() => seleccionarPrenda(prenda.id)}
                      className="accent-rose-600"
                    />

                    <div>
                      <p className="font-medium">{prenda.nombre}</p>
                      <p className="text-sm text-gray-500">
                        {prenda.codigo} · {prenda.talla}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <p className="mt-3 text-sm text-gray-500">
            La disponibilidad para las fechas elegidas será validada por el
            servidor.
          </p>

          <button
            type="submit"
            disabled={guardando}
            className="mt-5 rounded-lg bg-rose-600 px-6 py-2 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {guardando ? "Registrando..." : "Confirmar reserva"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-5">
          <h3 className="text-lg font-semibold">Historial de alquileres</h3>
        </div>

        {cargando ? (
          <p className="p-5 text-gray-500">Cargando alquileres...</p>
        ) : alquileres.length === 0 ? (
          <p className="p-5 text-gray-500">No hay alquileres registrados.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Prendas</th>
                <th className="p-4">Inicio</th>
                <th className="p-4">Fin</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {alquileres.map((alquiler) => (
                <tr key={alquiler.id} className="border-t">
                  <td className="p-4">#{alquiler.id}</td>

                  <td className="p-4">{nombreCliente(alquiler.cliente_id)}</td>

                  <td className="p-4">
                    <div className="space-y-1">
                      {(detallesAlquileres[alquiler.id] ?? []).map(
                        (detalle) => (
                          <div key={detalle.prenda_id}>
                            <span className="font-semibold text-[#85486e]">
                              {detalle.codigo}
                            </span>
                            <span className="ml-2 text-gray-500">
                              {detalle.nombre}
                            </span>
                          </div>
                        ),
                      )}

                      {!detallesAlquileres[alquiler.id]?.length && (
                        <span className="text-gray-400">
                          Sin detalles disponibles
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="p-4">{alquiler.fecha_inicio ?? "—"}</td>

                  <td className="p-4">{alquiler.fecha_fin ?? "—"}</td>

                  <td className="p-4">
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
                      {alquiler.estado ?? "Sin estado"}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {alquiler.estado === "reservado" && (
                        <>
                          <button
                            type="button"
                            disabled={guardando}
                            onClick={() =>
                              gestionarAlquiler(alquiler, "activar")
                            }
                            className="rounded-lg bg-blue-100 px-3 py-2 text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                          >
                            Activar
                          </button>

                          <button
                            type="button"
                            disabled={guardando}
                            onClick={() =>
                              gestionarAlquiler(alquiler, "cancelar")
                            }
                            className="rounded-lg bg-red-100 px-3 py-2 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      {alquiler.estado === "activo" && (
                        <button
                          type="button"
                          disabled={guardando}
                          onClick={() =>
                            gestionarAlquiler(alquiler, "devolver")
                          }
                          className="rounded-lg bg-green-100 px-3 py-2 text-green-700 hover:bg-green-200 disabled:opacity-50"
                        >
                          Registrar devolución
                        </button>
                      )}

                      {["devuelto", "cancelado"].includes(alquiler.estado) && (
                        <span className="text-gray-400">Finalizado</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
