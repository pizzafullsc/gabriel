function mostrarComanda(datos){

    const items = (datos.pedido || "")
        .split("\n")
        .filter(l => l.trim() !== "")
        .map(l => `<li>${l}</li>`)
        .join("");

    document.getElementById("pedido").innerHTML = `

        <div class="ticket">

            <div class="ticket-header">
                🍕 COMANDA
            </div>

            <div class="cliente">
                👤 ${datos.cliente}
            </div>

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

        </div>

    `;
}