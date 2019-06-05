module.exports = {
    info: function() {
        if (process.env.DEV) {
            console.log.apply(null,arguments);  
        } 
    },
    debug: function() {
        if (process.env.DEV) {
            console.debug.apply(null,arguments);   
        }
    },
    error: function() {
        if (process.env.DEV) {
            console.error.apply(null,arguments);   
        }
    },
    warning: function() {
        if (process.env.DEV) {
            console.warning.apply(null,arguments);  
        } 
    },
};
