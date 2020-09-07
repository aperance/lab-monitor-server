# QA Lab Monitor

A utility that monitors the state of multiple embedded devices and displays the consolidated data to the user through a dashboard interface. This project was created to help me quickly troubleshoot issues as part of my job QA testing embedded devices. Previously I would need to keep track of the IP addressses of all devices being tested and manually access their APIs to collect data.

The backend component is a Node.js server that contiuously polls multiple embedded devices and requests their current state using a provided api. The frontend component is a React/Redux application which receives the current state for all devices via a websocket connection and displays it to the user.

This repository stores the source code for the backend only. The frontend repository can be found at <https://www.github.com/aperance/lab-monitor-client>.

