import HellaBot from './structures/HellaBot';
const { clientId, token, disabled } = require('../config.json');

const cmdArgs = process.argv.slice(2);
const noReg = cmdArgs.includes('noreg');

async function main() {
    await HellaBot.create(token, clientId, disabled, noReg);
}

main();

process.on('unhandledRejection', async (reason, promise) => console.log('Unhandled rejection: ', promise, reason));
process.on('uncaughtException', async (reason, promise) => console.log('Uncaught exception: ', promise, reason));
process.on('uncaughtExceptionMonitor', async (reason, promise) => console.log('Uncaught exception monitor: ', promise, reason));