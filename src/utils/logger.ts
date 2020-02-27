export default function logger(args: any[], type: 'log' | 'time' | 'timeEnd' | 'error' = 'log') {
    if (process.env.TAPESTRY_DEBUG) {
        console[type](...args);
    }
}
