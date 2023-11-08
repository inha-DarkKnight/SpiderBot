const {Worker} = require('worker_threads');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const crawl = require('./crawlingThread.js');
const Route = require("./classes/Route.js");

const Ticket = require('./classes/Ticket.js');
const TicketList = require('./classes/TicketList.js');

/*
    [input]
    class Task
        departure;
        destination;
        departureDate;
        paths
*/
/*
    [output]
    class TicketList {
        Tickets = [ticket1, ticket2, ....]
    }

    class Ticket {
        path = [route1, route2, route3]
    }

    class route {
        departure
        destination
        airline
        departureDate
        destinationDate
        price
    }
*/
module.exports = async function process(task) {
    let departure = task.departure;
    let destination = task.destination;
    let departureDate = task.departureDate;
    let paths = task.paths;
    
    let result = [];
    let promises = [];

    for (let present of paths) {
        present.push(departureDate);
        let promise = runThread(present);
        promises.push(promise);
    }

    result = await Promise.all(promises);

    for (let resultPerPath of result) {
        let flag = true;
        for (let tempPath of resultPerPath) {
            if (tempPath.length === 0) {
                flag = false;
                break;
            }
        }

        if (flag) {
            makeTicket(resultPerPath, [], 0, path, result);
        }
    }

    return new TicketList(result);
}

function makeTicket(resultPerPath, tempArray, index, path, result) {
    if (tempArray.length === 0) {
        let routes = resultPerPath[index];

        for (let route of routes) {
            tempArray.push(route);
            makeTicket(resultPerPath, tempArray, index + 1, path, result);
            tempArray.pop();
        }

        return;
    }

    if (index == resultPerPath.length) {
        result.push(new Ticket(path, Object.assign([], tempArray)));
        return;
    }

    let routes = resultPerPath[index];

    for (let route of routes) {
        tempArray.push(route);
        makeTicket(resultPerPath, tempArray, index + 1, path, result);
        tempArray.pop();
    }
}


async function run(flight) {
    const result = await runThread(flight);
    
    return result;
}

function runThread(present) {
    return new Promise((resolve, reject) => {
        const worker = new Worker("./executeThread.js");

        worker.on('message', (result) => {
            resolve(result);
        })
        worker.on('error', (error) => {
            reject(error);
        })
        worker.on('exit', (code) => {
            if (code != 0) {
                reject(new Error(`exit code ${code}`));
            }
        })

        worker.postMessage(present);
    })
}

function crawlingInfo(url, departure, destination, date, people) {

}
