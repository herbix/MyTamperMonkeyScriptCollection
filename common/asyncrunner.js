var AsyncRunner = (function() {
    function run(func) {
        var nextRun = null;
        
        var onfinish = function(funcResult) {
            if (nextRun != null) {
                nextRun.startSelf(funcResult);
            }
        };
        
        var start = function(data) {
            func(data, onfinish);
        };
        
        var then = function(tFunc) {
            nextRun = run(tFunc);
            nextRun.start = currentRun.start;
            return nextRun;
        }
        
        var delay = function(tFunc, time) {
            return then(function(data, onfinish) {
                setTimeout(function() {
                    tFunc(data, onfinish);
                }, time);
            });
        }
        
        var currentRun = {
            start: start,
            then: then,
            delay: delay,
            
            // private
            startSelf: start
        }
        
        return currentRun;
    }
    
    return {
        run: run
    }
})();