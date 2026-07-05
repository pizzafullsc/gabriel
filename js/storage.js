const Storage = {

    guardar(pedido){

        const pedidos = this.obtener();

        pedido.id = Date.now();
        pedido.fecha = new Date().toLocaleString("es-UY");
        pedido.estado = "Nuevo";

        pedidos.unshift(pedido);

        localStorage.setItem(
            "gabriel_pedidos",
            JSON.stringify(pedidos)
        );

    },

    obtener(){

        return JSON.parse(
            localStorage.getItem("gabriel_pedidos")
        ) || [];

    },

    borrar(){

        localStorage.removeItem("gabriel_pedidos");

    }

};