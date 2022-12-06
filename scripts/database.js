module.exports = {
    fs: require("fs"),
    dir: "./database.json",
    object: null,
    set(property, value) {
        //Nullの時は読み込みを行う
        if (this.object == null) {
            this.read();
        }

        this.object[property] = value;
        this.store();
    },
    get(property) {
        //Nullの時は読み込みを行う
        if (this.object == null) {
            this.read();
        }

        if (property == null) {
            return this.object;
        }

        return this.object[property];
    },
    read() {
        if (!this.fs.existsSync(this.dir)) {
            this.object = {};
            return;
        }
        this.object = JSON.parse(this.fs.readFileSync(this.dir));
    },
    store() {
        this.fs.writeFileSync(this.dir, JSON.stringify(this.object, null, 2));
    }
};