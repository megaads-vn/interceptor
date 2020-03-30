module.exports = RequestHandler;
function RequestHandler() {
    let self = this;    
    this.onRequest = function (req, res) {
        throw new Error("not implemented");
    }    
}
