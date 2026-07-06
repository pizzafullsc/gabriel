function escaparHtml(valor) {

    return String(valor || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function mostrarComanda(datos) {

    const estado = datos.estado || "Nuevo";

    const items = (datos.pedido || "")
        .split("\n")
        .filter(i => i.trim() !== "")
        .map(i => `<li>${escaparHtml(i)}</li>`)
        .join("");

    const id = datos.firestoreId || datos.id || "";
    const puedeEntregar = id && estado === "Listo";
    const accionEntregar = puedeEntregar
        ? `
        <button type="button" data-entregar-id="${escaparHtml(id)}">
            Marcar como entregado
        </button>`
        : "";

    document.getElementById("pedido").innerHTML = `

    <div class="ticket">

        <div class="ticket-header">
            &#127829; COMANDA
        </div>

        <p><strong>&#128100; ${escaparHtml(datos.cliente)}</strong></p>
        <p>&#128222; ${escaparHtml(datos.telefono)}</p>
        <p>&#128205; ${escaparHtml(datos.direccion)}</p>

        <hr>

        <ul class="lista-pedido">
            ${items}
        </ul>

        <hr>

        <p>&#128179; ${escaparHtml(datos.pago)}</p>
        <p>&#128181; Cambio ${escaparHtml(datos.cambio)}</p>
        <p>&#128221; ${escaparHtml(datos.observaciones)}</p>

        <hr>

        <p class="estado-pedido">
            <strong>Estado:</strong>
            ${iconoEstado(estado)} ${escaparHtml(estado)}
        </p>

        ${accionEntregar}

    </div>
    `;

}

function actualizarHistorial(pedidos = [], alSeleccionarPedido) {

    const historial = document.getElementById("historial");

    if (!historial) return;

    if (pedidos.length === 0) {

        historial.innerHTML = "<p class='vacio'>Todavia no hay pedidos.</p>";
        return;

    }

    historial.innerHTML = "";

    pedidos.forEach(p => {

        const card = document.createElement("div");

        card.className = "item-historial";

        card.innerHTML = `

            <strong>${iconoEstado(p.estado || "Nuevo")} ${escaparHtml(p.cliente)}</strong><br>

            <small>${escaparHtml(p.fecha)}</small><br>

            ${escaparHtml(p.estado || "Nuevo")}

        `;

        card.addEventListener("click", () => {

            if (typeof alSeleccionarPedido === "function") {
                alSeleccionarPedido(p);
                return;
            }

            mostrarComanda(p);

        });

        historial.appendChild(card);

    });

}

function iconoEstado(e) {

    switch (e) {

        case "Preparando":
            return "&#128993;";

        case "Listo":
            return "&#128994;";

        case "Entregado":
            return "&#128309;";

        default:
            return "&#128308;";

    }

}
