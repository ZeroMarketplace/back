class Logger {
    static systemError($tag, $error) {
        console.log(' -- ' + $tag + ' -- \n', $error);
    }
}

module.exports = Logger;