import { expect } from 'chai'
import { Metric, MetricsHandler } from './metrics'
import { User, UserHandler } from './users'
import { LevelDB } from "./leveldb"
import { test } from 'mocha'

const dbPath: string = 'db_test'
let dbUser: UserHandler
let properUser: User
const email = "test@test.com"
const properName = "properUserName"
const password = "123"

describe('Users', function () {
    before(function () {
        LevelDB.clear(dbPath);
        dbUser = new UserHandler(dbPath);
        properUser = new User(properName, email, password);

    })

    describe('#Basic User Functions', function () {
        it('password stored should be different than input password', function () {
            let storedPassword = properUser.getPassword()
            expect(storedPassword).is.not.null;
            expect(storedPassword).is.not.equal(password);
        })

        it('should validate correct password to true', function () {
            let passwordIsCorrect = properUser.validatePassword(password);
            expect(passwordIsCorrect).is.true;
        })

        it("should validate incorrect password to false", function () {
            let passwordIsCorrect = properUser.validatePassword(password + "1");
            expect(passwordIsCorrect).is.false;
        })
    })

    describe("#Save user to database", function() {
        it("should save ")
    });

    after(function () {
        dbUser.db.close()
    })
})