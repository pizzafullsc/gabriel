(function (global) {

    const DATA_PATH = "datos";
    const RESOURCE_FILES = {
        categorias: "categorias.json",
        productos: "productos.json",
        gustos: "gustos.json",
        adicionales: "adicionales.json",
        bebidas: "bebidas.json",
        promociones: "promociones.json"
    };

    function clonar(valor) {

        return JSON.parse(JSON.stringify(valor));

    }

    function normalizarTexto(valor) {

        return String(valor || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .trim();

    }

    function ordenarPorOrdenYNombre(a, b) {

        const tieneOrdenA = Object.prototype.hasOwnProperty.call(a, "orden");
        const tieneOrdenB = Object.prototype.hasOwnProperty.call(b, "orden");

        if (!tieneOrdenA && !tieneOrdenB) {
            return 0;
        }

        const ordenA = Number(a.orden || 0);
        const ordenB = Number(b.orden || 0);

        if (ordenA !== ordenB) {
            return ordenA - ordenB;
        }

        return 0;

    }

    function crearIndice(lista) {

        return new Map(lista.map(item => [String(item.id), item]));

    }

    class JsonMenuRepository {

        constructor(basePath = DATA_PATH) {

            this.basePath = basePath;

        }

        async leerJson(nombreArchivo) {

            const respuesta = await fetch(`${this.basePath}/${nombreArchivo}`, {
                cache: "no-store"
            });

            if (!respuesta.ok) {
                throw new Error(`No se pudo cargar ${nombreArchivo}: HTTP ${respuesta.status}`);
            }

            return respuesta.json();

        }

        async obtenerCatalogo() {

            const [
                categorias,
                productos,
                gustos,
                adicionales,
                bebidas,
                promociones
            ] = await Promise.all([
                this.leerJson(RESOURCE_FILES.categorias),
                this.leerJson(RESOURCE_FILES.productos),
                this.leerJson(RESOURCE_FILES.gustos),
                this.leerJson(RESOURCE_FILES.adicionales),
                this.leerJson(RESOURCE_FILES.bebidas),
                this.leerJson(RESOURCE_FILES.promociones)
            ]);

            return {
                categorias,
                productos,
                gustos,
                adicionales,
                bebidas,
                promociones
            };

        }

    }

    const MenuService = {

        repositorio: new JsonMenuRepository(),
        inicializado: false,
        catalogo: {
            categorias: [],
            productos: [],
            gustos: [],
            adicionales: {},
            bebidas: [],
            promociones: []
        },
        indices: {
            categorias: new Map(),
            productos: new Map()
        },

        configurarRepositorio(repositorio) {

            if (!repositorio || typeof repositorio.obtenerCatalogo !== "function") {
                throw new Error("El repositorio del menu debe implementar obtenerCatalogo().");
            }

            this.repositorio = repositorio;
            this.inicializado = false;

        },

        async init() {

            const datos = await this.repositorio.obtenerCatalogo();
            this.catalogo = this.normalizarCatalogo(datos);
            this.indices = {
                categorias: crearIndice(this.catalogo.categorias),
                productos: crearIndice(this.getProductosInterno())
            };
            this.inicializado = true;

            return this;

        },

        normalizarCatalogo(datos) {

            const categorias = Array.isArray(datos.categorias) ? datos.categorias : [];
            const productos = Array.isArray(datos.productos) ? datos.productos : [];
            const gustos = Array.isArray(datos.gustos) ? datos.gustos : [];
            const bebidas = Array.isArray(datos.bebidas) ? datos.bebidas : [];
            const promociones = Array.isArray(datos.promociones) ? datos.promociones : [];

            return {
                categorias: categorias.slice().sort(ordenarPorOrdenYNombre),
                productos: productos.slice().sort(ordenarPorOrdenYNombre),
                gustos: gustos.slice().sort(ordenarPorOrdenYNombre),
                adicionales: datos.adicionales || {},
                bebidas: bebidas.slice().sort(ordenarPorOrdenYNombre),
                promociones: promociones.slice().sort(ordenarPorOrdenYNombre)
            };

        },

        asegurarInicializado() {

            if (!this.inicializado) {
                throw new Error("MenuService no esta inicializado. Ejecuta MenuService.init() primero.");
            }

        },

        getProductosInterno() {

            return [
                ...this.catalogo.productos,
                ...this.catalogo.bebidas
            ].sort(ordenarPorOrdenYNombre);

        },

        getCategorias() {

            this.asegurarInicializado();
            return clonar(this.catalogo.categorias);

        },

        getCategoria(id) {

            this.asegurarInicializado();
            return clonar(this.indices.categorias.get(String(id)) || null);

        },

        getProductos() {

            this.asegurarInicializado();
            return clonar(this.getProductosInterno());

        },

        getProducto(id) {

            this.asegurarInicializado();
            return clonar(this.indices.productos.get(String(id)) || null);

        },

        getProductosPorCategoria(id) {

            this.asegurarInicializado();

            return clonar(
                this.getProductosInterno()
                    .filter(producto => producto.categoria === id)
            );

        },

        getPresentaciones(id) {

            const producto = this.getProducto(id);
            return clonar(producto && Array.isArray(producto.presentaciones)
                ? producto.presentaciones
                : []);

        },

        getPrecio(producto, presentacion) {

            this.asegurarInicializado();

            const item = typeof producto === "string"
                ? this.indices.productos.get(producto)
                : producto;

            if (!item) {
                return 0;
            }

            const presentacionId = typeof presentacion === "string"
                ? presentacion
                : presentacion && presentacion.id;

            const seleccionada = (item.presentaciones || [])
                .find(opcion => opcion.id === presentacionId);

            return Number(seleccionada ? seleccionada.precio : 0);

        },

        getGustos() {

            this.asegurarInicializado();
            return clonar(this.catalogo.gustos);

        },

        getBebidas() {

            this.asegurarInicializado();
            return clonar(this.catalogo.bebidas);

        },

        getPromociones() {

            this.asegurarInicializado();
            return clonar(this.catalogo.promociones);

        },

        calcularPrecio(productoId, presentacionId, cantidadGustos = 0) {

            this.asegurarInicializado();

            const producto = this.indices.productos.get(String(productoId));

            if (!producto) {
                return 0;
            }

            const base = this.getPrecio(producto, presentacionId);
            const incluidos = this.gustosIncluidos(producto, presentacionId);
            const gustosExtra = Math.max(0, Number(cantidadGustos || 0) - incluidos);

            return base + this.costoAdicional(presentacionId, gustosExtra);

        },

        calcularSubtotal(productoId, presentacionId, cantidadGustos = 0, cantidad = 1) {

            const precioUnitario = this.calcularPrecio(productoId, presentacionId, cantidadGustos);

            return this.calcularSubtotalPorCantidad(precioUnitario, cantidad);

        },

        calcularSubtotalPorCantidad(precioUnitario, cantidad = 1) {

            const unidades = Math.max(1, Math.floor(Number(cantidad || 1)));

            return Number(precioUnitario || 0) * unidades;

        },

        gustosIncluidos(producto, presentacionId) {

            const porProducto = Number(producto.gustosIncluidos || 0);
            const porPresentacion = Number(
                (this.catalogo.adicionales[presentacionId] || {}).incluidos || 0
            );

            return Math.max(porProducto, porPresentacion);

        },

        costoAdicional(presentacionId, cantidadGustos) {

            const cantidad = Number(cantidadGustos || 0);
            const tabla = this.catalogo.adicionales[presentacionId] || {};

            if (cantidad <= 0) {
                return 0;
            }

            if (Object.prototype.hasOwnProperty.call(tabla, String(cantidad))) {
                return Number(tabla[String(cantidad)] || 0);
            }

            const tramo = Object.keys(tabla)
                .map(Number)
                .filter(numero => Number.isFinite(numero) && numero <= cantidad)
                .sort((a, b) => a - b)
                .pop();

            return Number(tabla[String(tramo)] || 0);

        },

        buscar(termino) {

            this.asegurarInicializado();

            const busqueda = normalizarTexto(termino);

            if (!busqueda) {
                return this.getProductos();
            }

            const resultados = this.getProductosInterno()
                .filter(producto => this.coincideProducto(producto, busqueda))
                .sort(ordenarPorOrdenYNombre);

            return clonar(resultados);

        },

        coincideProducto(producto, busqueda) {

            const categoria = this.indices.categorias.get(producto.categoria);
            const campos = [
                producto.id,
                producto.nombre,
                producto.descripcion,
                categoria && categoria.nombre,
                ...(producto.presentaciones || []).map(presentacion => presentacion.nombre)
            ];

            return campos
                .map(normalizarTexto)
                .some(valor => valor.includes(busqueda));

        }

    };

    MenuService.JsonMenuRepository = JsonMenuRepository;
    global.MenuService = MenuService;

})(window);
