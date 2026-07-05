const Storage = {

    guardar(pedido){

        const pedidos = JSON.parse(localStorage.getItem("gabriel_pedidos")) || [];

        pedido.id = Date.now();

        pedido.fecha = new Date().toLocaleString("es-UY");

        pedidos.unshift(pedido);

        localStorage.setItem("gabriel_pedidos", JSON.stringify(pedidos));

    },

    obtener(){

        return JSON.parse(localStorage.getItem("gabriel_pedidos")) || [];

    }

};