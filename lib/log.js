module.exports = {
    info: function() {
        console.log.apply(null,arguments);   
    },
    debug: function() {
        console.debug.apply(null,arguments);   
    },
    error: function() {
        console.error.apply(null,arguments);   
    },
    warning: function() {
        console.warning.apply(null,arguments);   
    },
};
