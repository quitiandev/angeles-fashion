import { useCallback, useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8000";

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const DIAS = ["L", "M", "M", "J", "V", "S", "D"];

const ESTADOS = {
  reservado: {
    nombre: "Reservado",
    clase: "bg-[#f4e8ef] text-[#85486e]",
    punto: "bg-[#85486e]",
  },
  activo: {
    nombre: "Activo",
    clase: "bg-[#e4f2ec] text-[#38745d]",
    punto: "bg-[#38745d]",
  },
  devuelto: {
    nombre: "Devuelto",
    clase: "bg-[#eeeeee] text-[#737373]",
    punto: "bg-[#a3a3a3]",
  },
};

function fechaLocal(valor) {
  if (!valor) return null;

  const fecha = String(valor).slice(0, 10);
  const [anio, mes, dia] = fecha.split("-").map(Number);

  if (!anio || !mes || !dia) return null;

  return new Date(anio, mes - 1, dia);
}

function formatoFecha(valor) {
  const fecha = fechaLocal(valor);

  return fecha
    ? fecha.toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Sin fecha";
}

function claveFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function CalendarioAlquileres({ token, irAAlquileres }) {
  const [mesActual, setMesActual] = useState(() => new Date());
  const [alquileres, setAlquileres] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarDatos = useCallback(async () => {
    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [respuestaAlquileres, respuestaClientes] = await Promise.all([
        fetch(`${API}/alquileres/`, { headers }),
        fetch(`${API}/clientes/`, { headers }),
      ]);

      if (!respuestaAlquileres.ok || !respuestaClientes.ok) {
        throw new Error("No se pudo consultar la información.");
      }

      const [datosAlquileres, datosClientes] = await Promise.all([
        respuestaAlquileres.json(),
        respuestaClientes.json(),
      ]);

      setAlquileres(Array.isArray(datosAlquileres) ? datosAlquileres : []);
      setClientes(Array.isArray(datosClientes) ? datosClientes : []);
      setError("");
    } catch (err) {
      setError(err.message || "Error al cargar el calendario.");
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargarDatos();

    const intervalo = setInterval(cargarDatos, 60000);

    return () => clearInterval(intervalo);
  }, [cargarDatos]);

  const clientesPorId = useMemo(
    () => new Map(clientes.map((cliente) => [cliente.id, cliente])),
    [clientes],
  );

  const alquileresValidos = useMemo(
    () =>
      alquileres.filter(
        (alquiler) =>
          alquiler.estado !== "cancelado" &&
          fechaLocal(alquiler.fecha_inicio) &&
          fechaLocal(alquiler.fecha_fin),
      ),
    [alquileres],
  );

  const anio = mesActual.getFullYear();
  const mes = mesActual.getMonth();

  const primerDia = new Date(anio, mes, 1);
  const desplazamiento = (primerDia.getDay() + 6) % 7;
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();

  const celdas = Array.from(
    { length: Math.ceil((desplazamiento + diasDelMes) / 7) * 7 },
    (_, indice) => {
      const numero = indice - desplazamiento + 1;

      return numero >= 1 && numero <= diasDelMes
        ? new Date(anio, mes, numero)
        : null;
    },
  );

  const hoy = claveFecha(new Date());

  function cambiarMes(direccion) {
    setMesActual(new Date(anio, mes + direccion, 1));
    setSeleccionado(null);
  }

  function alquileresDelDia(fecha) {
    if (!fecha) return [];

    const clave = claveFecha(fecha);

    return alquileresValidos.filter((alquiler) => {
      const inicio = String(alquiler.fecha_inicio).slice(0, 10);
      const fin = String(alquiler.fecha_fin).slice(0, 10);

      return clave >= inicio && clave <= fin;
    });
  }

  const alquileresSeleccionados = seleccionado
    ? alquileresDelDia(fechaLocal(seleccionado))
    : [];

  const totalReservados = alquileresValidos.filter(
    (alquiler) => alquiler.estado === "reservado",
  ).length;

  const totalActivos = alquileresValidos.filter(
    (alquiler) => alquiler.estado === "activo",
  ).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-[#eae6e3] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eeeae7] px-5 py-5 md:px-7">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-[#292524]">
            Calendario de alquileres
          </h3>
          <p className="mt-1 text-sm text-[#8a817d]">
            Reservas, entregas y devoluciones programadas.
          </p>
        </div>

        <button
          type="button"
          onClick={irAAlquileres}
          className="cursor-pointer rounded-lg bg-[#85486e] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#713a5d]"
        >
          Gestionar alquileres
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-7">
        <div className="flex items-center gap-3">
          <h4 className="min-w-40 text-lg font-semibold capitalize text-[#292524]">
            {MESES[mes]} {anio}
          </h4>

          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
            className="cursor-pointer rounded-lg border border-[#eae6e3] px-3 py-1.5 text-[#57534e] hover:bg-[#faf8f7]"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
            className="cursor-pointer rounded-lg border border-[#eae6e3] px-3 py-1.5 text-[#57534e] hover:bg-[#faf8f7]"
          >
            ›
          </button>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-[#78716c]">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#85486e]" />
            Reservado ({totalReservados})
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#38745d]" />
            Activo ({totalActivos})
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#a3a3a3]" />
            Devuelto
          </span>
        </div>
      </div>

      {error && (
        <div className="mx-5 mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 md:mx-7">
          {error}
          <button
            type="button"
            onClick={cargarDatos}
            className="ml-3 cursor-pointer font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="px-3 pb-5 md:px-7">
        <div className="grid grid-cols-7 border-b border-[#eae6e3]">
          {DIAS.map((dia, indice) => (
            <div
              key={indice}
              className="py-3 text-center text-xs font-semibold text-[#8a817d]"
            >
              {dia}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l border-[#eeeae7]">
          {celdas.map((fecha, indice) => {
            const clave = fecha ? claveFecha(fecha) : null;
            const eventos = alquileresDelDia(fecha);
            const esHoy = clave === hoy;
            const estaSeleccionado = clave === seleccionado;

            return (
              <button
                key={indice}
                type="button"
                disabled={!fecha}
                onClick={() => setSeleccionado(clave)}
                className={`min-h-19 border-r border-b border-[#eeeae7] p-1.5 text-left transition md:min-h-25 md:p-2 ${
                  fecha ? "cursor-pointer hover:bg-[#faf8f7]" : "bg-[#fcfbfa]"
                } ${estaSeleccionado ? "bg-[#faf0f5]" : ""}`}
              >
                {fecha && (
                  <>
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        esHoy
                          ? "bg-[#85486e] font-semibold text-white"
                          : "text-[#57534e]"
                      }`}
                    >
                      {fecha.getDate()}
                    </span>

                    <div className="mt-1 space-y-1">
                      {eventos.slice(0, 2).map((alquiler) => {
                        const estilo =
                          ESTADOS[alquiler.estado] || ESTADOS.reservado;

                        return (
                          <div
                            key={alquiler.id}
                            className={`truncate rounded px-1.5 py-1 text-[10px] font-medium ${estilo.clase}`}
                          >
                            <span className="hidden sm:inline">
                              #{alquiler.id} ·{" "}
                            </span>
                            {estilo.nombre}
                          </div>
                        );
                      })}

                      {eventos.length > 2 && (
                        <p className="text-[10px] text-[#78716c]">
                          +{eventos.length - 2} más
                        </p>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {seleccionado && (
        <div className="border-t border-[#eeeae7] bg-[#fcfbfa] px-5 py-5 md:px-7">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h4 className="font-semibold capitalize text-[#292524]">
              {formatoFecha(seleccionado)}
            </h4>

            <button
              type="button"
              onClick={() => setSeleccionado(null)}
              className="cursor-pointer text-sm text-[#78716c] hover:text-[#292524]"
            >
              Cerrar
            </button>
          </div>

          {alquileresSeleccionados.length === 0 ? (
            <p className="text-sm text-[#8a817d]">
              No hay alquileres programados para esta fecha.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {alquileresSeleccionados.map((alquiler) => {
                const cliente = clientesPorId.get(alquiler.cliente_id);
                const estilo = ESTADOS[alquiler.estado] || ESTADOS.reservado;

                return (
                  <div
                    key={alquiler.id}
                    className="rounded-xl border border-[#eae6e3] bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[#292524]">
                        Alquiler #{alquiler.id}
                      </span>

                      <span
                        className={`rounded-md px-2 py-1 text-xs font-medium ${estilo.clase}`}
                      >
                        {estilo.nombre}
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-[#57534e]">
                      Cliente:{" "}
                      <span className="font-medium">
                        {cliente
                          ? `${cliente.nombre} ${cliente.apellido}`
                          : `#${alquiler.cliente_id}`}
                      </span>
                    </p>

                    <p className="mt-1 text-xs text-[#8a817d]">
                      {formatoFecha(alquiler.fecha_inicio)} —{" "}
                      {formatoFecha(alquiler.fecha_fin)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eeeae7] px-5 py-4 md:px-7">
        <p className="text-xs text-[#8a817d]">
          {cargando
            ? "Cargando calendario..."
            : "Los datos se actualizan cada minuto"}
        </p>

        <button
          type="button"
          onClick={cargarDatos}
          className="cursor-pointer text-sm font-medium text-[#85486e] hover:underline"
        >
          Actualizar ahora
        </button>
      </div>
    </div>
  );
}

export default CalendarioAlquileres;
