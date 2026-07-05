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

        <div>👤 <strong>${datos.cliente}</strong></div>
        <div>📞 ${datos.telefono}</div>
        <div>📍 ${datos.direccion}</div>

        <hr>

        <h3>🛒 Pedido</h3>

        <ul class="lista-pedido">
            ${items}
        </ul>

        <hr>

        <div>💳 ${datos.pago}</div>
        <div>💵 Cambio: ${datos.cambio}</div>
        <div>📝 ${datos.observaciones}</div>

        <hr>

        <button onclick="cambiarEstado(${datos.id})">
            ${iconoEstado(datos.estado)} ${datos.estado}
        </button>

    </div>

    `;
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

    historial.innerHTML = pedidos.map(p => `

        <div class="item-historial"
             onclick="abrirPedido(${p.id})">

            <strong>${iconoEstado(p.estado)} ${p.cliente}</strong>

            <br>

            <small>${p.fecha}</small>

            <br>

            ${p.estado}

        </div>

    `).join("");

}

function abrirPedido(id){

    const pedido = Storage
        .obtener()
        .find(p=>p.id===id);

    if(!pedido) return;

    mostrarComanda(pedido);

}

function cambiarEstado(id){

    const pedido = Storage.cambiarEstado(id);

    if(!pedido) return;

    mostrarComanda(pedido);

    actualizarHistorial();

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