class GUIEntity {
    #id;
    #entityId;
    #state;
    #component;
    #stateCallback;
    #componentListeners = [];

    constructor(component, cfg) {
        this.#component = component;
        this.#id = cfg.id;
        this.#entityId = cfg.entityId;
    }


    addListener(listener) {
        this.#componentListeners.push(listener);
    }

    #notifyListeners() {
        for (const listener of this.#componentListeners) {
            listener(this.#state);
        }
    }

    setState(state) {
        if (this.#state === state) {
            return;
        }

        this.#state = state;
        this.#triggerStateUpdateEvent();
        this.#notifyListeners();
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
        this.#notifyListeners();
    }
}