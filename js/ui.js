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

            <hr>

            <div><strong>Estado:</strong> ${iconoEstado(datos.estado)} ${datos.estado}</div>

        </div>
    `;

}

function actualizarHistorial(){

    const pedidos=Storage.obtener();

    const div=document.getElementById("historial");

    if(!div)return;

    if(pedidos.length===0){

        div.innerHTML="<p class='vacio'>Todavía no hay pedidos.</p>";

        return;

    }

    div.innerHTML=pedidos.map((p,index)=>{

        const cantidad=(p.pedido||"")
            .split("\n")
            .filter(x=>x.trim()!="")
            .length;

        return `

        <div class="item-historial"
             onclick="abrirPedido(${index})">

            <strong>${iconoEstado(p.estado)} ${p.cliente}</strong><br>

            <small>${p.fecha}</small><br>

            🍕 ${cantidad} producto${cantidad!=1?"s":""}<br>

            Estado: ${p.estado}

        </div>

        `;

    }).join("");

}

function abrirPedido(indice){

    const pedidos=Storage.obtener();

    if(!pedidos[indice]) return;

    mostrarComanda(pedidos[indice]);

}

function iconoEstado(estado){

    switch(estado){

        case "Preparando": return "🟡";
        case "Listo": return "🟢";
        case "Entregado": return "🔵";
        default: return "🔴";

    }

}

function mostrarMensaje(texto,tipo="ok"){

    let aviso=document.getElementById("toast");

    if(!aviso){

        aviso=document.createElement("div");

        aviso.id="toast";

        document.body.appendChild(aviso);

    }

    aviso.className=tipo;

    aviso.innerHTML=texto;

    aviso.style.display="block";

    clearTimeout(aviso.timer);

    aviso.timer=setTimeout(()=>{

        aviso.style.display="none";

    },2500);

}