'use strict';

// Forked from semaphore project

const debug = require('debug')('timeout-semaphore');

var semaphoreId=0;

function createSemaphore(defaultCapacity, defaultTimeout) {
  var semaphore = {
      capacity: defaultCapacity || 1,
      current: 0,

      take: function(timeout, task) {
        var n=1;
        if (arguments.length===1) {
          task=timeout;
          timeout=defaultTimeout;
        }
        
        var sid=semaphoreId++;
        
        if (debug.enabled) {
          debug("take", "Take semaphore #", sid, "timeout=", timeout,
                "n=", n,
                "semaphore.current=", semaphore.current,
                "semaphore.capacity=", semaphore.capacity);
        }

        var item = function(callback) {
          if (item.timeoutId) {
            clearTimeout(item.timeoutId);
            delete item.timeoutId;
          }

          return semaphore._leave(item);          
        }
        item.n = n;
        item.task = task;
        item.left = false;
        item.timeout = timeout;
        item.sid = sid;
        item.start=Date.now();

        if (semaphore.current + item.n > semaphore.capacity) {
          if (!semaphore.queue) {
            semaphore.queue=[];
          }
          return semaphore.queue.push(item);
        }
        
        semaphore._run(item);
      },
      
      _run: function(item) {
        if (item.timeout) {
          item.timeoutId = setTimeout(item, item.timeout);
        }

        semaphore.current += item.n;
        
        setImmediate(() => {
          item.task(item);
        });
      },

      _leave: function(item, timeoutLeave) {

        if (item.left) {
          if (debug.enabled) {
            debug("_leave", "ALREADY LEFT: semaphore #", item.sid, "n=",item.n,"current=",semaphore.current);
          }
          return false;
        }
        item.left=true;
        item.end=Date.now();

        if (debug.enabled) {
          var dt=item.end-item.start;
          debug("_leave", "Leave semaphore #", item.sid, "n=",item.n,"current=",semaphore.current,"ms=",dt);
        }


        var n = item.n;

        semaphore.current -= n;

        if (!semaphore.queue || !semaphore.queue.length) {
          if (semaphore.current < 0) {
            throw new Error('leave called too many times.');
          }

          return true;
        }
        
        var item = semaphore.queue[0];

        if (item.n + semaphore.current > semaphore.capacity) {
          return;
        }

        semaphore.queue.shift();

        semaphore._run(item);
        
        return true;
      }
  };

  return semaphore;
};

module.exports = createSemaphore;