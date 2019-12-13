import {LevelDB} from './leveldb'
import WriteStream from 'level-ws'

export class Metric {
  public timestamp: string
  public value: number

  constructor(ts: string, v: number) {
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

    public save(key: number, metrics: Metric[], callback: (error: Error | null) => void) {
        const stream = WriteStream(this.db)
        stream.on('error', callback)
        stream.on('close', callback)
        metrics.forEach((m: Metric) => {
            stream.write({ key: `metric:${key}:${m.timestamp}`, value: m.value })
        })
        stream.end()
      }

    public getAll(callback: (error: Error | null, result: any) => void) {
        let metrics: Metric[] = []
        const stream = this.db.createReadStream()
            .on('data', function (data) {
                console.log(data.key, '=', data.value)
                let timestamp: string = data.key.split(':')[2]
                let metric: Metric = new Metric(timestamp, data.value)
                metrics.push(metric)
            })
            .on('error', function (err) {
                callback;
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                callback(null, metrics)
                console.log('Stream ended')
            })
    }


    public getActualKey(key: string, callback: (error: Error | null, result: string) => void){
        let actualKey = "Found no key";
        const stream = this.db.createReadStream()
            .on('data', function (data) {
                console.log(data.key, '=', data.value)
                let keyToCheck: string = data.key.split(':')[1]
                console.log(key === keyToCheck)
                if (key === keyToCheck) {
                    actualKey = data.key;
                };
                console.log(actualKey);
            })
            .on('error', function (err) {
                callback;
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                console.log('Stream ended')
                callback(null, actualKey);
            })
    }

    public delete(key: string, callback: (error: Error | null) => void){        
        
        let err = this.db.del(key, (err) => {
            if (err){
                console.log('Oh my!', err)
                return callback(err)
            }
        })
        callback(err)
    }

    public getOne(key: string, callback: (error: Error | null, result: Metric) => void){
        let returnMetric: Metric;
        const stream = this.db.createReadStream()
            .on('data', function (data) {
                let keyToCheck: string = data.key.split(':')[1]
                if (key === keyToCheck){
                    returnMetric = new Metric(data.key.split(':')[2], data.value);
                };
            })
            .on('error', function (err) {
                callback;
            })
            .on('close', function () {
                console.log('Stream closed')
            })
            .on('end', function () {
                callback(null, returnMetric)
                console.log(returnMetric)
                console.log('Stream ended')
            })
        
        // { key: `metric:${key}${m.timestamp}`, value: m.value }
        // let returnData = this.db.get(key, function (err, value) {
        //     if (err) {
        //         if (err.notFound) {
        //             return callback(err, null)
        //         }
        //         return callback(err, null)
        //     }
        //     callback(null, value)
        // })
    }
}
