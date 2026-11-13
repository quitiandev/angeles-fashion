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

  const estilosEstado = {
    reservado: "bg-[#f5eaf0] text-[#85486e]",
    activo: "bg-[#e7f3ed] text-[#35765b]",
    devuelto: "bg-[#f0efed] text-[#69635f]",
    cancelado: "bg-[#fcebe9] text-[#a35b51]",
  };

  const campoClase =
    "mt-2 w-full rounded-lg border border-[#e5dfdb] bg-white px-3.5 py-3 text-sm text-[#292524] outline-none transition focus:border-[#85486e] focus:ring-2 focus:ring-[#85486e]/10";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#85486e]">
            Gestión de boutique
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#292524]">
            Alquileres y reservas
          </h2>
          <p className="mt-1 text-sm text-[#8a817d]">
            Organiza entregas, devoluciones y próximas reservas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMostrarFormulario(!mostrarFormulario);
            setError("");
            setMensaje("");
          }}
          className={`cursor-pointer rounded-lg px-5 py-3 text-sm font-medium transition ${
            mostrarFormulario
              ? "border border-[#e5dfdb] bg-white text-[#57534e] hover:bg-[#faf8f7]"
              : "bg-[#85486e] text-white hover:bg-[#713a5d]"
          }`}
        >
          {mostrarFormulario ? "Cerrar formulario" : "+ Nueva reserva"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            etiqueta: "Reservados",
            estado: "reservado",
            color: "text-[#85486e]",
          },
          { etiqueta: "En curso", estado: "activo", color: "text-[#35765b]" },
          {
            etiqueta: "Devueltos",
            estado: "devuelto",
            color: "text-[#69635f]",
          },
        ].map((item) => (
          <div
            key={item.estado}
            className="rounded-xl border border-[#eae6e3] bg-white px-5 py-4"
          >
            <p className="text-xs font-medium text-[#8a817d]">
              {item.etiqueta}
            </p>
            <p
              className={`mt-2 text-3xl font-semibold tracking-tight ${item.color}`}
            >
              {alquileres.filter((a) => a.estado === item.estado).length}
            </p>
          </div>
        ))}
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
          onSubmit={registrarAlquiler}
          className="overflow-hidden rounded-2xl border border-[#eae6e3] bg-white"
        >
          <div className="border-b border-[#eeeae7] px-5 py-5 md:px-7">
            <h3 className="text-lg font-semibold text-[#292524]">
              Registrar nueva reserva
            </h3>
            <p className="mt-1 text-sm text-[#8a817d]">
              Selecciona el cliente, el período y las prendas.
            </p>
          </div>
          <div className="space-y-6 px-5 py-6 md:px-7">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-[#57534e]">
                  Cliente
                </span>
                <select
                  name="cliente_id"
                  value={formulario.cliente_id}
                  onChange={cambiarCampo}
                  required
                  className={campoClase}
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellido}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#57534e]">
                  Fecha de inicio
                </span>
                <input
                  type="date"
                  name="fecha_inicio"
                  value={formulario.fecha_inicio}
                  onChange={cambiarCampo}
                  required
                  className={campoClase}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-[#57534e]">
                  Fecha de finalización
                </span>
                <input
                  type="date"
                  name="fecha_fin"
                  value={formulario.fecha_fin}
                  min={formulario.fecha_inicio || undefined}
                  onChange={cambiarCampo}
                  required
                  className={campoClase}
                />
              </label>
            </div>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-[#292524]">
                  Prendas para alquilar
                </h4>
                <span className="text-xs text-[#8a817d]">
                  {formulario.prendas_ids.length} seleccionadas
                </span>
              </div>
              {prendasElegibles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#e5dfdb] bg-[#fcfbfa] p-6 text-center text-sm text-[#8a817d]">
                  No hay prendas disponibles.
                </div>
              ) : (
                <div className="grid max-h-80 gap-2 overflow-y-auto sm:grid-cols-2">
                  {prendasElegibles.map((prenda) => {
                    const elegida = formulario.prendas_ids.includes(prenda.id);
                    return (
                      <label
                        key={prenda.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                          elegida
                            ? "border-[#b78da5] bg-[#fbf5f8]"
                            : "border-[#eae6e3] hover:border-[#c8a5b7] hover:bg-[#fcfafb]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={elegida}
                          onChange={() => seleccionarPrenda(prenda.id)}
                          className="h-4 w-4 accent-[#85486e]"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[#292524]">
                            {prenda.nombre}
                          </p>
                          <p className="mt-1 text-xs text-[#8a817d]">
                            {prenda.codigo} · {prenda.talla}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-xs text-[#8a817d]">
                La disponibilidad para las fechas elegidas será validada por el
                servidor.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#eeeae7] pt-5">
              <button
                type="button"
                onClick={() => setMostrarFormulario(false)}
                className="cursor-pointer rounded-lg border border-[#e5dfdb] px-5 py-2.5 text-sm text-[#57534e] hover:bg-[#faf8f7]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="cursor-pointer rounded-lg bg-[#85486e] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#713a5d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? "Registrando..." : "Confirmar reserva"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#eae6e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeae7] px-5 py-5 md:px-7">
          <div>
            <h3 className="text-lg font-semibold text-[#292524]">
              Historial de alquileres
            </h3>
            <p className="mt-1 text-sm text-[#8a817d]">
              Consulta reservas y gestiona su estado.
            </p>
          </div>
          <span className="rounded-lg bg-[#f8f7f5] px-3 py-1.5 text-xs font-medium text-[#78716c]">
            {alquileres.length} registros
          </span>
        </div>
        {cargando ? (
          <p className="px-6 py-10 text-center text-sm text-[#8a817d]">
            Cargando alquileres...
          </p>
        ) : alquileres.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-[#57534e]">
              Todavía no hay alquileres registrados
            </p>
            <p className="mt-1 text-sm text-[#8a817d]">
              Las reservas aparecerán aquí cuando se registren.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-230 text-left text-sm">
              <thead className="bg-[#fcfbfa] text-xs text-[#8a817d]">
                <tr>
                  <th className="px-5 py-4 font-medium">Reserva</th>
                  <th className="px-5 py-4 font-medium">Cliente</th>
                  <th className="px-5 py-4 font-medium">Prendas</th>
                  <th className="px-5 py-4 font-medium">Inicio</th>
                  <th className="px-5 py-4 font-medium">Fin</th>
                  <th className="px-5 py-4 font-medium">Estado</th>
                  <th className="px-5 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece9]">
                {alquileres.map((alquiler) => (
                  <tr
                    key={alquiler.id}
                    className="transition hover:bg-[#fcfbfa]"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#85486e]">
                      #{alquiler.id}
                    </td>
                    <td className="px-5 py-4 font-medium text-[#292524]">
                      {nombreCliente(alquiler.cliente_id)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        {(detallesAlquileres[alquiler.id] ?? []).map(
                          (detalle) => (
                            <div key={detalle.prenda_id} className="text-xs">
                              <span className="font-semibold text-[#85486e]">
                                {detalle.codigo}
                              </span>
                              <span className="ml-2 text-[#78716c]">
                                {detalle.nombre}
                              </span>
                            </div>
                          ),
                        )}
                        {!detallesAlquileres[alquiler.id]?.length && (
                          <span className="text-xs text-[#a8a29e]">
                            Sin detalles disponibles
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#57534e]">
                      {alquiler.fecha_inicio ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#57534e]">
                      {alquiler.fecha_fin ?? "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                          estilosEstado[alquiler.estado] ||
                          "bg-[#f0efed] text-[#69635f]"
                        }`}
                      >
                        {alquiler.estado ?? "Sin estado"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {alquiler.estado === "reservado" && (
                          <>
                            <button
                              type="button"
                              disabled={guardando}
                              onClick={() =>
                                gestionarAlquiler(alquiler, "activar")
                              }
                              className="cursor-pointer rounded-lg border border-[#cce4d6] bg-[#eef7f1] px-3 py-2 text-xs font-medium text-[#35765b] hover:bg-[#dff0e6] disabled:opacity-50"
                            >
                              Activar
                            </button>
                            <button
                              type="button"
                              disabled={guardando}
                              onClick={() =>
                                gestionarAlquiler(alquiler, "cancelar")
                              }
                              className="cursor-pointer rounded-lg border border-[#f2dcd9] bg-[#fdf4f2] px-3 py-2 text-xs font-medium text-[#a35b51] hover:bg-[#fae8e5] disabled:opacity-50"
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
                            className="cursor-pointer rounded-lg border border-[#cce4d6] bg-[#eef7f1] px-3 py-2 text-xs font-medium text-[#35765b] hover:bg-[#dff0e6] disabled:opacity-50"
                          >
                            Registrar devolución
                          </button>
                        )}
                        {["devuelto", "cancelado"].includes(
                          alquiler.estado,
                        ) && (
                          <span className="text-xs text-[#a8a29e]">
                            Finalizado
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
