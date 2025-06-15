class Interpreter{
    constructor(payload, repo){
        this.payload = payload;
        this.repo = repo;
    }

    async interpret() {
        return this.#action();
    }

    async #action() {
        if (!this.repo || typeof this.repo[this.payload.action] !== 'function') {
            throw new Error(`Invalid action: ${this.payload.action}`);
        }
        return await this.repo[this.payload.action](this.payload.value);
    }
}

module.exports = Interpreter;
