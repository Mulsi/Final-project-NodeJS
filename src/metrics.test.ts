import { expect } from 'chai'
import { Metric, MetricsHandler } from './metrics'
import { LevelDB } from "./leveldb"
import { test } from 'mocha'

const dbPath: string = 'db_test/metrics'
let dbMet: MetricsHandler
let testMetric: Metric 
let testUsername: string = "testuser"
let metricLikeObject: any
let incorrectMetric: any

describe('Metrics', function () {
    before(function () {
        LevelDB.clear(dbPath)
        dbMet = new MetricsHandler(dbPath)
        testMetric = new Metric(testUsername, "1010", 0);

        metricLikeObject = {
            timestamp: "0000",
            value: -1
        }
        incorrectMetric = {
            username: "fakeuser"
        }
    })

    describe('#getWithUser', function () {
        it('should get empty array on non existing user', function () {
            dbMet.getWithUser("0", function (err: Error | null, result: Metric) {
                expect(err).to.be.null
                expect(result).to.not.be.undefined
                expect(result).to.be.empty
            })
        })
    })

    describe('#save', function () {

        it('should throw error when getting bad object as metric', function () {
            dbMet.save(testUsername, incorrectMetric, function (err: Error | null) {
                expect(err).to.not.be.null;
            })
        })

        it ("should handle non-metric object with both timestamp and value", function(){
            dbMet.save("fakeUsername", metricLikeObject, function (err: Error | null) {
                expect(err).to.be.null;
                dbMet.getWithUser("fakeUsername", function (err: Error | null, result: Metric[]) {
                    expect(err).to.be.null
                    expect(result).to.not.be.undefined
                    expect(result.length).to.equal(1);
                    expect(result[0].timestamp).to.equal(metricLikeObject.timestamp);
                    expect(result[0].value).to.equal(metricLikeObject.value);
                })
            })
        })

        it("should be able to save several metrics to same user", function () {
            dbMet.save(testUsername, testMetric, function (err: Error | null) {
                expect(err).to.be.null;
                dbMet.save(testUsername, metricLikeObject, function (err: Error | null) {
                    expect(err).to.be.null;
                    dbMet.getWithUser(testUsername, function (err: Error | null, result: Metric[]) {
                        expect(err).to.be.null
                        expect(result).to.not.be.undefined
                        expect(result.length).to.equal(2);
                    })
                })
            })
        })
    })

    describe("#delete", () => {
        it("should handle deleting from non-existing user", () => {
            dbMet.delete("nonExistingUser", metricLikeObject);
        });

        it("should correctly delete a metric", () => {
            dbMet.save(testUsername, testMetric, (err: Error | null) => {
                expect(err).to.be.null;
                dbMet.getWithUser(testUsername, (err: Error | null, result: Metric[]) => {
                    let testMetricExists = false;
                    result.forEach((item) => {
                        if (item.timestamp === testMetric.timestamp) {testMetricExists = true};
                    })
                    expect(testMetricExists).is.true;
                    dbMet.delete(testUsername, testMetric.timestamp);
                    dbMet.getWithUser(testUsername, (err: Error | null, result: Metric[]) => {
                        result.forEach((item) => {
                            expect(item.timestamp).is.not.equal(testMetric.timestamp);
                        })
                    });
                });
            });
        });
    });

    after(function () {
        dbMet.db.close()
    })
})


// const a: number = 0

// describe('Metrics', function () {
//     it('should save and get', function () {
//         expect(a).to.equal(0)
//     })
// })