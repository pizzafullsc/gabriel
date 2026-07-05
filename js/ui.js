function actualizarHistorial() {

    const pedidos = Storage.obtener();

    const div = document.getElementById("historial");

    if (pedidos.length === 0) {
        div.innerHTML = "<p class='vacio'>Todavía no hay pedidos.</p>";
        return;
    }

    div.innerHTML = pedidos.map(p => {

        const cantidad = p.pedido
            .split("\n")
            .filter(x => x.trim() !== "")
            .length;

        return `
        <div class="item-historial">

            <strong>🔴 ${p.cliente}</strong><br>

            <small>${p.fecha}</small><br>

            🍕 ${cantidad} producto${cantidad>1?"s":""}

        </div>
        `;

    }).join("");

}