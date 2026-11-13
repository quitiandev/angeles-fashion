import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

const formatoPrecio = (valor) =>
  Number(valor ?? 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });

const formatoEstado = (estado) =>
  estado.replaceAll("_", " ").replace(/^./, (letra) => letra.toUpperCase());

function Tarjeta({ titulo, valor, descripcion, color = "rose" }) {
  const colores = {
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    purple: "border-purple-200 bg-purple-50 text-purple-700",
  };

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${colores[color]}`}>
      <p className="text-sm font-medium">{titulo}</p>
      <p className="mt-3 break-words text-2xl font-bold">{valor}</p>
      {descripcion && <p className="mt-2 text-xs opacity-80">{descripcion}</p>}
    </div>
  );
}

function Distribucion({ datos, total, titulo }) {
  const entradas = Object.entries(datos ?? {});

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-semibold text-gray-800">{titulo}</h3>

      {entradas.length === 0 ? (
        <p className="text-gray-500">No hay información disponible.</p>
      ) : (
        <div className="space-y-5">
          {entradas.map(([estado, cantidad]) => {
            const porcentaje = total > 0 ? (cantidad / total) * 100 : 0;

            return (
              <div key={estado}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="font-medium text-gray-700">
                    {formatoEstado(estado)}
                  </span>

                  <span className="text-gray-500">
                    {cantidad} ({porcentaje.toFixed(1)}%)
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-[#85486e]"
                    style={{
                      width: `${porcentaje}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Reportes({ token }) {
  const [inventario, setInventario] = useState(null);
  const [ventas, setVentas] = useState(null);
  const [alquileres, setAlquileres] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState("");

  const solicitar = async (ruta, signal) => {
    const respuesta = await fetch(`${API}${ruta}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal,
    });

    if (!respuesta.ok) {
      const datos = await respuesta.json().catch(() => ({}));

      throw new Error(
        typeof datos.detail === "string"
          ? datos.detail
          : `Error al consultar ${ruta}`,
      );
    }

    return respuesta.json();
  };

  const cargarReportes = async (signal) => {
    const [datosInventario, datosVentas, datosAlquileres] = await Promise.all([
      solicitar("/reportes/inventario", signal),
      solicitar("/reportes/ventas", signal),
      solicitar("/reportes/alquileres", signal),
    ]);

    return {
      inventario: datosInventario,
      ventas: datosVentas,
      alquileres: datosAlquileres,
    };
  };

  useEffect(() => {
    const controlador = new AbortController();

    const iniciar = async () => {
      try {
        setCargando(true);
        setError("");

        const datos = await cargarReportes(controlador.signal);

        if (!controlador.signal.aborted) {
          setInventario(datos.inventario);
          setVentas(datos.ventas);
          setAlquileres(datos.alquileres);
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

    iniciar();

    return () => controlador.abort();
  }, [token]);

  const actualizarReportes = async () => {
    setActualizando(true);
    setError("");

    try {
      const datos = await cargarReportes();

      setInventario(datos.inventario);
      setVentas(datos.ventas);
      setAlquileres(datos.alquileres);
    } catch (err) {
      setError(err.message);
    } finally {
      setActualizando(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Reportes y estadísticas
          </h2>

          <p className="mt-1 text-gray-500">
            Resumen general de las operaciones de Ángeles Fashion.
          </p>
        </div>

        <button
          type="button"
          onClick={actualizarReportes}
          disabled={cargando || actualizando}
          className="rounded-lg bg-rose-600 px-5 py-2 text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {actualizando ? "Actualizando..." : "Actualizar reportes"}
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      {cargando ? (
        <div className="rounded-xl bg-white p-8 text-gray-500">
          Cargando estadísticas...
        </div>
      ) : !inventario || !ventas || !alquileres ? (
        <div className="rounded-xl bg-white p-8 text-gray-500">
          No fue posible cargar los reportes.
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <h3 className="text-xl font-bold text-[#85486e]">Inventario</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tarjeta
                titulo="Total de prendas"
                valor={inventario.total_prendas}
                descripcion="Prendas registradas"
                color="rose"
              />

              <Tarjeta
                titulo="Disponibles"
                valor={inventario.prendas_por_estado?.disponible ?? 0}
                descripcion="Listas para venta o alquiler"
                color="green"
              />

              <Tarjeta
                titulo="Alquiladas"
                valor={inventario.prendas_por_estado?.alquilada ?? 0}
                descripcion="Prendas en alquiler"
                color="blue"
              />

              <Tarjeta
                titulo="Vendidas"
                valor={inventario.prendas_por_estado?.vendida ?? 0}
                descripcion="Prendas marcadas como vendidas"
                color="purple"
              />
            </div>

            <Distribucion
              titulo="Distribución del inventario por estado"
              datos={inventario.prendas_por_estado}
              total={inventario.total_prendas}
            />
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-[#85486e]">Ventas</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Tarjeta
                titulo="Ventas registradas"
                valor={ventas.total_ventas}
                descripcion="Operaciones de venta"
                color="rose"
              />

              <Tarjeta
                titulo="Prendas vendidas"
                valor={ventas.prendas_vendidas}
                descripcion="Unidades vendidas"
                color="blue"
              />

              <Tarjeta
                titulo="Ingresos por ventas"
                valor={formatoPrecio(ventas.ingresos_totales)}
                descripcion="Valor acumulado de ventas"
                color="green"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-xl font-bold text-[#85486e]">Alquileres</h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Tarjeta
                titulo="Alquileres registrados"
                valor={alquileres.total_alquileres}
                descripcion="Total de operaciones"
                color="rose"
              />

              <Tarjeta
                titulo="Alquileres activos"
                valor={alquileres.alquileres_por_estado?.activo ?? 0}
                descripcion="Actualmente activos"
                color="blue"
              />

              <Tarjeta
                titulo="Ingresos registrados"
                valor={formatoPrecio(alquileres.ingresos_registrados)}
                descripcion="Valor informado por el backend"
                color="green"
              />
            </div>

            <Distribucion
              titulo="Distribución de alquileres por estado"
              datos={alquileres.alquileres_por_estado}
              total={alquileres.total_alquileres}
            />
          </section>

          <section className="rounded-xl border border-rose-100 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800">
              Resumen financiero
            </h3>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Ingresos por ventas</p>
                <p className="mt-1 text-xl font-bold">
                  {formatoPrecio(ventas.ingresos_totales)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Ingresos registrados por alquileres
                </p>
                <p className="mt-1 text-xl font-bold">
                  {formatoPrecio(alquileres.ingresos_registrados)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Total combinado registrado
                </p>
                <p className="mt-1 text-xl font-bold text-[#85486e]">
                  {formatoPrecio(
                    Number(ventas.ingresos_totales ?? 0) +
                      Number(alquileres.ingresos_registrados ?? 0),
                  )}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Los valores corresponden a los totales proporcionados por el
              backend. El total combinado no representa necesariamente dinero
              efectivamente cobrado.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
