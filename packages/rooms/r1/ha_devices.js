class HADevice {
    #entity;
    #store;
    #listeners = []; // Set of callback functions to notify when state changes
    #converter; // function to convert HA state to device state, assigned on construction by HADeviceStore

    constructor(store, entity, converter) {
        this.#store = store;
        this.#entity = entity;
        this.#converter = converter;
    }

    /*
    * Sets the entity information for the device and triggers a state update if the state has changed.
    * Called by HADeviceStore.update() when a new state message is received from the HA socket.
    * It compares the old state with the new state and triggers a state update if they are different.
    * This ensures that the device state is kept in sync with the Home Assistant state.
    */
    setEntity(entity) {
        const oldState =
            this.state;

        this.#entity = entity;

        const newState =
            this.state;

        if (oldState === newState) {
            return;
        }

        this.#triggerStateUpdateEvent();
    }

    /*
    * Triggers the state update event for all registered listeners.
    * Called from any method that changes the device state, such as setEntity().
    */
    #triggerStateUpdateEvent() {
        if (this.#listeners.length === 0) {
            return;
        }
        
        const state = this.state;

        for (const listener of this.#listeners) {
            listener(this.state);
        }
    }

    addListener(callback) {
        this.#listeners.push(callback);
    }

    get state() {
        return this.#converter.toGUI(
            this.#entity.state
        );
    }

    /*
    * Callback used by components when the user changes the device state.
    * Requests the state change via the store, receives the actual entity
    * from Home Assistant and updates the local entity.
    * If Home Assistant accepted the requested state, nothing happens.
    * If Home Assistant returned a different state, components are notified.
    */
    async updateCallback(state) {
        const newEntity = {
            ...this.#entity,
            state: this.#converter.toHA(state)
        };

        const confirmedEntity = await this.#store.setState(newEntity);

        if (confirmedEntity) {
            this.#entity = confirmedEntity;
        }

        const actualState = this.state;

        if (state !== actualState) {
            this.#triggerStateUpdateEvent();
        }
    }
}
