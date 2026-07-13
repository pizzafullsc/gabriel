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
    const tipo = datos.tipo || datos.tipoPedido || "Delivery";
    const ubicacionEtiqueta = datos.tipoPedido === "dine-in" ? "Mesa" : "Dirección";
    const referencia = datos.referencia
        ? `<p><strong>Referencia:</strong> ${escaparHtml(datos.referencia)}</p>`
        : "";

    const items = lineasPedidoCompatibles(datos)
        .map(i => `<li>${escaparHtml(i)}</li>`)
        .join("");

    const id = datos.firestoreId || datos.id || "";
    const puedeEntregar = id && estado === "Listo";
    const puedeCancelar = id && estado !== "Entregado" && estado !== "Cancelado";
    const puedeEditar = id && estado !== "Entregado" && estado !== "Cancelado";
    const puedeImprimir = id || datos.cliente || datos.pedido;
    const accionEditar = puedeEditar
        ? `
        <button type="button" data-editar-pedido>
            Editar pedido
        </button>`
        : "";
    const accionImprimir = puedeImprimir
        ? `
        <button type="button" data-imprimir-cocina>
            &#128424; Imprimir cocina
        </button>
        <button type="button" data-imprimir-caja>
            &#128424; Imprimir caja
        </button>`
        : "";
    const accionEntregar = puedeEntregar
        ? `
        <button type="button" data-entregar-id="${escaparHtml(id)}">
            Marcar como entregado
        </button>`
        : "";
    const accionCancelar = puedeCancelar
        ? `
        <button type="button" data-cancelar-id="${escaparHtml(id)}">
            Cancelar pedido
        </button>`
        : "";

    document.getElementById("pedido").innerHTML = `

    <div class="ticket">

        <div class="ticket-header">
            &#127829; COMANDA
        </div>

        <p><strong>${escaparHtml(tipo)}</strong></p>
        <p><strong>Cliente:</strong> ${escaparHtml(datos.cliente)}</p>
        <p><strong>Teléfono:</strong> ${escaparHtml(datos.telefono)}</p>
        <p><strong>${ubicacionEtiqueta}:</strong> ${escaparHtml(datos.direccion)}</p>
        ${referencia}

        <hr>

        <ul class="lista-pedido">
            ${items}
        </ul>

        <hr>

        <p><strong>Pago:</strong> ${escaparHtml(datos.pago)}</p>
        <p><strong>Vuelto para:</strong> ${escaparHtml(datos.cambio)}</p>
        <p><strong>Notas de cocina:</strong> ${escaparHtml(datos.observaciones)}</p>

        <hr>

        <p class="estado-pedido">
            <strong>Estado:</strong>
            ${iconoEstado(estado)} ${escaparHtml(estado)}
        </p>

        ${accionEntregar}
        ${accionCancelar}
        ${accionEditar}
        ${accionImprimir}

    </div>
    `;

}

function lineasPedidoCompatibles(datos) {

    if (Array.isArray(datos.items) && datos.items.length > 0) {
        return datos.items.map(item => `${item.cantidad}x ${item.nombre}`);
    }

    return String(datos.pedido || "")
        .split("\n")
        .map(item => item.trim())
        .filter(Boolean);

}

function actualizarHistorial(pedidos = [], alSeleccionarPedido) {

    const historial = document.getElementById("historial");

    if (!historial) return;

    if (pedidos.length === 0) {

        historial.innerHTML = "<p class='vacio'>Todavía no hay pedidos.</p>";
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

        case "Cancelado":
            return "&#9899;";

        default:
            return "&#128308;";

    }

}
