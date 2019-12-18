/**
 * A Structure have a signature and fields.
 * @access private
 */
export default class Structure {
    /**
     * Create new instance
     */
    constructor(public signature: number, public fields: any[]) {
    }

    toString() {
        let fieldStr = '';

        for (let i = 0; i < this.fields.length; i++) {
            if (i > 0) {
                fieldStr += ', ';
            }
            fieldStr += this.fields[i];
        }

        return 'Structure(' + this.signature + ', [' + fieldStr + '])';
    }
}
