import {LevelDB} from './leveldb'
import WriteStream from 'level-ws'

export class Metric {
    public username: string
    public timestamp: string
    public value: number

    constructor(un: string, ts: string, v: number) {
        this.username = un
        this.timestamp = ts
        this.value = v
    }
}



// New handler from lab 3
export class MetricsHandler {
    public db: any

    constructor(dbPath: string) {
        this.db = LevelDB.open(dbPath)
    }

    public save(username: string, metric: any, callback: (error: Error | null) => void) {
        const stream = WriteStream(this.db)
        stream.on('error', callback)
        stream.on('close', callback)
        stream.write({ key: `metric:${username}:${metric.timestamp}`, value: metric.value })
        stream.end()
    }



    public getAll(callback: (error: Error | null, result: Metric[] | null) => void) {
        // Outdated method, use getWithUsername instead
        let metrics: Metric[] = []
        const stream = this.db.createReadStream()
            .on('data', function (data) {
                //let id: string = data.key.split(':')[1]
                console.log(data.key, '=', data.value)
                let dataElements = data.key.split(':');
                let username: string = dataElements[1];
                let timestamp: string = dataElements[2];
                let metric: Metric = new Metric(username, timestamp, data.value)
                metrics.push(metric)
            })
            .on('error', function (err) {
                callback(err, null);
            })
            .on('close', function () {
                callback(null, metrics)
                console.log('Stream closed')
            })
            .on('end', function () {
                callback(null, metrics)
                console.log('Stream ended')
            })
    }

    
    //Delete user's metric in the database
    
    public delete(username: string, timestamp: string) {
    let key : string = "metric:"+username+":"+timestamp+""
    this.db.del(key, (err)=>null)
    }
    

     //Add a new metric in user's database
    public add(username : string, timestamp: string, value : string) {
        let key : string = "metric:"+username+":"+timestamp+""
        let Value : string = value
        this.db.put(key,Value, (err)=>null)
    }



    // Do we need getOne? Archived in case of later use
    // public getOne(key: string, callback: (error: Error | null, result: Metric) => void){
    //     let returnMetric: Metric;
    //     const stream = this.db.createReadStream()
    //         .on('data', function (data) {
    //             let keyToCheck: string = data.key.split(':')[1]
    //             if (key === keyToCheck){
    //                 returnMetric = new Metric(data.key.split(':')[1], data.key.split(':')[2], data.value);
    //             };
    //         })
    //         .on('error', function (err) {
    //             callback;
    //         })
    //         .on('close', function () {
    //             console.log('Stream closed')
    //         })
    //         .on('end', function () {
    //             callback(null, returnMetric)
    //             console.log(returnMetric)
    //             console.log('Stream ended')
    //         })
    // }

    public getWithUser(username: any, callback: (error: Error | null, result: any | null) => void) {
        let metrics: Metric[] = []

        this.db.createReadStream()
            .on('data', function (data) {
                if (data.key.split(':')[1] === username) {
                    let username: string = data.key.split(':')[1];
                    let timestamp: string = data.key.split(':')[2];
                    let metric: Metric = new Metric(username, timestamp, data.value);
                    metrics.push(metric)
                    // metrics.push(data)
                }
            })
            .on('error', function (err) {
                callback(err, null);
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                callback(null, metrics);
                console.log('Stream ended')
            })
    }    
}
