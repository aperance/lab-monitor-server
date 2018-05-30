class Watcher {
  constructor(ipAddress, deviceStore, fetch, config) {
    const {
      polling: { port, resource, sequenceKey, maxRetries }
    } = config;

    this.ipAddress = ipAddress;
    this.deviceStore = deviceStore;
    this.fetch = fetch;
    this.maxRetries = maxRetries;
    this.sequenceKey = sequenceKey;
    this.url =
      "http://" + ipAddress + ":" + port + resource + "?" + sequenceKey + "=";
  }

  start() {
    this.poll();
  }

  poll(sequence = 0, count = 0, status = "initial") {
    // Fetch state data from device, using url and timeout value from config.
    this.fetch(this.url + sequence, { timeout: 60000 })
      // Extract string from response object.
      .then(res => res.text())
      // Parse result string, saving data to device store. Perform new poll,
      // with latest sequence key (if exists), resetting retry count to 0.
      .then(res => {
        try {
          return eval(res.replace("display(", "("));
        } catch (e) {
          throw new EvalError();
        }
      })
      .then(deviceData => {
        if (status !== "connected")
          console.log("Connection established with " + this.ipAddress);
        this.deviceStore.set(this.ipAddress, deviceData);
        this.poll(deviceData[this.sequenceKey] || 0, 0, "connected");
      })
      .catch(err => this.errorHandler(err, count, status));
  }

  errorHandler(err, count, status) {
    if (err.name === "FetchError" && err.type == "request-timeout") {
      console.log(this.ipAddress + " timed out. Restarting poll...");
      this.poll(0, 0, "connected");
    } else {
      if (status === "connected") {
        console.log("Setting " + this.ipAddress + " as disconnected");
        this.deviceStore.setInactive(this.ipAddress);
      }
      if (err.name === "EvalError")
        console.log("Error parsing response from " + this.ipAddress);
      else if (err.name === "FetchError" && err.type === "system") {
        if (status === "initial")
          console.log("No device detected at " + this.ipAddress + ". Exiting.");
        else {
          if (count >= this.maxRetries)
            console.log("Maximum retries for " + this.ipAddress);
          else {
            console.log("Connection failed for " + this.ipAddress);
            console.log("Attempt " + count);
            this.poll(0, count + 1, "disconnected");
          }
        }
      } else console.log(err);
    }
  }
}

module.exports = Watcher;

// // Exports factory function used for dependency injection.
// exports.createWatcher = (ipAddress, deviceStore, fetch, config) => {
//   // Extract necessary values from config object.
//   const {
//     fetch: { port, resource, sequenceKey },
//     retryInterval,
//     maxRetries
//   } = config.polling;

//   // Construct url from IP address and configuration parameters.
//   const url = "http://" + ipAddress + ":" + port + resource;

//   const watcher = {
//     state: 0,
//     lastAttempt: null,
//     start() {
//       this.poll();
//     },

//     poll(sequence = 0, count = 0, status = "initial") {
//       const evalWrapper = x => {
//         try {
//           return eval(x);
//         } catch (e) {
//           throw new EvalError();
//         }
//       };

//       // Fetch state data from device, using url and timeout value from config.
//       fetch(url + "?" + sequenceKey + "=" + sequence, { timeout: 60000 })
//         // Extract string from response object.
//         .then(res => res.text())
//         // Parse result string, saving data to device store. Perform new poll,
//         // with latest sequence key (if exists), resetting retry count to 0.
//         .then(res => {
//           const deviceData = evalWrapper(res.replace("display(", "("));
//           if (status !== "connected")
//             console.log("Connection established with " + ipAddress);
//           deviceStore.set(ipAddress, deviceData);
//           this.poll(deviceData[sequenceKey] || 0, 0, "connected");
//         })
//         .catch(err => this.errorHandler(err, count, status));
//     },

//     errorHandler(err, count, status) {
//       if (err.type == "request-timeout") {
//         console.log(ipAddress + " timed out. Restarting poll...");
//         this.poll(0, 0, "connected");
//       } else {
//         if (status === "connected") {
//           console.log("Setting " + ipAddress + " as disconnected");
//           deviceStore.setInactive(ipAddress);
//         }
//         if (err.code === "ETIMEDOUT" || "ECONNRESET" || "ECONNREFUSED") {
//           if (status === "initial")
//             console.log("No device detected at " + ipAddress + ". Exiting.");
//           else {
//             if (count >= maxRetries)
//               console.log(
//                 "Maximum retries attempted for " + ipAddress + ", stopping poll"
//               );
//             else {
//               console.log(
//                 "Connection failed for " + ipAddress + "(Attempt " + count + ")"
//               );
//               this.poll(0, count + 1, "disconnected");
//             }
//           }
//         } else if (err === "EvalError")
//           console.log("Error parsing response from " + ipAddress);
//         else console.log(err);
//       }
//     }
//   };

//   // Wrapper function to catch errors parsing response string.
//   const evalWrapper = x => {
//     try {
//       return eval(x);
//     } catch (e) {
//       throw new EvalError();
//     }
//   };

//   return watcher;
// };
