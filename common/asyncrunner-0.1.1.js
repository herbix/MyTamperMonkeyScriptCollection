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
            currentRun.then = nextRun.then;
            return nextRun;
        }
        
        var delay = function(tFunc, time) {
            return currentRun.then(function(data, onfinish) {
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
            startSelf: start,
            onFinish: onfinish
        }
        
        return currentRun;
    }
    
    function prepare() {
        var result = run(null);
        result.start = result.onFinish;
        return result;
    }
    
    return {
        run: run,
        prepare: prepare
    }
})();