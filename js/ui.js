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

        </div>

    `;
}

function actualizarHistorial(){

    if(typeof Storage.obtener !== "function"){
        return;
    }

    const pedidos = Storage.obtener();

    const div = document.getElementById("historial");

    if(!div){
        return;
    }

    if(pedidos.length===0){

        div.innerHTML="<p class='vacio'>Todavía no hay pedidos.</p>";

        return;

    }

    div.innerHTML=pedidos.map(p=>{

        const cantidad=(p.pedido||"")
            .split("\n")
            .filter(x=>x.trim()!=="")
            .length;

        return `
            <div class="item-historial">
                <strong>🔴 ${p.cliente}</strong><br>
                <small>${p.fecha}</small><br>
                🍕 ${cantidad} producto${cantidad!==1?"s":""}
            </div>
        `;

    }).join("");

}