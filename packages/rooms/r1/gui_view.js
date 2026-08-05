class GUIView {
    #id;
    #components = new Map();
    #controller;
    #control;

    constructor(controller, cfg) {
        this.#id = cfg.id;
        this.#controller = controller;
        for (const componentCfg of cfg.components) {
            const component = new GUIComponent(this, componentCfg);
            this.#components.set(componentCfg.id, component);
        }
    }

    bindEntities() {
        for (const component of this.#components.values()) {
            component.bindEntities();
        }
    }

    link(entityId, updateCallback) {
        const callback = this.#controller.link(entityId, updateCallback);
        return callback;
    }

    assembleDom(cfg) {
        this.#control = document.createElement("div");
        this.#control.id = this.#id;
        this.#control.className = "view";

        for (const componentCfg of cfg.components) {
            const component = this.#components.get(componentCfg.id);

            if (!component) {
                console.warn(
                    `Component not found: ${componentCfg.id}`
                );
                continue;
            }

            this.#control.appendChild(component.assembleDom(componentCfg));
        }

        return this.#control;
    }
}