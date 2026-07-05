function mostrarComanda(datos) {

    const items = (datos.pedido || "")
        .split("\n")
        .filter(i => i.trim() !== "")
        .map(i => `<li>${i}</li>`)
        .join("");

    document.getElementById("pedido").innerHTML = `
        <div class="ticket">

            <div class="ticket-header">
                🍕 COMANDA
            </div>

            <p><strong>👤 ${datos.cliente}</strong></p>
            <p>📞 ${datos.telefono}</p>
            <p>📍 ${datos.direccion}</p>

            <hr>

            <h3>Pedido</h3>

            <ul class="lista-pedido">
                ${items}
            </ul>

            <hr>

            <p>💳 ${datos.pago}</p>
            <p>💵 Cambio ${datos.cambio}</p>
            <p>📝 ${datos.observaciones}</p>

            <hr>

            <button id="btnEstado">
                ${iconoEstado(datos.estado)} ${datos.estado}
            </button>

        </div>
    `;

    const boton = document.getElementById("btnEstado");

    if (datos.id) {

        boton.addEventListener("click", () => {

            const actualizado = Storage.cambiarEstado(datos.id);

            mostrarComanda(actualizado);

            actualizarHistorial();

        });

    }

}

function actualizarHistorial() {

    const pedidos = Storage.obtener();

    const historial = document.getElementById("historial");

    if (!historial) return;

    if (pedidos.length === 0) {

        historial.innerHTML =
            "<p class='vacio'>Todavía no hay pedidos.</p>";

        return;

    }

    historial.innerHTML = "";

    pedidos.forEach(pedido => {

        const tarjeta = document.createElement("div");

        tarjeta.className = "item-historial";

        tarjeta.innerHTML = `
            <strong>${iconoEstado(pedido.estado)} ${pedido.cliente}</strong><br>
            <small>${pedido.fecha}</small><br>
            ${pedido.estado}
        `;

        tarjeta.addEventListener("click", () => {

            mostrarComanda(pedido);

        });

        historial.appendChild(tarjeta);

    });

}

function iconoEstado(estado){

    switch(estado){

        case "Preparando":
            return "🟡";

        case "Listo":
            return "🟢";

        case "Entregado":
            return "🔵";

        default:
            return "🔴";

    }

}