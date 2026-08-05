class GUIComponent {
    #id;
    #entities = new Map();
    #view;
    #control;

    constructor(view, cfg) {
        this.#id = cfg.id;
        this.#view = view;
        for (const entityCfg of cfg.entities) {
            const entity = new GUIEntity(this, entityCfg);
            this.#entities.set(entityCfg.id, entity);
        }
    }

    /*
    * Loads the entities for the component based on the provided configuration.
    */
    bindEntities() {
        for (const entity of this.#entities.values()) {
            const deviceCallback = this.#view.link(entity.entityId, entity.updateCallback.bind(entity));
            entity.setStateCallback(deviceCallback);
        }
    }

    assembleDom(cfg) {
        this.#control = document.createElement("div");
        this.#control.id = this.#id;
        this.#control.className = "component";

        switch (cfg.type) {
            case "toggle":
                this.#control.appendChild(this.#createToggle(cfg));
                break;

            default:
                console.warn(`Unknown component type: ${cfg.type}`);
        }

        return this.#control;
    }

    #createToggle(cfg) {
        const entityCfg = cfg.entities[0];
        const entity = this.#entities.get(entityCfg.id);


        if (!entity) {
            console.warn(
                `Entity not found: ${entityCfg.id}`
            );
            return document.createElement("span");
        }

        const button = document.createElement("button");
        button.className = "toggleButton";

        const refresh = state => {button.textContent = state ? "ON" : "OFF";};
        entity.addListener(refresh);
        refresh(entity.state);

        button.onclick = () => {
            entity.setState(!entity.state);
        };

        return button;
    }

}