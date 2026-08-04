class GUIEntity {
    #id;
    #entityId;
    #state;
    #widget;
    #stateCallback;
    #control;

    constructor(widget, cfg) {
        this.#widget = widget;
        this.#id = cfg.id;
        this.#entityId = cfg.entityId;
    }

    setState(state) {
        if (this.#state === state) {
            return;
        }

        this.#state = state;
        this.#triggerStateUpdateEvent();
    }

    get state() {
        return this.#state;
    }

    get id() {
        return this.#id;
    }

    get entityId() {
        return this.#entityId;
    }

    setStateCallback(callback) {
        this.#stateCallback = callback;
    }

    #triggerStateUpdateEvent() {        
        const state = this.state;

        if (!this.#stateCallback) {
            return;
        }

        this.#stateCallback(state);
    }

    async updateCallback(state) {
        if (this.#state === state) {
            return;
        }

        this.#state = state;

        this.#updateControlState(state);
    }

    assembleDom() {
        this.#control = document.createElement("span");
        this.#control.id = this.#id;
        this.#control.className = "entity";
        this.#control.textContent = this.#state;
        
        this.#control.onclick = () => {
            this.setState(
                this.state + 1
            );
            this.#updateControlState(this.state);
        };

        return this.#control;
    }

    #updateControlState(state) {
        if (this.#control) {
            this.#control.textContent = state;
        }
    }
}