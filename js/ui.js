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
        <p>💵 Cambio ${datos.cambio}</p>
        <p>📝 ${datos.observaciones}</p>

        <hr>

        <button id="btnEstado">
            ${iconoEstado(estado)} ${estado}
        </button>

    </div>
    `;

    if(datos.id){

        document
        .getElementById("btnEstado")
        .addEventListener("click",()=>{

            const pedido=Storage.cambiarEstado(datos.id);

            mostrarComanda(pedido);

            actualizarHistorial();

        });

    }

}

function actualizarHistorial(){

    const historial=document.getElementById("historial");

    const pedidos=Storage.obtener();

    if(!historial)return;

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

            <small>${p.fecha}</small><br>

            ${p.estado||"Nuevo"}

        `;

        card.addEventListener("click",()=>{

            mostrarComanda(p);

        });

        card.addEventListener("dblclick",()=>{

            Storage.cambiarEstado(p.id);

            actualizarHistorial();

        });

        historial.appendChild(card);

    });

}

function iconoEstado(e){

    switch(e){

        case "Preparando": return "🟡";

        case "Listo": return "🟢";

        case "Entregado": return "🔵";

        default: return "🔴";

    }

}