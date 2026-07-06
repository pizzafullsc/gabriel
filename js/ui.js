function mostrarComanda(datos){

    const estado = datos.estado || "Nuevo";

    const items=(datos.pedido||"")
        .split("\n")
        .filter(i=>i.trim()!="")
        .map(i=>`<li>${i}</li>`)
        .join("");

    document.getElementById("pedido").innerHTML=`

    <div class="ticket">

        <div class="ticket-header">
            🍕 COMANDA
        </div>

        <p><strong>👤 ${datos.cliente}</strong></p>
        <p>📞 ${datos.telefono}</p>
        <p>📍 ${datos.direccion}</p>

        <hr>

        <ul class="lista-pedido">
            ${items}
        </ul>

        <hr>

        <p>💳 ${datos.pago}</p>
        <p>💵 Cambio ${datos.cambio||""}</p>
        <p>📝 ${datos.observaciones||""}</p>

        <hr>

        <p class="estado-pedido">
            <strong>Estado:</strong>
            ${iconoEstado(estado)} ${estado}
        </p>

    </div>
    `;

}

function actualizarHistorial(){

    const historial=document.getElementById("historial");

    if(!historial)return;

    const pedidos=Storage.obtener();

    if(pedidos.length===0){

        historial.innerHTML="<p class='vacio'>Todavía no hay pedidos.</p>";
        return;

    }

    historial.innerHTML="";

    pedidos.forEach(p=>{

        const card=document.createElement("div");

        card.className="item-historial";

        card.innerHTML=`

            <strong>${iconoEstado(p.estado||"Nuevo")} ${p.cliente}</strong><br>

            <small>${p.fecha||""}</small><br>

            ${p.estado||"Nuevo"}

        `;

        card.addEventListener("click",()=>{

            mostrarComanda(p);

        });

        historial.appendChild(card);

    });

}

function iconoEstado(e){

    switch(e){

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