const executeCrawling = require('./executeThread.js');

const Route = require("./classes/Route.js");
const Ticket = require('./classes/Ticket.js');
const TicketList = require('./classes/TicketList.js');

module.exports = async function process(task) {
    let departure = task.departure;
    let destination = task.destination;
    let departureDate = task.departureDate;
    let paths = task.paths;

    let direct = [[departure, destination], 0];
    let directResult = await runThread(direct, departureDate, 0);

    if (directResult.length != 0) {
        return directResult;
    }

    let cache = new Map();

    for (let present of paths) {
        let path = present[0];
        let result = await runThread(present, departureDate, 1, cache);

        if (result.length != 0) {
            return result;
        }
    }

    return [];
}

function runThread(present, departureDate, flag, cache) {
    return new Promise(async (resolve, reject) => {
        present.push(departureDate);
        
        let resultPerPath = await executeCrawling(present, flag, cache);
        resolve(resultPerPath);
    })
}