# node-timeoutSemaphore
Semaphore with a timeout limit

Install:
npm install semaphore

Limit simultaneous access to a resource.

```javascript
// Create
var sem = require('semaphore')(capacity, timeoutMs_Or_0forInfinity);

// Take
sem.take((leaveFunc) => {
	// Do what you want
	
	var alreadyLeft = leaveFunc();
	// Returns FALSE if the lock has been already released
}
```
