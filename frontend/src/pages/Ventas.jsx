import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const formatoPrecio = (valor) =>
  Number(valor ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

async function obtenerError(respuesta, mensaje) {
  const datos = await respuesta.json().catch(() => ({}));

  if (typeof datos.detail === "string") {
    return datos.detail;
  }

  if (Array.isArray(datos.detail)) {
    return datos.detail.map((e) => e.msg).join(". ");
  }

  return mensaje;
}

export default function Ventas({ token }) {
  const [ventas, setVentas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [prendas, setPrendas] = useState([]);

  const [clienteId, setClienteId] = useState("");
  const [prendasIds, setPrendasIds] = useState([]);
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
      throw new Error(
        await obtenerError(respuesta, "No se pudo completar la operación"),
      );
    }

    if (respuesta.status === 204) return null;

    return respuesta.json();
  };

  const cargarDatos = async () => {
    const [datosVentas, datosClientes, datosPrendas] = await Promise.all([
      solicitar("/ventas/"),
      solicitar("/clientes/"),
      solicitar("/prendas/"),
    ]);

    setVentas(datosVentas);
    setClientes(datosClientes);
    setPrendas(datosPrendas);
  };

  useEffect(() => {
    let activo = true;

    const iniciar = async () => {
      try {
        setCargando(true);

        const [datosVentas, datosClientes, datosPrendas] = await Promise.all([
          solicitar("/ventas/"),
          solicitar("/clientes/"),
          solicitar("/prendas/"),
        ]);

        if (activo) {
          setVentas(datosVentas);
          setClientes(datosClientes);
          setPrendas(datosPrendas);
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

  const prendasDisponibles = prendas.filter(
    (prenda) => String(prenda.estado).toLowerCase() === "disponible",
  );

  const prendasSeleccionadas = prendasDisponibles.filter((prenda) =>
    prendasIds.includes(prenda.id),
  );

  const totalEstimado = prendasSeleccionadas.reduce(
    (total, prenda) => total + Number(prenda.precio_venta ?? 0),
    0,
  );

  const seleccionarPrenda = (id) => {
    setPrendasIds((actuales) =>
      actuales.includes(id)
        ? actuales.filter((actual) => actual !== id)
        : [...actuales, id],
    );
  };

  const registrarVenta = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (!clienteId) {
      setError("Selecciona un cliente");
      return;
    }

    if (prendasIds.length === 0) {
      setError("Selecciona al menos una prenda");
      return;
    }

    setGuardando(true);

    try {
      await solicitar("/ventas/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cliente_id: Number(clienteId),
          prendas_ids: prendasIds,
        }),
      });

      await cargarDatos();

      setClienteId("");
      setPrendasIds([]);
      setMostrarFormulario(false);
      setMensaje("Venta registrada correctamente");
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

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#85486e]">
            Operaciones comerciales
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#292524]">
            Gestión de ventas
          </h2>
          <p className="mt-1 text-sm text-[#8a817d]">
            Registra compras y consulta los movimientos de tu boutique.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setMostrarFormulario(!mostrarFormulario);
            setError("");
            setMensaje("");
          }}
          className={`cursor-pointer rounded-lg px-5 py-2.5 text-sm font-medium transition ${mostrarFormulario ? "border border-[#e6dedf] bg-white text-[#57534e] hover:bg-[#faf8f7]" : "bg-[#85486e] text-white hover:bg-[#713a5d]"}`}
        >
          {mostrarFormulario ? "Cancelar" : "+ Registrar venta"}
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
          onSubmit={registrarVenta}
          className="overflow-hidden rounded-2xl border border-[#eae6e3] bg-white"
        >
          <div className="border-b border-[#eeeae7] px-5 py-5 md:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#85486e]">
              Nueva operación
            </p>
            <h3 className="mt-1 text-lg font-semibold text-[#292524]">
              Registrar venta
            </h3>
            <p className="mt-1 text-sm text-[#8a817d]">
              Selecciona el cliente y las prendas que desea comprar.
            </p>
          </div>
          <div className="space-y-7 p-5 md:p-7">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[#44403c]">
                Cliente
              </span>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
                className="w-full rounded-lg border border-[#ded8d4] bg-white px-3 py-3 text-sm text-[#292524] outline-none transition focus:border-[#85486e] focus:ring-2 focus:ring-[#85486e]/10"
              >
                <option value="">Seleccionar cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre} {cliente.apellido} —{" "}
                    {cliente.documento_identidad}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-[#292524]">
                    Prendas disponibles
                  </h4>
                  <p className="mt-1 text-xs text-[#8a817d]">
                    Selecciona una o varias prendas para esta venta.
                  </p>
                </div>
                <span className="rounded-full bg-[#f6edf2] px-3 py-1 text-xs font-medium text-[#85486e]">
                  {prendasIds.length} seleccionadas
                </span>
              </div>
              {prendasDisponibles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#e4ddda] bg-[#fcfbfa] p-6 text-center text-sm text-[#8a817d]">
                  No hay prendas disponibles para vender.
                </div>
              ) : (
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {prendasDisponibles.map((prenda) => {
                    const elegida = prendasIds.includes(prenda.id);
                    return (
                      <label
                        key={prenda.id}
                        className={`flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-xl border p-4 transition sm:flex-nowrap ${elegida ? "border-[#b98aa5] bg-[#fcf6f9]" : "border-[#eae6e3] bg-white hover:border-[#d7c4cf] hover:bg-[#fcfbfa]"}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={elegida}
                            onChange={() => seleccionarPrenda(prenda.id)}
                            className="h-4 w-4 shrink-0 accent-[#85486e]"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-[#292524]">
                              {prenda.nombre}
                            </p>
                            <p className="mt-1 text-xs text-[#8a817d]">
                              {prenda.codigo} · Talla {prenda.talla}
                            </p>
                          </div>
                        </div>
                        <span className="whitespace-nowrap text-sm font-semibold text-[#44403c]">
                          {formatoPrecio(prenda.precio_venta)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#eadde4] bg-[#faf4f7] px-5 py-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-[#8a6a7b]">
                  Resumen de la venta
                </p>
                <p className="mt-1 text-sm text-[#57534e]">
                  {prendasIds.length}{" "}
                  {prendasIds.length === 1 ? "prenda" : "prendas"} seleccionadas
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8a6a7b]">Total estimado</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-[#85486e]">
                  {formatoPrecio(totalEstimado)}
                </p>
              </div>
            </div>
            <div className="flex justify-end border-t border-[#eeeae7] pt-5">
              <button
                type="submit"
                disabled={guardando || prendasIds.length === 0}
                className="cursor-pointer rounded-lg bg-[#85486e] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#713a5d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {guardando ? "Registrando..." : "Confirmar venta"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#eae6e3] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeae7] px-5 py-5 md:px-7">
          <div>
            <h3 className="text-lg font-semibold text-[#292524]">
              Historial de ventas
            </h3>
            <p className="mt-1 text-sm text-[#8a817d]">
              Consulta las ventas registradas.
            </p>
          </div>
          <span className="rounded-full bg-[#f6f3f1] px-3 py-1 text-xs font-medium text-[#78716c]">
            {ventas.length} {ventas.length === 1 ? "venta" : "ventas"}
          </span>
        </div>
        {cargando ? (
          <p className="px-6 py-10 text-sm text-[#8a817d]">
            Cargando ventas...
          </p>
        ) : ventas.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="font-medium text-[#57534e]">
              Todavía no hay ventas registradas
            </p>
            <p className="mt-1 text-sm text-[#8a817d]">
              Las ventas aparecerán aquí cuando registres la primera.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead className="bg-[#faf9f8] text-xs uppercase tracking-wide text-[#8a817d]">
                <tr>
                  <th className="px-5 py-4 font-medium md:px-7">Venta</th>
                  <th className="px-5 py-4 font-medium">Cliente</th>
                  <th className="px-5 py-4 font-medium">Fecha</th>
                  <th className="px-5 py-4 text-right font-medium md:px-7">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ece9]">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="transition hover:bg-[#fcfbfa]">
                    <td className="px-5 py-4 font-semibold text-[#85486e] md:px-7">
                      #{venta.id}
                    </td>
                    <td className="px-5 py-4 font-medium text-[#292524]">
                      {nombreCliente(venta.cliente_id)}
                    </td>
                    <td className="px-5 py-4 text-[#78716c]">
                      {venta.fecha
                        ? new Date(venta.fecha).toLocaleString("es-CO")
                        : "Sin fecha"}
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-[#292524] md:px-7">
                      {formatoPrecio(venta.total)}
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
