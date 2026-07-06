document.addEventListener("DOMContentLoaded", () => {

    Storage.suscribir(renderizarCocina, {
        incluirEntregados: false,
        direccion: "asc"
    });

});

document.getElementById("cocina").addEventListener("click", cambiarEstado);

function escaparHtml(valor) {

    return String(valor || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function renderizarCocina(pedidos) {

    const activos = pedidos.filter(p => p.estado !== "Entregado");
    const cocina = document.getElementById("cocina");

    document.getElementById("estado").textContent =
        "Pedidos activos: " + activos.length;

    cocina.innerHTML = "";

    activos.forEach(p => {

        const card = document.createElement("div");
        const estado = p.estado || "Nuevo";

        card.className = "tarjeta";

        if (estado === "Preparando") {
            card.classList.add("preparando");
        }

        if (estado === "Listo") {
            card.classList.add("listo");
        }

        card.innerHTML = `
            <h2>&#128100; ${escaparHtml(p.cliente)}</h2>

            <strong>${escaparHtml(estado)}</strong>

            <hr>

            <pre>${escaparHtml(p.pedido)}</pre>

            <hr>

            <div>&#128205; ${escaparHtml(p.direccion)}</div>

            <div>&#128179; ${escaparHtml(p.pago)}</div>

            <div>&#128221; ${escaparHtml(p.observaciones)}</div>

            ${botonesParaPedido(p)}
        `;

        cocina.appendChild(card);

    });

}

function botonesParaPedido(pedido) {

    const estado = pedido.estado || "Nuevo";
    const id = escaparHtml(pedido.firestoreId || pedido.id);

    if (estado === "Nuevo") {
        return `
            <div class="botones">
                <button class="preparar" data-estado="preparando" data-id="${id}">
                    &#9654; Preparando
                </button>
            </div>`;
    }

    if (estado === "Preparando") {
        return `
            <div class="botones">
                <button class="listo" data-estado="listo" data-id="${id}">
                    &#10004; Listo
                </button>
            </div>`;
    }

    return "";

}

async function cambiarEstado(event) {

    const boton = event.target.closest("[data-estado]");

    if (!boton) {
        return;
    }

    boton.disabled = true;

    try {

        if (boton.dataset.estado === "preparando") {
            await Storage.marcarPreparando(boton.dataset.id);
        }

        if (boton.dataset.estado === "listo") {
            await Storage.marcarListo(boton.dataset.id);
        }

    } catch (e) {

        console.error(e);
        alert("No se pudo actualizar el estado del pedido.");
        boton.disabled = false;

    }

}
