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

    public save(username: string, metric: Metric, callback: (error: Error | null) => void) {
        if (!metric || metric.timestamp === undefined || metric.value === undefined){
            callback(new Error("Invalid input object"));
        }
        else if (!username) { callback(new Error("No input username"))}
        else{
            const stream = WriteStream(this.db)
            stream.on('error', function (err) {
                console.log(err)
                if (err) callback(err);
                else callback(null);
            })
            stream.on('close', function () {
                callback(null);
            })
            stream.write({ key: `metric:${username}:${metric.timestamp}`, value: metric.value });
            stream.end();
        }
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
            })
            .on('end', function () {
                callback(null, metrics)
            })
    }

    
    
    
    public delete(username: string, timestamp: string) {
        let key : string = "metric:"+username+":"+timestamp+""
        this.db.del(key, (err)=>null)
    }

    //Delete user's metric in the database
    public deleteAllByUser(username: string) {
        this.getWithUser(username, (error: Error | null, result: any | null) => {
            if (result) {
                result.forEach(metric => {
                    let key: string = "metric:" + username + ":" + metric.timestamp + ""
                    this.db.del(key, (err) => null)
                });

            }
        });
    }

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
            })
            .on('end', function () {
                callback(null, metrics);
            })
    }    
}
