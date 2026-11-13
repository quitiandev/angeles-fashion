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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Gestión de ventas
          </h2>
          <p className="text-gray-500">
            Registra ventas y consulta su historial.
          </p>
        </div>

        <button
          onClick={() => {
            setMostrarFormulario(!mostrarFormulario);
            setError("");
            setMensaje("");
          }}
          className="rounded-lg bg-rose-600 px-5 py-2 text-white hover:bg-rose-700"
        >
          {mostrarFormulario ? "Cancelar" : "+ Registrar venta"}
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
          onSubmit={registrarVenta}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-5 text-lg font-semibold">Registrar nueva venta</h3>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Cliente</span>

            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 p-3"
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

          <div className="mt-6">
            <h4 className="mb-3 font-medium">Prendas disponibles</h4>

            {prendasDisponibles.length === 0 ? (
              <p className="text-gray-500">
                No hay prendas disponibles para vender.
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {prendasDisponibles.map((prenda) => (
                  <label
                    key={prenda.id}
                    className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 hover:bg-rose-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={prendasIds.includes(prenda.id)}
                        onChange={() => seleccionarPrenda(prenda.id)}
                        className="accent-rose-600"
                      />

                      <div>
                        <p className="font-medium">{prenda.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {prenda.codigo} · {prenda.talla}
                        </p>
                      </div>
                    </div>

                    <span className="font-semibold text-gray-700">
                      {formatoPrecio(prenda.precio_venta)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-lg bg-rose-50 p-4">
            <span className="font-medium">Total estimado</span>
            <span className="text-xl font-bold text-rose-700">
              {formatoPrecio(totalEstimado)}
            </span>
          </div>

          <button
            type="submit"
            disabled={guardando || prendasIds.length === 0}
            className="mt-5 rounded-lg bg-rose-600 px-6 py-2 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {guardando ? "Registrando..." : "Confirmar venta"}
          </button>
        </form>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Historial de ventas</h3>

        {cargando ? (
          <p className="text-gray-500">Cargando ventas...</p>
        ) : ventas.length === 0 ? (
          <p className="text-gray-500">No hay ventas registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Total</th>
                </tr>
              </thead>

              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.id} className="border-t">
                    <td className="p-4">#{venta.id}</td>

                    <td className="p-4">{nombreCliente(venta.cliente_id)}</td>

                    <td className="p-4">
                      {venta.fecha
                        ? new Date(venta.fecha).toLocaleString("es-CO")
                        : "Sin fecha"}
                    </td>

                    <td className="p-4 font-medium">
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
