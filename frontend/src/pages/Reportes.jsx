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

function Indicador({ titulo, valor, descripcion, destacado = false }) {
  return (
    <div
      className={`rounded-xl border p-5 md:p-6 ${destacado ? "border-[#dbc4d1] bg-[#fbf5f8]" : "border-[#eae6e3] bg-white"}`}
    >
      <p className="text-xs font-medium tracking-wide text-[#817772]">
        {titulo}
      </p>
      <p
        className={`mt-3 break-words text-2xl font-semibold tracking-tight md:text-3xl ${destacado ? "text-[#85486e]" : "text-[#292524]"}`}
      >
        {valor}
      </p>
      {descripcion && (
        <p className="mt-2 text-xs leading-relaxed text-[#958b85]">
          {descripcion}
        </p>
      )}
    </div>
  );
}

function Distribucion({ datos, total, titulo }) {
  const entradas = Object.entries(datos ?? {});
  return (
    <div className="rounded-xl border border-[#eae6e3] bg-white p-5 md:p-7">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 className="font-semibold text-[#292524]">{titulo}</h3>
        <span className="text-xs text-[#958b85]">{total} en total</span>
      </div>
      {entradas.length === 0 ? (
        <p className="text-sm text-[#958b85]">No hay información disponible.</p>
      ) : (
        <div className="space-y-5">
          {entradas.map(([estado, cantidad]) => {
            const porcentaje = total > 0 ? (cantidad / total) * 100 : 0;
            return (
              <div key={estado}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-[#57534e]">
                    {formatoEstado(estado)}
                  </span>
                  <span className="tabular-nums text-[#817772]">
                    {cantidad}{" "}
                    <span className="text-[#aaa19b]">
                      · {porcentaje.toFixed(1)}%
                    </span>
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f1eeeb]">
                  <div
                    className="h-full rounded-full bg-[#85486e] transition-all duration-300"
                    style={{ width: `${porcentaje}%` }}
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#85486e]">
            Análisis de operaciones
          </p>
          <h2 className="text-2xl font-semibold tracking-tight text-[#292524] md:text-3xl">
            Reportes y estadísticas
          </h2>
          <p className="mt-2 text-sm text-[#817772]">
            Una visión clara del inventario, las ventas y los alquileres.
          </p>
        </div>
        <button
          type="button"
          onClick={actualizarReportes}
          disabled={cargando || actualizando}
          className="cursor-pointer rounded-lg border border-[#dbc4d1] bg-white px-4 py-2.5 text-sm font-medium text-[#85486e] transition hover:bg-[#fbf5f8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {actualizando ? "Actualizando..." : "↻  Actualizar reportes"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {cargando ? (
        <div className="rounded-xl border border-[#eae6e3] bg-white p-8 text-sm text-[#817772]">
          Cargando estadísticas...
        </div>
      ) : !inventario || !ventas || !alquileres ? (
        <div className="rounded-xl border border-[#eae6e3] bg-white p-8 text-sm text-[#817772]">
          No fue posible cargar los reportes.
        </div>
      ) : (
        <>
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#a69a94]">
                  01 / INVENTARIO
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#292524]">
                  Estado de las prendas
                </h3>
              </div>
              <p className="hidden text-xs text-[#958b85] sm:block">
                Disponibilidad actual
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Indicador
                titulo="Total de prendas"
                valor={inventario.total_prendas}
                descripcion="Prendas registradas"
                destacado
              />
              <Indicador
                titulo="Disponibles"
                valor={inventario.prendas_por_estado?.disponible ?? 0}
                descripcion="Listas para venta o alquiler"
              />
              <Indicador
                titulo="Alquiladas"
                valor={inventario.prendas_por_estado?.alquilada ?? 0}
                descripcion="Actualmente en alquiler"
              />
              <Indicador
                titulo="Vendidas"
                valor={inventario.prendas_por_estado?.vendida ?? 0}
                descripcion="Prendas vendidas"
              />
            </div>
            <Distribucion
              titulo="Distribución por estado"
              datos={inventario.prendas_por_estado}
              total={inventario.total_prendas}
            />
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#a69a94]">02 / VENTAS</p>
              <h3 className="mt-1 text-lg font-semibold text-[#292524]">
                Actividad comercial
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Indicador
                titulo="Ventas registradas"
                valor={ventas.total_ventas}
                descripcion="Operaciones realizadas"
              />
              <Indicador
                titulo="Prendas vendidas"
                valor={ventas.prendas_vendidas}
                descripcion="Unidades vendidas"
              />
              <Indicador
                titulo="Valor de ventas"
                valor={formatoPrecio(ventas.ingresos_totales)}
                descripcion="Total acumulado de ventas"
                destacado
              />
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <p className="text-xs font-medium text-[#a69a94]">
                03 / ALQUILERES
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[#292524]">
                Reservas y movimientos
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Indicador
                titulo="Alquileres registrados"
                valor={alquileres.total_alquileres}
                descripcion="Total de operaciones"
              />
              <Indicador
                titulo="Alquileres activos"
                valor={alquileres.alquileres_por_estado?.activo ?? 0}
                descripcion="Actualmente en curso"
              />
              <Indicador
                titulo="Valor registrado"
                valor={formatoPrecio(alquileres.ingresos_registrados)}
                descripcion="Total informado por el backend"
                destacado
              />
            </div>
            <Distribucion
              titulo="Distribución por estado"
              datos={alquileres.alquileres_por_estado}
              total={alquileres.total_alquileres}
            />
          </section>

          <section className="overflow-hidden rounded-xl border border-[#e5d8df] bg-white">
            <div className="border-b border-[#eeeae7] px-5 py-5 md:px-7">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#85486e]">
                04 / RESUMEN
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[#292524]">
                Resumen financiero
              </h3>
              <p className="mt-1 text-sm text-[#958b85]">
                Valores acumulados registrados en el sistema.
              </p>
            </div>
            <div className="grid gap-0 md:grid-cols-3">
              <div className="border-b border-[#eeeae7] p-5 md:border-r md:border-b-0 md:p-7">
                <p className="text-sm text-[#817772]">Ingresos por ventas</p>
                <p className="mt-2 break-words text-xl font-semibold text-[#292524]">
                  {formatoPrecio(ventas.ingresos_totales)}
                </p>
              </div>
              <div className="border-b border-[#eeeae7] p-5 md:border-r md:border-b-0 md:p-7">
                <p className="text-sm text-[#817772]">
                  Ingresos registrados por alquileres
                </p>
                <p className="mt-2 break-words text-xl font-semibold text-[#292524]">
                  {formatoPrecio(alquileres.ingresos_registrados)}
                </p>
              </div>
              <div className="bg-[#fbf5f8] p-5 md:p-7">
                <p className="text-sm font-medium text-[#85486e]">
                  Total combinado registrado
                </p>
                <p className="mt-2 break-words text-2xl font-semibold tracking-tight text-[#85486e]">
                  {formatoPrecio(
                    Number(ventas.ingresos_totales ?? 0) +
                      Number(alquileres.ingresos_registrados ?? 0),
                  )}
                </p>
              </div>
            </div>
            <p className="border-t border-[#eeeae7] px-5 py-4 text-xs leading-relaxed text-[#958b85] md:px-7">
              Los valores corresponden a los totales proporcionados por el
              backend. El total combinado no representa necesariamente dinero
              efectivamente cobrado
            </p>
          </section>
        </>
      )}
    </div>
  );
}
