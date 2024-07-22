class Logger {
    static systemError($tag, $error) {
        console.log(' -- ' + $tag + ' -- \n', $error);
    }
}

export default Logger;
